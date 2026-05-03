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
        var prompts   = [];
        var responses = [];
        var queries   = [];
        var clicks    = [];   // result_click events    (SEARCH condition)
        var dwells    = [];   // result_dwell events    (SEARCH condition)
        var events = log.events || [];
        for (var i = 0; i < events.length; i++) {
          var ev = events[i];
          if      (ev.type === 'prompt'               && ev.content) prompts.push(ev.content);
          else if (ev.type === 'response'             && ev.content) responses.push(ev.content);
          else if (ev.type === 'search_query'         && ev.query)   queries.push(ev.query);
          else if (ev.type === 'result_click'         && ev.url)     clicks.push(ev);
          else if (ev.type === 'result_dwell'         && ev.url)     dwells.push(ev);
        }

        // Per-turn fields — overwrite each one, and clear any that no
        // longer have content (in case the participant deleted history).
        for (var k = 1; k <= MAX_TURNS; k++) {
          var c = clicks[k-1];
          var d = dwells[k-1];
          Q.setEmbeddedData('prompt_'             + k, prompts[k-1]   || '');
          Q.setEmbeddedData('response_'           + k, responses[k-1] || '');
          Q.setEmbeddedData('search_query_'       + k, queries[k-1]   || '');
          Q.setEmbeddedData('search_click_'       + k, c ? (c.url   || '') : '');
          Q.setEmbeddedData('search_click_title_' + k, c ? (c.title || '') : '');
          Q.setEmbeddedData('search_click_query_' + k, c ? (c.query || '') : '');
          Q.setEmbeddedData('search_click_index_' + k, c ? String(c.index != null ? c.index : '') : '');
          Q.setEmbeddedData('search_dwell_ms_'    + k, d && d.dwell_ms != null ? String(d.dwell_ms) : '');
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
