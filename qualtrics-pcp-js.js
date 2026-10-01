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

  var frame = qThis.questionContainer && qThis.questionContainer.querySelector('iframe');
  var loadingLayer = null;
  var readyProbe = null;
  var loadingTimer = null;
  function clearLoading() {
    if (readyProbe) clearInterval(readyProbe);
    if (loadingTimer) clearTimeout(loadingTimer);
    readyProbe = loadingTimer = null;
    if (loadingLayer) loadingLayer.remove();
    loadingLayer = null;
  }
  if (frame && frame.parentNode) {
    var holder = frame.parentNode;
    if (window.getComputedStyle(holder).position === 'static') holder.style.position = 'relative';
    if (!document.getElementById('pcp-test-loading-style')) {
      var style = document.createElement('style');
      style.id = 'pcp-test-loading-style';
      style.textContent = '@keyframes pcp-test-spin{to{transform:rotate(360deg)}}' +
        '@media(prefers-reduced-motion:reduce){.pcp-test-spinner{animation:none!important}}';
      document.head.appendChild(style);
    }
    var german = /(?:\?|&)lang=DE/i.test(frame.src);
    loadingLayer = document.createElement('div');
    loadingLayer.setAttribute('role', 'status');
    loadingLayer.setAttribute('aria-live', 'polite');
    loadingLayer.style.cssText = 'position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:14px;background:#fafafa;color:#455a64;' +
      'font:500 15px Arial,sans-serif;text-align:center;';
    var spinner = document.createElement('span');
    spinner.className = 'pcp-test-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    spinner.style.cssText = 'width:40px;height:40px;border:4px solid #cfd8dc;border-top-color:#1976d2;' +
      'border-radius:50%;animation:pcp-test-spin .8s linear infinite;';
    var loadingText = document.createElement('span');
    loadingText.textContent = german ? 'Test wird geladen…' : 'Loading test…';
    loadingLayer.appendChild(spinner);
    loadingLayer.appendChild(loadingText);
    holder.insertBefore(loadingLayer, frame);
    var frameOrigin = '';
    try { frameOrigin = new URL(frame.src).origin; } catch (_) {}
    if (frameOrigin) readyProbe = setInterval(function () {
      if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'rct_ready_probe' }, frameOrigin);
    }, 500);
    frame.addEventListener('load', clearLoading, { once: true });
    loadingTimer = setTimeout(function () {
      if (loadingText.parentNode) loadingText.textContent = german
        ? 'Das Laden dauert länger als erwartet. Bitte warten Sie noch einen Moment.'
        : 'Loading is taking longer than expected. Please wait a moment.';
    }, 20000);
  }

  // Qualtrics wraps Question Text in <label for="...">, which can intercept
  // clicks inside the iframe. Remove the association.
  var labelEl = qThis.questionContainer ? qThis.questionContainer.querySelector('label.QuestionText') : null;
  if (labelEl && labelEl.getAttribute('for')) labelEl.removeAttribute('for');

  function handleMessage(event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;
    if (frame && event.source !== frame.contentWindow) return;
    var Q = Qualtrics.SurveyEngine;

    if (data.type === 'rct_ready' || data.type === 'pcp_item_response' || data.type === 'rct_complete') clearLoading();

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

    if (data.type === 'rct_scroll_top' && frame) {
      frame.scrollIntoView({ block: 'start', behavior: 'auto' });
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
    clearLoading();
  });

  console.log('[PCP bridge] post-test — listening (one-field mode).');
});
