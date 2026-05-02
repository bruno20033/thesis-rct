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
        Q.setEmbeddedData('prompt_count',    String(log.prompt_count || 0));
        Q.setEmbeddedData('session_id',      log.session_id || '');
        if (log.answers) {
          Object.keys(log.answers).forEach(function (qid) {
            var v = log.answers[qid];
            Q.setEmbeddedData(qid + '_answer', v === null || v === undefined ? '' : String(v));
          });
        }
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
