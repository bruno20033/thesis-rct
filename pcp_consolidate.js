/* ====================================================================
 * pcp_consolidate.js — canonical PCP interaction-consolidation transform.
 *
 * UMD: works as a Node module (`require`) AND a browser global
 * (window.PCP_CONSOLIDATE). ONE source of truth, used by:
 *   - embed-pcp.html   (browser): builds the per-question array at runtime
 *                                  and ships it to the Qualtrics bridge.
 *   - pcp_score.js     (Node):    reads the array back for offline scoring.
 *   - test_consolidate.js (Node): unit tests.
 *
 * consolidate(events, items, condition) -> [ per-question dict ]
 *
 *   events    : log.events     — flat array; each {type, ts, question_id, ...}.
 *               Every event is already stamped with the question_id it
 *               belongs to (embed-pcp.html logEvent), so this is a pure group-by.
 *   items     : computeVLATSummary().items — one per question, in presentation
 *               order: {id, raw_id, chart_id, chart_type, format, answer}.
 *   condition : 'LLM' | 'SEARCH' | 'NOAID' | null.
 *
 * Each output entry:
 *   { id, raw_id, chart_id, chart_type, format, answer, time_ms, interaction }
 *
 *   interaction (LLM)    = { mode:'llm',
 *       turns: [ { prompt, response, response_latency_ms, judge } ] }
 *   interaction (SEARCH) = { mode:'search',
 *       searches: [ { query, clicks: [ {title,url,index,dwell_ms,fallback_clicked} ] } ] }
 *   interaction (NOAID/null) = null
 *
 *   judge = null  (Unrestricted arm: no Judge layer)
 *         | { fidelity, intent, status, active_regen,
 *             fidelity_reasoning, intent_reasoning, latency_ms }
 *
 * The shape is arm-agnostic: Unrestricted simply has judge:null on every turn
 * (no judge_result events exist), so one parser scores every arm.
 * ==================================================================== */
(function (factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;   // Node
  if (typeof window !== 'undefined') window.PCP_CONSOLIDATE = api;          // browser
})(function () {

  function parseTs(t) { var n = Date.parse(t); return isNaN(n) ? null : n; }

  function shapeJudge(e) {
    return {
      fidelity:           (e.fidelity_score == null ? null : e.fidelity_score),
      intent:             (e.intent_score   == null ? null : e.intent_score),
      status:             e.judge_status || null,
      active_regen:       !!(e.active_regen_triggered || e.is_regen_score),
      fidelity_reasoning: e.fidelity_reasoning || null,
      intent_reasoning:   e.intent_reasoning   || null,
      latency_ms:         (e.judge_latency_ms == null ? null : e.judge_latency_ms)
    };
  }

  // LLM arm: pair each prompt with its following response + judge score.
  function buildTurns(evs) {
    var turns = [], cur = null;
    function flush() { if (cur) { turns.push(cur); cur = null; } }
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (e.type === 'prompt') {
        flush();
        cur = { prompt: (e.content == null ? '' : e.content), response: null, response_latency_ms: null, response_ts: null, judge: null };
      } else if (e.type === 'response') {
        if (!cur) cur = { prompt: null, response: null, response_latency_ms: null, response_ts: null, judge: null };
        cur.response = (e.content == null ? '' : e.content);
        cur.response_latency_ms = (e.latency_ms == null ? null : e.latency_ms);
        // ADDITIVE: absolute ISO wall-clock time of the assistant message (same clock as
        // answer_ts). Enables adoption latency = parse(answer_ts) - parse(final response_ts).
        // Do NOT use response_latency_ms for this — it is a monotonic performance.now duration.
        cur.response_ts = (e.ts == null ? null : e.ts);
      } else if (e.type === 'judge_result') {
        if (!cur) cur = { prompt: null, response: null, response_latency_ms: null, response_ts: null, judge: null };
        // Last judge wins (the post-regeneration score is the meaningful final
        // state), but never lose an active-regen flag raised earlier in the turn.
        var prevRegen = cur.judge && cur.judge.active_regen;
        cur.judge = shapeJudge(e);
        if (prevRegen) cur.judge.active_regen = true;
      }
    }
    flush();
    return turns;
  }

  // SEARCH arm: group each query with the results clicked under it.
  function buildSearches(evs) {
    var searches = [], cur = null;
    function flush() { if (cur) { searches.push(cur); cur = null; } }
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (e.type === 'search_query') {
        flush();
        // ADDITIVE query_ts: search-arm "last results-page interaction" time (same wall clock).
        cur = { query: (e.query == null ? '' : e.query), query_ts: (e.ts == null ? null : e.ts), clicks: [] };
      } else if (e.type === 'result_click') {
        if (!cur) cur = { query: null, query_ts: null, clicks: [] };
        cur.clicks.push({
          title: e.title || '', url: e.url || '',
          index: (e.index == null ? null : e.index),
          ts: (e.ts == null ? null : e.ts),   // ADDITIVE: click time (search-arm interaction timestamp)
          dwell_ms: null, fallback_clicked: false
        });
      } else if (e.type === 'result_dwell') {
        // Attach dwell to the most recent matching click (by url) that has none yet.
        var clicks = cur ? cur.clicks : null;
        if (clicks) {
          for (var k = clicks.length - 1; k >= 0; k--) {
            if (clicks[k].url === e.url && clicks[k].dwell_ms == null) {
              clicks[k].dwell_ms = (e.dwell_ms == null ? null : e.dwell_ms);
              if (e.fallback_clicked) clicks[k].fallback_clicked = true;
              break;
            }
          }
        }
      }
    }
    flush();
    return searches;
  }

  // Best-effort time-on-question: first logged event for the item -> its answer_final.
  function questionTime(evs) {
    if (!evs.length) return null;
    var start = parseTs(evs[0].ts), end = null;
    for (var i = evs.length - 1; i >= 0; i--) {
      if (evs[i].type === 'answer_final') { end = parseTs(evs[i].ts); break; }
    }
    if (end == null) end = parseTs(evs[evs.length - 1].ts);
    if (start == null || end == null) return null;
    var d = end - start;
    return d >= 0 ? d : null;
  }

  // ADDITIVE: absolute ISO wall-clock time of answer submission (answer_final event), on the
  // same clock as response_ts / query_ts. Adoption latency = parse(answer_ts) - parse(last tool ts).
  function answerTs(evs) {
    for (var i = evs.length - 1; i >= 0; i--) {
      if (evs[i].type === 'answer_final') return evs[i].ts == null ? null : evs[i].ts;
    }
    return null;
  }

  function consolidate(events, items, condition) {
    events = events || [];
    items  = items  || [];
    var byQ = {};
    for (var i = 0; i < events.length; i++) {
      var qid = events[i].question_id;
      if (qid == null) continue;
      (byQ[qid] || (byQ[qid] = [])).push(events[i]);
    }
    return items.map(function (it) {
      var evs = byQ[it.id] || [];
      var interaction;
      if (condition === 'LLM')         interaction = { mode: 'llm',    turns:    buildTurns(evs) };
      else if (condition === 'SEARCH') interaction = { mode: 'search', searches: buildSearches(evs) };
      else                             interaction = null;
      return {
        id: it.id, raw_id: it.raw_id, chart_id: it.chart_id,
        chart_type: it.chart_type, format: it.format, answer: it.answer,
        time_ms: questionTime(evs),
        answer_ts: answerTs(evs),   // ADDITIVE (adoption latency)
        interaction: interaction
      };
    });
  }

  return { consolidate: consolidate, _buildTurns: buildTurns, _buildSearches: buildSearches };
});
