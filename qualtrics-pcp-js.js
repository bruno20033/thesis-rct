/* ====================================================================
 * QUALTRICS PCP POST-TEST BRIDGE — Add JavaScript snippet.
 *
 * Paste this ENTIRE file into the "Add JavaScript" panel (gear icon →
 * Add JavaScript) of BOTH unaided PCP post-test questions:
 *   • Post-test 1 (immediate)  — Question Text iframe → qualtrics-pcp-posttest1.html
 *   • Post-test 2 (delayed)    — Question Text iframe → qualtrics-pcp-posttest2.html
 *
 * The bridge is identical for both; the iframe `src` (the hosted HTML
 * page) decides which block of items appears. Question Text for each:
 *   <iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest1.html?pid=${e://Field/ResponseID}"
 *           width="100%" style="border:none;min-height:700px"></iframe>
 *
 * It listens for the renderer's postMessages and writes Embedded Data.
 * NO answer key is involved — responses (chosen option LETTER), reaction
 * time, and timeout are stored per item; correctness is scored OFFLINE
 * against PCP_KEY in pcp_scoring.js.
 *
 * --------------------------------------------------------------------
 * EMBEDDED DATA FIELDS TO DECLARE (Survey Flow → Embedded Data block).
 * Undeclared fields are dropped silently by Qualtrics.
 *
 *   Per item (16 immediate + 16 delayed = 32 ids × 3 fields):
 *     pcp_<id>_response, pcp_<id>_rt, pcp_<id>_timeout
 *   where <id> ∈ posttest1: rem_sa_1..4, und_sa_1..4, ana_sa_1/2/3/9, eval_sa_1..4
 *                posttest2: rem_sa_5/6/7/8, und_sa_5..8, ana_sa_5/6/7/8, eval_sa_5..8
 *     (full id = "pcp_" + the above, e.g. pcp_rem_sa_1_response)
 *
 *   Per block (posttest1, posttest2) × 7:
 *     pcp_<block>_completed, pcp_<block>_total_time, pcp_<block>_items_answered,
 *     pcp_<block>_attempted, pcp_<block>_order, pcp_<block>_total,
 *     pcp_<block>_responses   (JSON blob, authoritative for offline scoring)
 * ==================================================================== */

Qualtrics.SurveyEngine.addOnReady(function () {
  var qThis = this;
  qThis.hideNextButton();

  // Qualtrics wraps Question Text in <label for="...">, which can intercept
  // clicks inside the iframe. Remove the association.
  var labelEl = qThis.questionContainer
    ? qThis.questionContainer.querySelector('label.QuestionText')
    : null;
  if (labelEl && labelEl.getAttribute('for')) labelEl.removeAttribute('for');

  function handleMessage(event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;
    var Q = Qualtrics.SurveyEngine;

    if (data.type === 'pcp_item_response') {
      try {
        // data.itemId already carries the "pcp_" prefix (e.g. "pcp_rem_sa_1") — do NOT add it again.
        Q.setEmbeddedData(data.itemId + '_response', String(data.response || ''));
        Q.setEmbeddedData(data.itemId + '_rt',       String(data.rt      || 0));
        Q.setEmbeddedData(data.itemId + '_timeout',  String(data.timeout || false));
      } catch (e) { console.warn('[PCP bridge] item write failed:', e); }
    }

    if (data.type === 'pcp_block_complete' && data.embeddedData) {
      try {
        Object.keys(data.embeddedData).forEach(function (k) {
          Q.setEmbeddedData(k, String(data.embeddedData[k]));
        });
      } catch (e) { console.warn('[PCP bridge] block write failed:', e); }
    }

    if (data.type === 'rct_complete') {
      qThis.showNextButton();
    }

    if (data.type === 'rct_height' && typeof data.value === 'number') {
      var h = Math.max(600, Math.min(1800, data.value + 16));
      var iframes = qThis.questionContainer
        ? qThis.questionContainer.getElementsByTagName('iframe')
        : document.querySelectorAll('.QuestionBody iframe');
      for (var i = 0; i < iframes.length; i++) iframes[i].style.height = h + 'px';
    }
  }

  window.addEventListener('message', handleMessage, false);
  this.addOnUnload && this.addOnUnload(function () {
    window.removeEventListener('message', handleMessage, false);
  });

  console.log('[PCP bridge] post-test block — listening.');
});
