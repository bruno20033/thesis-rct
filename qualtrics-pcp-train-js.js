/* ====================================================================
 * QUALTRICS QUESTION JAVASCRIPT — PCP *AIDED TRAINING* phase.
 *
 * Paste into the "Add JavaScript" panel of BOTH the LLM and SEARCH
 * training questions (Question Text = a single
 *   <iframe src=".../embed-pcp.html?condition=...&arm=...&pid=...">).
 *
 * ── ONE embedded-data field holds the whole phase ──────────────────
 * A JSON array, one dict per practice question, each bundling the
 * participant's answer AND that question's interaction trace:
 *   LLM-Socratic     turns[] : {prompt, response, response_latency_ms, judge}
 *   LLM-Unrestricted turns[] : same, judge:null
 *   SEARCH           searches[] : {query, clicks:[{title,url,index,dwell_ms,fallback_clicked}]}
 * The array is built by the canonical pcp_consolidate.js transform INSIDE
 * the embed and shipped here ready-made (data.vlat_consolidated); this
 * bridge only writes it. No answer key here — correctness is scored
 * offline (pcp_score.js / PCP_KEY).
 *
 * ── Embedded Data to declare (reuse existing fields; nothing new) ───
 *   TRAIN_FIELD                    (default 'vlat_train_responses') — the array
 *   condition, participant_id, arm (identity; already set by the Randomizer)
 *
 * The full raw InteractionLog is still backed up server-side by the embed
 * (Cloudflare /log endpoint), so this single field is the analysis record.
 * ==================================================================== */
Qualtrics.SurveyEngine.addOnReady(function () {
  var qThis = this;
  var EXPECTED_ORIGIN = null;                    // e.g. 'https://bruno20033.github.io' in production
  var TRAIN_FIELD     = 'vlat_train_responses';  // existing declared field reused for the consolidated array

  qThis.hideNextButton();

  // Qualtrics wraps Question Text in <label for="...">, which can intercept
  // clicks inside the iframe. Remove the association.
  var labelEl = qThis.questionContainer ? qThis.questionContainer.querySelector('label.QuestionText') : null;
  if (labelEl && labelEl.getAttribute('for')) labelEl.removeAttribute('for');

  function handleMessage(event) {
    if (EXPECTED_ORIGIN && event.origin !== EXPECTED_ORIGIN) return;
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;
    var Q = Qualtrics.SurveyEngine;

    if (data.type === 'rct_log_update' && data.payload) {
      var log = data.payload;
      try {
        // Identity (unprefixed, guarded so an empty value can't clobber the Randomizer).
        if (log.condition)      Q.setEmbeddedData('condition',      log.condition);
        if (log.participant_id) Q.setEmbeddedData('participant_id', log.participant_id);
        if (log.arm)            Q.setEmbeddedData('arm',            log.arm);

        // The whole phase in ONE field: per-question dicts with interaction.
        // Primary = the embed's pre-built consolidated array; fallback =
        // responses-only (interaction is still safe in the server-side log).
        var consolidated = data.vlat_consolidated || data.vlat_items || [];
        Q.setEmbeddedData(TRAIN_FIELD, JSON.stringify(consolidated));
      } catch (e) {
        console.warn('[PCP-train bridge] setEmbeddedData failed:', e);
      }
    }

    if (data.type === 'rct_complete') {
      qThis.showNextButton();
    }

    if (data.type === 'rct_height' && typeof data.value === 'number') {
      // Clamp to prevent feedback-loop growth: 600px floor, 1800px ceiling.
      var h = Math.max(600, Math.min(1800, data.value + 16));
      var iframes = qThis.questionContainer
        ? qThis.questionContainer.getElementsByTagName('iframe')
        : document.querySelectorAll('.QuestionBody iframe');
      for (var n = 0; n < iframes.length; n++) iframes[n].style.height = h + 'px';
    }
  }

  window.addEventListener('message', handleMessage, false);
  this.addOnUnload && this.addOnUnload(function () {
    window.removeEventListener('message', handleMessage, false);
  });

  console.log('[PCP-train bridge] listening (one-field consolidated mode).');
});
