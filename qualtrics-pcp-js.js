/* ====================================================================
 * QUALTRICS PCP POST-TEST BRIDGE — Add JavaScript snippet.
 *
 * Paste into the "Add JavaScript" panel of the unaided PCP post-test
 * question. Question Text is a single iframe:
 *   immediate (this survey):  qualtrics-pcp-posttest1.html
 *   delayed   (Session 2):    qualtrics-pcp-posttest2.html
 *   <iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest1.html?pid=${e://Field/ResponseID}"
 *           width="100%" style="border:none;min-height:700px"></iframe>
 *
 * ── ONE embedded-data field holds the whole block ──────────────────
 * A JSON array, one dict per item (presentation order):
 *   { id, chart_id, format, answer, rt_ms, timeout }
 * No answer key ships here — correctness is scored OFFLINE
 * (pcp_score.js against PCP_KEY in pcp_scoring.js).
 *
 * Reuse an existing declared field (POSTTEST_FIELD). The immediate and
 * delayed post-tests live in SEPARATE surveys, so both may safely use the
 * same field name within their own survey.
 * ==================================================================== */
Qualtrics.SurveyEngine.addOnReady(function () {
  var qThis = this;
  var POSTTEST_FIELD = 'post_test_1_q';   // existing declared field the post-test array is saved to

  qThis.hideNextButton();

  // Qualtrics wraps Question Text in <label for="...">, which can intercept
  // clicks inside the iframe. Remove the association.
  var labelEl = qThis.questionContainer ? qThis.questionContainer.querySelector('label.QuestionText') : null;
  if (labelEl && labelEl.getAttribute('for')) labelEl.removeAttribute('for');

  function handleMessage(event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;
    var Q = Qualtrics.SurveyEngine;

    if (data.type === 'pcp_block_complete' && data.embeddedData) {
      try {
        // The renderer already serialised the per-item array under
        // pcp_<block>_responses; write that one blob to the reused field.
        var blob = data.embeddedData['pcp_' + (data.block || '') + '_responses'];
        if (blob != null) Q.setEmbeddedData(POSTTEST_FIELD, String(blob));
      } catch (e) { console.warn('[PCP bridge] write failed:', e); }
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

  console.log('[PCP bridge] post-test — listening (one-field mode).');
});
