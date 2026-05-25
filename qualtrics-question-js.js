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

  // Hide the Next button until the iframe signals completion.
  // NSE uses #next-button (lowercase); classic uses #NextButton.
  // Try the API method first, then fall back to direct DOM hiding.
  try { qThis.hideNextButton(); } catch (e) { /* NSE may not support this */ }
  var nseNext = document.getElementById('next-button');
  if (nseNext) nseNext.style.display = 'none';

  // Qualtrics Text Entry questions wrap Question Text in <label for="...">,
  // which intercepts all clicks inside the iframe. Remove the association.
  var labelEl = qThis.questionContainer
    ? qThis.questionContainer.querySelector('label.QuestionText')
    : null;
  if (labelEl && labelEl.getAttribute('for')) {
    labelEl.removeAttribute('for');
  }

  function handleMessage(event) {
    if (EXPECTED_ORIGIN && event.origin !== EXPECTED_ORIGIN) return;
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;

    if (data.type === 'rct_log_update' && data.payload) {
      var log = data.payload;
      var Q = Qualtrics.SurveyEngine;
      try {
        // -----------------------------------------------------------
        // setEmbeddedData() writes directly to the pre-declared
        // Embedded Data fields in Survey Flow (no prefix needed).
        //
        // NOTE: setJSEmbeddedData() was tested and confirmed NOT to
        // persist data in CSV/JSON exports (May 2026). It writes to
        // __js_<fieldName> but those columns never appear in exports
        // even with "Download all fields" checked. setEmbeddedData()
        // is the method that actually works — verified via export
        // comparison of responses collected before and after the
        // migration attempt.
        //
        // NSE has a ~1 000-char limit per field.  Long JSON values
        // (InteractionLog, interaction_log, all_prompts, all_responses)
        // are truncated here.  Per-turn fields preserve the full data.
        //
        // Fields set by Survey Flow Randomizer (condition, arm,
        // cr_set) are NOT set here — they are handled server-side.
        // -----------------------------------------------------------
        var MAX_ED = 990; // NSE ~1000-char limit with safety margin
        function truncED(s) { return s.length > MAX_ED ? s.slice(0, MAX_ED) + '…[TRUNC]' : s; }
        Q.setEmbeddedData('InteractionLog', truncED(JSON.stringify(log)));
        // Analyst-friendly per-condition dictionary view (see README §
        // "interaction_log dictionary schema" for the exact shape).
        // Written alongside the rich InteractionLog JSON so analysts can
        // read prompts → responses (or queries → click lists) straight
        // out of CSV export without parsing the events array.
        Q.setEmbeddedData('interaction_log', truncED(JSON.stringify(buildInteractionLogDict(log))));
        // condition, arm, cr_set are set by Survey Flow Randomizer — not here.
        Q.setEmbeddedData('participant_id',  log.participant_id || '');
        Q.setEmbeddedData('model_used',      log.model_used || '');
        Q.setEmbeddedData('prompt_count',    String(log.prompt_count   || 0));
        Q.setEmbeddedData('response_count',  String(log.response_count || 0));
        Q.setEmbeddedData('session_id',      log.session_id || '');
        // Judge metadata (Socratic arm only — empty for other arms).
        Q.setEmbeddedData('judge_model',         log.judge_model || '');
        Q.setEmbeddedData('judge_mode',          log.judge_mode  || '');
        Q.setEmbeddedData('judge_call_count',    String(log.judge_call_count    || 0));
        Q.setEmbeddedData('judge_failure_count', String(log.judge_failure_count || 0));
        // Multi-question progress — written on every interaction so
        // analysts can see how far each participant got (and split
        // drop-outs by which question they abandoned on).
        Q.setEmbeddedData('current_question_index', String(log.current_question_index != null ? log.current_question_index : 0));
        Q.setEmbeddedData('question_count',         String(log.question_count        != null ? log.question_count        : 0));
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
          Q.setEmbeddedData('prompt_'                   + k, truncED(prompts[k-1]   || ''));
          Q.setEmbeddedData('response_'                 + k, truncED(responses[k-1] || ''));
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
        Q.setEmbeddedData('last_prompt',        truncED(prompts[prompts.length - 1]     || ''));
        Q.setEmbeddedData('last_response',      truncED(responses[responses.length - 1] || ''));
        Q.setEmbeddedData('last_search_query',  truncED(queries[queries.length - 1]     || ''));

        // Full transcripts (concatenated). Truncated to MAX_ED due to
        // NSE ~1000-char limit. Per-turn fields above preserve the full data.
        Q.setEmbeddedData('all_prompts',        truncED(prompts.join('\n---\n')));
        Q.setEmbeddedData('all_responses',      truncED(responses.join('\n---\n')));
        Q.setEmbeddedData('all_search_queries', truncED(queries.join('\n---\n')));
        Q.setEmbeddedData('all_clicked_urls',   truncED(clicks.map(function (x) { return x.url; }).join('\n')));

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

        // ---------------------------------------------------------
        // CR (Critical Reasoning) mode fields
        // Written from the cr_* properties attached to the message
        // by embed.html's computeCRScore(). These populate the
        // cr_train_* / cr_post_* Embedded Data fields in Qualtrics.
        // ---------------------------------------------------------
        Q.setEmbeddedData('cr_phase', log.phase || '');
        // cr_set is set by Survey Flow Randomizer — not duplicated here.

        if (data.cr_items && Array.isArray(data.cr_items)) {
          var prefix = (log.phase === 'train') ? 'cr_train' : 'cr_post';

          // Aggregate scores
          Q.setEmbeddedData(prefix + '_total', String(data.cr_score != null ? data.cr_score : ''));
          if (prefix === 'cr_post') {
            Q.setEmbeddedData('cr_post_near', String(data.cr_near != null ? data.cr_near : ''));
            Q.setEmbeddedData('cr_post_far',  String(data.cr_far  != null ? data.cr_far  : ''));
          }

          // Per-item fields: answer, correctness, item ID (in presentation order)
          for (var ci = 0; ci < data.cr_items.length; ci++) {
            var crItem = data.cr_items[ci];
            var slot = ci + 1;  // 1-based
            Q.setEmbeddedData(prefix + '_' + slot,         crItem.answer || '');
            Q.setEmbeddedData(prefix + '_correct_' + slot, String(crItem.isCorrect));
            Q.setEmbeddedData(prefix + '_item_' + slot,    crItem.id || '');
          }

          // Per-item timing: extract from answer_final events
          var answerFinals = events.filter(function (e) { return e.type === 'answer_final'; });
          var questionAdvanced = events.filter(function (e) { return e.type === 'question_advanced'; });
          // Build per-question timing by computing gaps between question_advanced events
          // First question starts at log.started_at; each subsequent question starts at its question_advanced event
          var startTimes = [log.started_at ? new Date(log.started_at).getTime() : 0];
          for (var qi = 0; qi < questionAdvanced.length; qi++) {
            startTimes.push(questionAdvanced[qi].ts ? new Date(questionAdvanced[qi].ts).getTime() : 0);
          }
          for (var ti = 0; ti < answerFinals.length; ti++) {
            var finalTs = answerFinals[ti].ts ? new Date(answerFinals[ti].ts).getTime() : 0;
            var startTs = startTimes[ti] || 0;
            var duration = (finalTs && startTs) ? (finalTs - startTs) : 0;
            Q.setEmbeddedData(prefix + '_time_' + (ti + 1), String(duration > 0 ? duration : ''));
          }
        }
      } catch (e) {
        console.warn('[RCT bridge] setEmbeddedData failed:', e);
      }
    }

    if (data.type === 'rct_complete') {
      // Show the Next button — handle both classic (#NextButton) and NSE (#next-button).
      try { qThis.showNextButton(); } catch (e) { /* NSE may not support this */ }
      var nseNextBtn = document.getElementById('next-button');
      if (nseNextBtn) nseNextBtn.style.display = '';
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

  /* =====================================================================
   * buildInteractionLogDict — analyst-friendly per-condition view.
   *
   * Returns a plain object whose schema depends on condition + arm. The
   * canonical schema is documented in README § "interaction_log
   * dictionary schema". Briefly:
   *
   *   SEARCH:
   *     { "<search term>": ["<clicked url>", "<clicked url>", ...], ... }
   *   LLM + unrestricted:
   *     { "<participant prompt>": [<feature_used 0|1>, "<llm response>"], ... }
   *     feature_used = 1 iff the participant clicked "Share chart" for
   *     the current question BEFORE this prompt was sent.
   *   LLM + socratic:
   *     { "<participant prompt>": {
   *         response: "<llm response>",
   *         judge_fidelity_score: <int 1-5 | null>,
   *         judge_fidelity_reasoning: "...",
   *         judge_intent_score: <int 1-4 | null>,
   *         judge_intent_reasoning: "...",
   *         judge_status: "ok" | "timeout" | "parse_error" | "api_error" | ...,
   *         judge_latency_ms: <int | null>
   *       }, ... }
   *
   * Duplicate keys (same prompt or same search query twice) collapse to
   * the LAST occurrence — that's JSON-object semantics. For SEARCH,
   * clicks across repeated queries accumulate into the same list. For
   * the LLM arms, the rich InteractionLog event array preserves every
   * turn losslessly.
   * =================================================================== */
  function buildInteractionLogDict(log) {
    if (!log || !log.events) return {};
    var condition = log.condition || '';
    var arm = log.arm || '';
    var events = log.events;

    if (condition === 'SEARCH') {
      var searchDict = {};
      var currentQuery = null;
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.type === 'search_query' && e.query) {
          currentQuery = String(e.query);
          if (!Object.prototype.hasOwnProperty.call(searchDict, currentQuery)) {
            searchDict[currentQuery] = [];
          }
        } else if (e.type === 'result_click' && e.url && currentQuery) {
          searchDict[currentQuery].push(String(e.url));
        }
      }
      return searchDict;
    }

    if (condition === 'LLM' && arm === 'unrestricted') {
      var unrDict = {};
      var sharedByQid = {};
      var pendingPrompt = null;
      var pendingFeatureUsed = 0;
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.type === 'context_share' && e.question_id) {
          sharedByQid[e.question_id] = true;
        } else if (e.type === 'prompt' && typeof e.content === 'string') {
          pendingPrompt = e.content;
          pendingFeatureUsed = (e.question_id && sharedByQid[e.question_id]) ? 1 : 0;
        } else if (e.type === 'response' && pendingPrompt !== null && typeof e.content === 'string') {
          unrDict[pendingPrompt] = [pendingFeatureUsed, e.content];
          pendingPrompt = null;
        }
      }
      return unrDict;
    }

    if (condition === 'LLM' && arm === 'socratic') {
      // Walk events, build turn list keyed by turn_index so judge_result
      // events (which can arrive interleaved due to passive-mode async)
      // attach to the correct prompt.
      var turns = [];                  // ordered for output
      var byTurnIndex = {};            // 1-based turn_index → turn record
      var promptOrdinal = 0;
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.type === 'prompt' && typeof e.content === 'string') {
          promptOrdinal += 1;
          var rec = { prompt: e.content, response: '', judge: null };
          turns.push(rec);
          byTurnIndex[promptOrdinal] = rec;
        } else if (e.type === 'response' && typeof e.content === 'string') {
          // Attach to the most recent prompt that lacks a response.
          for (var j = turns.length - 1; j >= 0; j--) {
            if (!turns[j].response) { turns[j].response = e.content; break; }
          }
        } else if (e.type === 'judge_result' && !e.is_regen_score && e.turn_index) {
          var tr = byTurnIndex[e.turn_index];
          if (tr) {
            tr.judge = {
              fidelity_score:     e.fidelity_score     != null ? e.fidelity_score     : null,
              fidelity_reasoning: e.fidelity_reasoning != null ? e.fidelity_reasoning : '',
              intent_score:       e.intent_score       != null ? e.intent_score       : null,
              intent_reasoning:   e.intent_reasoning   != null ? e.intent_reasoning   : '',
              judge_status:       e.judge_status       != null ? e.judge_status       : '',
              judge_latency_ms:   e.judge_latency_ms   != null ? e.judge_latency_ms   : null
            };
          }
        }
      }
      var socDict = {};
      turns.forEach(function (t) {
        var entry = { response: t.response };
        if (t.judge) {
          entry.judge_fidelity_score     = t.judge.fidelity_score;
          entry.judge_fidelity_reasoning = t.judge.fidelity_reasoning;
          entry.judge_intent_score       = t.judge.intent_score;
          entry.judge_intent_reasoning   = t.judge.intent_reasoning;
          entry.judge_status             = t.judge.judge_status;
          entry.judge_latency_ms         = t.judge.judge_latency_ms;
        }
        socDict[t.prompt] = entry;
      });
      return socDict;
    }

    return {};
  }

  window.addEventListener('message', handleMessage, false);

  // Cleanup if the question is re-rendered.
  qThis.questionclick = qThis.questionclick || function () {};
  this.addOnUnload && this.addOnUnload(function () {
    window.removeEventListener('message', handleMessage, false);
  });

  console.log('[RCT bridge] listening for iframe postMessage events.');
});
