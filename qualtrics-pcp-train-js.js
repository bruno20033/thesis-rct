/* ====================================================================
 * QUALTRICS QUESTION JAVASCRIPT — PCP *AIDED TRAINING* phase.
 *
 * Paste this entire file into the "Add JavaScript" panel of BOTH the
 * LLM and SEARCH training questions (the ones whose Question Text is a
 * single <iframe src=".../embed-vlat.html?..."> tag).
 *
 * This is a DEDICATED bridge, separate from qualtrics-question-js.js
 * (the Critical-Reasoning study's bridge). Do NOT reuse the CR bridge
 * here: that bridge gates all per-turn / aggregate fields behind
 * `if (!pfx)`, and for any phase whose name isn't '' or 'train' the
 * prefix is non-empty, so the chat / search / judge interaction fields
 * would be silently skipped. The PCP training embed reports
 * phase='vlattrain', so it needs a bridge that ALWAYS writes the
 * interaction fields (this phase *is* the productivity measure, RQ2).
 *
 * Namespacing: every phase-specific field is prefixed `pcp_train_`,
 * so nothing here collides with:
 *   - the CR study's fields (cr_*, InteractionLog, prompt_*, judge_*),
 *   - the baseline Mini-VLAT fields  (minivlat_<id>_response, ...),
 *   - the Post-Test full-PCP fields (pcp_<id>_response, ...).
 * The only UNprefixed fields written are the survey-level identity
 * fields condition / participant_id / arm, and only when non-empty
 * (idempotent: they already hold the randomizer's values).
 *
 * postMessage protocol (embed-pcp.html -> this bridge). The vlat_* keys are
 * the embed's inherited wire-protocol field names (shared VLAT/PCP harness);
 * this bridge reads them and re-emits the data as pcp_train_* Embedded Data:
 *   {type:'rct_log_update', payload:<log>,
 *      vlat_total, vlat_answered, vlat_attempted, vlat_items:[...]}
 *   {type:'rct_complete'}                 -> reveal Next button
 *   {type:'rct_height', value:<px>}       -> resize the iframe
 *
 * IMPORTANT — NO client-side answer key. The embed reports only the
 * participant's RESPONSES (per item: id / raw_id / chart / format /
 * answer, in presentation order). Correctness is scored OFFLINE with
 * pcp_scoring.js. This bridge therefore writes responses + timing,
 * never accuracy.
 *
 * --------------------------------------------------------------------
 * EMBEDDED DATA FIELDS TO DECLARE (Survey Flow -> Set Embedded Data,
 * above the training block, so they export as CSV columns):
 *
 *   Identity (shared; likely already declared by the randomizer):
 *     condition, participant_id, arm
 *
 *   Core telemetry:
 *     pcp_train_InteractionLog, pcp_train_interaction_log,
 *     pcp_train_phase, pcp_train_model_used, pcp_train_session_id,
 *     pcp_train_prompt_count, pcp_train_response_count,
 *     pcp_train_current_question_index, pcp_train_question_count
 *
 *   PCP productivity outcome (RQ2 — responses only):
 *     pcp_train_total, pcp_train_answered, pcp_train_attempted,
 *     pcp_train_responses (JSON array, authoritative for scoring),
 *     and per practice item id in {rem_fa_1, und_fa_1, ana_fa_1, eval_fa_10,
 *                                  rem_fa_2, und_fa_2, ana_fa_2, eval_fa_11}:
 *       pcp_train_<id>_answer, pcp_train_<id>_chart,
 *       pcp_train_<id>_format, pcp_train_<id>_slot,
 *       pcp_train_<id>_time
 *
 *   Judge metadata (Socratic arm; empty otherwise):
 *     pcp_train_judge_model, pcp_train_judge_mode,
 *     pcp_train_judge_call_count, pcp_train_judge_failure_count,
 *     pcp_train_judge_avg_fidelity, pcp_train_judge_min_fidelity,
 *     pcp_train_judge_below_threshold_count,
 *     pcp_train_judge_extraction_attempt_count,
 *     pcp_train_judge_total_latency_ms
 *
 *   Per-turn K = 1..20 (chat / search / judge):
 *     pcp_train_prompt_K, pcp_train_response_K,
 *     pcp_train_search_query_K, pcp_train_search_click_K,
 *     pcp_train_search_click_title_K, pcp_train_search_click_query_K,
 *     pcp_train_search_click_index_K, pcp_train_search_dwell_ms_K,
 *     pcp_train_judge_fidelity_K, pcp_train_judge_intent_K,
 *     pcp_train_judge_fidelity_reasoning_K,
 *     pcp_train_judge_intent_reasoning_K, pcp_train_judge_status_K,
 *     pcp_train_judge_latency_ms_K, pcp_train_judge_active_regen_K
 *
 *   Last-turn + transcripts + search aggregates:
 *     pcp_train_last_prompt, pcp_train_last_response,
 *     pcp_train_last_search_query, pcp_train_all_prompts,
 *     pcp_train_all_responses, pcp_train_all_search_queries,
 *     pcp_train_all_clicked_urls, pcp_train_total_clicks,
 *     pcp_train_total_dwell_ms, pcp_train_query_count,
 *     pcp_train_click_count
 *
 * SECURITY: set EXPECTED_ORIGIN to your GitHub Pages origin in
 * production (e.g. 'https://bruno20033.github.io') to reject foreign
 * postMessages. null = accept any (fine while testing).
 * ==================================================================== */

Qualtrics.SurveyEngine.addOnReady(function () {
  var qThis = this;
  var EXPECTED_ORIGIN = null;        // e.g. 'https://bruno20033.github.io'
  var P = 'pcp_train_';             // phase field prefix
  var MAX_TURNS = 20;

  qThis.hideNextButton();

  // Qualtrics Text Entry questions wrap Question Text in <label for="...">,
  // which intercepts clicks inside the iframe. Remove the association.
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
        // --- Survey-level identity (unprefixed, guarded so an empty
        //     value from the embed can never clobber the randomizer). ---
        if (log.condition)      Q.setEmbeddedData('condition',      log.condition);
        if (log.participant_id) Q.setEmbeddedData('participant_id', log.participant_id);
        if (log.arm)            Q.setEmbeddedData('arm',            log.arm);

        // --- Core telemetry (phase-namespaced). ---
        Q.setEmbeddedData(P + 'InteractionLog',  JSON.stringify(log));
        Q.setEmbeddedData(P + 'interaction_log', JSON.stringify(buildInteractionLogDict(log)));
        Q.setEmbeddedData(P + 'phase',           log.phase || '');
        Q.setEmbeddedData(P + 'model_used',      log.model_used || '');
        Q.setEmbeddedData(P + 'session_id',      log.session_id || '');
        Q.setEmbeddedData(P + 'prompt_count',    String(log.prompt_count   || 0));
        Q.setEmbeddedData(P + 'response_count',  String(log.response_count || 0));
        Q.setEmbeddedData(P + 'current_question_index', String(log.current_question_index != null ? log.current_question_index : 0));
        Q.setEmbeddedData(P + 'question_count',         String(log.question_count        != null ? log.question_count        : 0));

        // --- Judge metadata (Socratic arm only — empty otherwise). ---
        Q.setEmbeddedData(P + 'judge_model',         log.judge_model || '');
        Q.setEmbeddedData(P + 'judge_mode',          log.judge_mode  || '');
        Q.setEmbeddedData(P + 'judge_call_count',    String(log.judge_call_count    || 0));
        Q.setEmbeddedData(P + 'judge_failure_count', String(log.judge_failure_count || 0));

        var events = log.events || [];

        // =============================================================
        // Per-turn fields + aggregates. ALWAYS written (this phase is
        // the interaction phase — no pfx gate, unlike the CR bridge).
        // =============================================================
        var prompts    = [];
        var responses  = [];
        var queries    = [];
        var clicks     = [];   // result_click events  (SEARCH)
        var dwells     = [];   // result_dwell events  (SEARCH)
        var judgements = [];   // judge_result on initial drafts (Socratic)
        for (var i = 0; i < events.length; i++) {
          var ev = events[i];
          if      (ev.type === 'prompt'       && ev.content) prompts.push(ev.content);
          else if (ev.type === 'response'     && ev.content) responses.push(ev.content);
          else if (ev.type === 'search_query' && ev.query)   queries.push(ev.query);
          else if (ev.type === 'result_click' && ev.url)     clicks.push(ev);
          else if (ev.type === 'result_dwell' && ev.url)     dwells.push(ev);
          else if (ev.type === 'judge_result' && !ev.is_regen_score) judgements.push(ev);
        }

        for (var k = 1; k <= MAX_TURNS; k++) {
          var c = clicks[k-1];
          var d = dwells[k-1];
          var j = judgements[k-1];
          Q.setEmbeddedData(P + 'prompt_'                   + k, prompts[k-1]   || '');
          Q.setEmbeddedData(P + 'response_'                 + k, responses[k-1] || '');
          Q.setEmbeddedData(P + 'search_query_'             + k, queries[k-1]   || '');
          Q.setEmbeddedData(P + 'search_click_'             + k, c ? (c.url   || '') : '');
          Q.setEmbeddedData(P + 'search_click_title_'       + k, c ? (c.title || '') : '');
          Q.setEmbeddedData(P + 'search_click_query_'       + k, c ? (c.query || '') : '');
          Q.setEmbeddedData(P + 'search_click_index_'       + k, c ? String(c.index != null ? c.index : '') : '');
          Q.setEmbeddedData(P + 'search_dwell_ms_'          + k, d && d.dwell_ms != null ? String(d.dwell_ms) : '');
          Q.setEmbeddedData(P + 'judge_fidelity_'           + k, j && j.fidelity_score != null ? String(j.fidelity_score) : '');
          Q.setEmbeddedData(P + 'judge_intent_'             + k, j && j.intent_score   != null ? String(j.intent_score)   : '');
          Q.setEmbeddedData(P + 'judge_fidelity_reasoning_' + k, j ? String(j.fidelity_reasoning || '').slice(0, 300) : '');
          Q.setEmbeddedData(P + 'judge_intent_reasoning_'   + k, j ? String(j.intent_reasoning   || '').slice(0, 300) : '');
          Q.setEmbeddedData(P + 'judge_status_'             + k, j ? (j.judge_status || '') : '');
          Q.setEmbeddedData(P + 'judge_latency_ms_'         + k, j && j.judge_latency_ms != null ? String(j.judge_latency_ms) : '');
          Q.setEmbeddedData(P + 'judge_active_regen_'       + k, j ? String(!!j.active_regen_triggered) : '');
        }

        // Last-turn convenience fields.
        Q.setEmbeddedData(P + 'last_prompt',       prompts[prompts.length - 1]     || '');
        Q.setEmbeddedData(P + 'last_response',     responses[responses.length - 1] || '');
        Q.setEmbeddedData(P + 'last_search_query', queries[queries.length - 1]     || '');

        // Full transcripts (each Embedded Data field has a ~20 KB cap).
        Q.setEmbeddedData(P + 'all_prompts',        prompts.join('\n---\n'));
        Q.setEmbeddedData(P + 'all_responses',      responses.join('\n---\n'));
        Q.setEmbeddedData(P + 'all_search_queries', queries.join('\n---\n'));
        Q.setEmbeddedData(P + 'all_clicked_urls',   clicks.map(function (x) { return x.url; }).join('\n'));

        // Search aggregates.
        var totalDwell = dwells.reduce(function (s, x) { return s + (x.dwell_ms || 0); }, 0);
        Q.setEmbeddedData(P + 'total_clicks',   String(clicks.length));
        Q.setEmbeddedData(P + 'total_dwell_ms', String(totalDwell));
        Q.setEmbeddedData(P + 'query_count',    String(log.query_count || 0));
        Q.setEmbeddedData(P + 'click_count',    String(log.click_count || 0));

        // Judge aggregates (Socratic arm). Computed over OK judgements;
        // empty string (not 0) when none yet, so "no data" != "all zero".
        var okJudgements = judgements.filter(function (x) { return x.judge_status === 'ok' && typeof x.fidelity_score === 'number'; });
        var fidelitySum  = okJudgements.reduce(function (s, x) { return s + x.fidelity_score; }, 0);
        var fidelityMin  = okJudgements.reduce(function (m, x) { return m == null || x.fidelity_score < m ? x.fidelity_score : m; }, null);
        var belowThreshold     = okJudgements.filter(function (x) { return x.fidelity_score < 3; }).length;
        var extractionAttempts = okJudgements.filter(function (x) { return x.intent_score === 1 || x.intent_score === 2; }).length;
        var totalJudgeLatency  = judgements.reduce(function (s, x) { return s + (x.judge_latency_ms || 0); }, 0);
        Q.setEmbeddedData(P + 'judge_avg_fidelity',             okJudgements.length ? String((fidelitySum / okJudgements.length).toFixed(2)) : '');
        Q.setEmbeddedData(P + 'judge_min_fidelity',             fidelityMin != null ? String(fidelityMin) : '');
        Q.setEmbeddedData(P + 'judge_below_threshold_count',    String(belowThreshold));
        Q.setEmbeddedData(P + 'judge_extraction_attempt_count', String(extractionAttempts));
        Q.setEmbeddedData(P + 'judge_total_latency_ms',         String(totalJudgeLatency));

        // =============================================================
        // PCP responses (the productivity outcome — RQ2). Responses
        // only; correctness scored offline by pcp_scoring.js.
        // The fields ride on the top-level message (data.vlat_*), in
        // parallel with how the CR bridge reads data.cr_items.
        // =============================================================
        if (data.vlat_total     != null) Q.setEmbeddedData(P + 'total',     String(data.vlat_total));
        if (data.vlat_answered  != null) Q.setEmbeddedData(P + 'answered',  String(data.vlat_answered));
        if (data.vlat_attempted != null) Q.setEmbeddedData(P + 'attempted', String(data.vlat_attempted));

        if (data.vlat_items && Array.isArray(data.vlat_items)) {
          // Authoritative, robust-to-shuffle blob for offline scoring.
          Q.setEmbeddedData(P + 'responses', JSON.stringify(data.vlat_items));

          // Per-item timing: gap between each question's start and its
          // answer_final, in presentation order (same approach as the
          // CR bridge). vlat_items is in presentation order, and so are
          // the answer_final events, so index vi pairs them up.
          var answerFinals     = events.filter(function (e) { return e.type === 'answer_final'; });
          var questionAdvanced = events.filter(function (e) { return e.type === 'question_advanced'; });
          var startTimes = [log.started_at ? new Date(log.started_at).getTime() : 0];
          for (var qi = 0; qi < questionAdvanced.length; qi++) {
            startTimes.push(questionAdvanced[qi].ts ? new Date(questionAdvanced[qi].ts).getTime() : 0);
          }

          for (var vi = 0; vi < data.vlat_items.length; vi++) {
            var it  = data.vlat_items[vi];
            var rid = String((it.raw_id != null) ? it.raw_id : it.id).replace(/^pcp_/, '');   // stable item id (pcp_ prefix stripped — field already namespaced)
            Q.setEmbeddedData(P + rid + '_answer', (it.answer == null) ? '' : String(it.answer));
            Q.setEmbeddedData(P + rid + '_chart',  it.chart_id   || '');
            Q.setEmbeddedData(P + rid + '_format', it.format     || '');
            Q.setEmbeddedData(P + rid + '_slot',   String(vi + 1));
            var fin     = answerFinals[vi];
            var finalTs = (fin && fin.ts) ? new Date(fin.ts).getTime() : 0;
            var startTs = startTimes[vi] || 0;
            var dur     = (finalTs && startTs) ? (finalTs - startTs) : 0;
            Q.setEmbeddedData(P + rid + '_time', String(dur > 0 ? dur : ''));
          }
        }
      } catch (e) {
        console.warn('[PCP-train bridge] setEmbeddedData failed:', e);
      }
    }

    if (data.type === 'rct_complete') {
      qThis.showNextButton();
    }

    if (data.type === 'rct_height' && typeof data.value === 'number') {
      // Clamp to prevent any feedback-loop growth. 600px floor leaves
      // room for chart + question + treatment panel; 1800px ceiling is
      // plenty for desktop, with internal scroll handling overflow.
      var h = Math.max(600, Math.min(1800, data.value + 16));
      var iframes = qThis.questionContainer
        ? qThis.questionContainer.getElementsByTagName('iframe')
        : document.querySelectorAll('.QuestionBody iframe');
      for (var n = 0; n < iframes.length; n++) {
        iframes[n].style.height = h + 'px';
      }
    }
  }

  /* =====================================================================
   * buildInteractionLogDict — analyst-friendly per-condition view.
   * Identical to the CR bridge's helper: it is driven by condition+arm
   * (not by phase), so it works unchanged for the PCP training phase.
   *
   *   SEARCH:            { "<query>": ["<clicked url>", ...], ... }
   *   LLM/unrestricted:  { "<prompt>": [<feature_used 0|1>, "<response>"], ... }
   *                      feature_used = 1 iff "Share chart" was clicked
   *                      for the current question before this prompt.
   *   LLM/socratic:      { "<prompt>": { response, judge_fidelity_score,
   *                        judge_fidelity_reasoning, judge_intent_score,
   *                        judge_intent_reasoning, judge_status,
   *                        judge_latency_ms }, ... }
   * Duplicate keys collapse to the last occurrence (JSON-object
   * semantics); the rich pcp_train_InteractionLog preserves every turn.
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
      var turns = [];
      var byTurnIndex = {};
      var promptOrdinal = 0;
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.type === 'prompt' && typeof e.content === 'string') {
          promptOrdinal += 1;
          var rec = { prompt: e.content, response: '', judge: null };
          turns.push(rec);
          byTurnIndex[promptOrdinal] = rec;
        } else if (e.type === 'response' && typeof e.content === 'string') {
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

  this.addOnUnload && this.addOnUnload(function () {
    window.removeEventListener('message', handleMessage, false);
  });

  console.log('[PCP-train bridge] listening for iframe postMessage events.');
});
