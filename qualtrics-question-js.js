/* ====================================================================
 * QUALTRICS QUESTION JAVASCRIPT — paste this entire file into the
 * "Add JavaScript" panel of BOTH the LLM and SEARCH questions.
 *
 * Architecture (modeled on Simple Chat,
 * Bermudez Schettino, Dasmeh & Brinkmann, arXiv:2511.19123):
 *
 *   Qualtrics question text  =  one <iframe> tag, nothing else
 *   This script              =  a postMessage bridge:
 *      iframe -> {type: 'rct_log_update', payload: <log>}  -> Embedded Data
 *      iframe -> {type: 'rct_complete'}                    -> show Next
 *      iframe -> {type: 'rct_height',  value: <px>}        -> resize iframe
 *
 * The iframe (embed.html, served from a public URL) holds the entire
 * experimental UI. Qualtrics never sees that HTML/CSS, so its rich-text
 * editor cannot mangle it. This is the fix for the "Qualtrics breaks
 * the layout" problem.
 *
 * SECURITY NOTE — restrict the iframe origin in production:
 *   var EXPECTED_ORIGIN = 'https://yourname.github.io';   (your host)
 * and check event.origin === EXPECTED_ORIGIN below. Leaving it permissive
 * is fine while you're testing.
 * ==================================================================== */

Qualtrics.SurveyEngine.addOnReady(function () {
  var qThis = this;
  var EXPECTED_ORIGIN = null;   // e.g. 'https://yourname.github.io' — null = accept any

  qThis.hideNextButton();

  function handleMessage(event) {
    if (EXPECTED_ORIGIN && event.origin !== EXPECTED_ORIGIN) return;
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;

    if (data.type === 'rct_log_update' && data.payload) {
      var log = data.payload;
      var Q = Qualtrics.SurveyEngine;
      try {
        Q.setEmbeddedData('InteractionLog', JSON.stringify(log));
        Q.setEmbeddedData('condition',       log.condition || '');
        Q.setEmbeddedData('participant_id',  log.participant_id || '');
        Q.setEmbeddedData('model_used',      log.model_used || '');
        Q.setEmbeddedData('prompt_count',    String(log.prompt_count   || 0));
        Q.setEmbeddedData('response_count',  String(log.response_count || 0));
        Q.setEmbeddedData('session_id',      log.session_id || '');
        // arm: 'socratic' | 'unrestricted' for LLM condition; '' for SEARCH.
        Q.setEmbeddedData('arm',             log.arm || '');
        // Judge metadata (Socratic arm only — empty for other arms).
        Q.setEmbeddedData('judge_model',         log.judge_model || '');
        Q.setEmbeddedData('judge_mode',          log.judge_mode  || '');
        Q.setEmbeddedData('judge_call_count',    String(log.judge_call_count    || 0));
        Q.setEmbeddedData('judge_failure_count', String(log.judge_failure_count || 0));
        if (log.answers) {
          Object.keys(log.answers).forEach(function (qid) {
            var v = log.answers[qid];
            Q.setEmbeddedData(qid + '_answer', v === null || v === undefined ? '' : String(v));
          });
        }

        // -------------------------------------------------------------
        // Flatten prompts and responses into per-turn fields and a
        // concatenated transcript so analysts can read them straight
        // from the Qualtrics CSV without parsing InteractionLog JSON.
        //
        // Per-turn fields are written for up to MAX_TURNS conversation
        // turns. Declare prompt_1..prompt_N and response_1..response_N
        // (and search_query_1..search_query_N) in Survey Flow's
        // Embedded Data so they appear as CSV columns.
        // -------------------------------------------------------------
        var MAX_TURNS = 20;
        var prompts        = [];
        var responses      = [];
        var queries        = [];
        var clicks         = [];   // result_click events    (SEARCH condition)
        var dwells         = [];   // result_dwell events    (SEARCH condition)
        var judgements     = [];   // judge_result events on initial drafts (Socratic arm)
        var events = log.events || [];
        for (var i = 0; i < events.length; i++) {
          var ev = events[i];
          if      (ev.type === 'prompt'               && ev.content) prompts.push(ev.content);
          else if (ev.type === 'response'             && ev.content) responses.push(ev.content);
          else if (ev.type === 'search_query'         && ev.query)   queries.push(ev.query);
          else if (ev.type === 'result_click'         && ev.url)     clicks.push(ev);
          else if (ev.type === 'result_dwell'         && ev.url)     dwells.push(ev);
          // Only the initial-draft Judge result is mirrored to per-turn
          // fields. Judgements on regenerated responses (is_regen_score
          // === true) stay in the InteractionLog JSON for analyst use
          // but don't compete for a flat-field slot.
          else if (ev.type === 'judge_result'         && !ev.is_regen_score) judgements.push(ev);
        }

        // Per-turn fields — overwrite each one, and clear any that no
        // longer have content (in case the participant deleted history).
        for (var k = 1; k <= MAX_TURNS; k++) {
          var c = clicks[k-1];
          var d = dwells[k-1];
          var j = judgements[k-1];
          Q.setEmbeddedData('prompt_'                   + k, prompts[k-1]   || '');
          Q.setEmbeddedData('response_'                 + k, responses[k-1] || '');
          Q.setEmbeddedData('search_query_'             + k, queries[k-1]   || '');
          Q.setEmbeddedData('search_click_'             + k, c ? (c.url   || '') : '');
          Q.setEmbeddedData('search_click_title_'       + k, c ? (c.title || '') : '');
          Q.setEmbeddedData('search_click_query_'       + k, c ? (c.query || '') : '');
          Q.setEmbeddedData('search_click_index_'       + k, c ? String(c.index != null ? c.index : '') : '');
          Q.setEmbeddedData('search_dwell_ms_'          + k, d && d.dwell_ms != null ? String(d.dwell_ms) : '');
          // Judge per-turn fields (Socratic arm). Empty when no judge
          // event for this turn yet (e.g. judge call still in flight in
          // passive mode, or non-Socratic arm).
          Q.setEmbeddedData('judge_fidelity_'           + k, j && j.fidelity_score != null ? String(j.fidelity_score) : '');
          Q.setEmbeddedData('judge_intent_'             + k, j && j.intent_score   != null ? String(j.intent_score)   : '');
          Q.setEmbeddedData('judge_fidelity_reasoning_' + k, j ? String(j.fidelity_reasoning || '').slice(0, 300) : '');
          Q.setEmbeddedData('judge_intent_reasoning_'   + k, j ? String(j.intent_reasoning   || '').slice(0, 300) : '');
          Q.setEmbeddedData('judge_status_'             + k, j ? (j.judge_status || '') : '');
          Q.setEmbeddedData('judge_latency_ms_'         + k, j && j.judge_latency_ms != null ? String(j.judge_latency_ms) : '');
          Q.setEmbeddedData('judge_active_regen_'       + k, j ? String(!!j.active_regen_triggered) : '');
        }

        // Last-turn convenience fields.
        Q.setEmbeddedData('last_prompt',        prompts[prompts.length - 1]     || '');
        Q.setEmbeddedData('last_response',      responses[responses.length - 1] || '');
        Q.setEmbeddedData('last_search_query',  queries[queries.length - 1]     || '');

        // Full transcripts (concatenated). Useful for a quick eyeball.
        // Note: each Qualtrics Embedded Data field has a ~20 KB limit;
        // for very long studies the per-turn fields above are safer.
        Q.setEmbeddedData('all_prompts',        prompts.join('\n---\n'));
        Q.setEmbeddedData('all_responses',      responses.join('\n---\n'));
        Q.setEmbeddedData('all_search_queries', queries.join('\n---\n'));
        Q.setEmbeddedData('all_clicked_urls',   clicks.map(function (x) { return x.url; }).join('\n'));

        // Aggregates for the SEARCH condition.
        var totalDwell = dwells.reduce(function (s, x) { return s + (x.dwell_ms || 0); }, 0);
        Q.setEmbeddedData('total_clicks',   String(clicks.length));
        Q.setEmbeddedData('total_dwell_ms', String(totalDwell));
        Q.setEmbeddedData('query_count',    String(log.query_count || 0));
        Q.setEmbeddedData('click_count',    String(log.click_count || 0));

        // Judge aggregates for the Socratic arm. Computed only over OK
        // judgements; failures are still counted in judge_failure_count
        // (set by the embed and mirrored above). When there are no OK
        // judgements yet, mins/avgs are written as the empty string
        // rather than zero (so analysts can distinguish "no data" from
        // "all turns scored zero").
        var okJudgements = judgements.filter(function (x) { return x.judge_status === 'ok' && typeof x.fidelity_score === 'number'; });
        var fidelitySum  = okJudgements.reduce(function (s, x) { return s + x.fidelity_score; }, 0);
        var fidelityMin  = okJudgements.reduce(function (m, x) { return m == null || x.fidelity_score < m ? x.fidelity_score : m; }, null);
        var belowThreshold = okJudgements.filter(function (x) { return x.fidelity_score < 3; }).length;
        var extractionAttempts = okJudgements.filter(function (x) { return x.intent_score === 1 || x.intent_score === 2; }).length;
        var totalJudgeLatency  = judgements.reduce(function (s, x) { return s + (x.judge_latency_ms || 0); }, 0);
        Q.setEmbeddedData('judge_avg_fidelity',             okJudgements.length ? String((fidelitySum / okJudgements.length).toFixed(2)) : '');
        Q.setEmbeddedData('judge_min_fidelity',             fidelityMin != null ? String(fidelityMin) : '');
        Q.setEmbeddedData('judge_below_threshold_count',    String(belowThreshold));
        Q.setEmbeddedData('judge_extraction_attempt_count', String(extractionAttempts));
        Q.setEmbeddedData('judge_total_latency_ms',         String(totalJudgeLatency));
      } catch (e) {
        console.warn('[RCT bridge] setEmbeddedData failed:', e);
      }
    }

    if (data.type === 'rct_complete') {
      qThis.showNextButton();
    }

    if (data.type === 'rct_height' && typeof data.value === 'number') {
      // Clamp to a sane range to prevent any feedback-loop growth.
      // 600px floor leaves room for the chart + question + treatment;
      // 1800px ceiling is plenty for desktop, with internal scroll for
      // long chat / search histories handling overflow naturally.
      var h = Math.max(600, Math.min(1800, data.value + 16));
      var iframes = qThis.questionContainer
        ? qThis.questionContainer.getElementsByTagName('iframe')
        : document.querySelectorAll('.QuestionBody iframe');
      for (var i = 0; i < iframes.length; i++) {
        iframes[i].style.height = h + 'px';
      }
    }
  }

  window.addEventListener('message', handleMessage, false);

  // Cleanup if the question is re-rendered.
  qThis.questionclick = qThis.questionclick || function () {};
  this.addOnUnload && this.addOnUnload(function () {
    window.removeEventListener('message', handleMessage, false);
  });

  console.log('[RCT bridge] listening for iframe postMessage events.');
});
