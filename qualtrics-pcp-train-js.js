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

  // Cover the iframe while its document is still loading. A loading screen
  // inside embed-pcp.html cannot appear until the browser has received that
  // document, so this parent-side cue handles the otherwise blank interval.
  var frame = qThis.questionContainer
    ? qThis.questionContainer.querySelector('iframe') : null;
  var loadingLayer = null;
  var loadingTimer = null;
  var readyProbeTimer = null;
  function clearLoading() {
    if (loadingTimer) clearTimeout(loadingTimer);
    if (readyProbeTimer) clearInterval(readyProbeTimer);
    loadingTimer = null;
    readyProbeTimer = null;
    if (loadingLayer && loadingLayer.parentNode) loadingLayer.parentNode.removeChild(loadingLayer);
    loadingLayer = null;
  }
  if (frame && frame.parentNode) {
    var holder = frame.parentNode;
    if (window.getComputedStyle(holder).position === 'static') holder.style.position = 'relative';
    if (!document.getElementById('pcp-train-loading-style')) {
      var style = document.createElement('style');
      style.id = 'pcp-train-loading-style';
      style.textContent = '@keyframes pcp-train-spin{to{transform:rotate(360deg)}}' +
        '@media (prefers-reduced-motion:reduce){.pcp-train-spinner{animation:none!important;border-color:#1976d2!important}}';
      document.head.appendChild(style);
    }
    var lang = '';
    try { lang = new URL(frame.src).searchParams.get('lang') || ''; } catch (_) {}
    var german = lang.slice(0, 2).toUpperCase() === 'DE';
    loadingLayer = document.createElement('div');
    loadingLayer.setAttribute('role', 'status');
    loadingLayer.setAttribute('aria-live', 'polite');
    loadingLayer.style.cssText = 'position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:14px;background:#fafafa;color:#455a64;' +
      'font:500 15px Arial,sans-serif;text-align:center;';
    var spinner = document.createElement('span');
    spinner.className = 'pcp-train-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    spinner.style.cssText = 'width:40px;height:40px;border:4px solid #cfd8dc;border-top-color:#1976d2;' +
      'border-radius:50%;animation:pcp-train-spin .8s linear infinite;';
    var loadingText = document.createElement('span');
    loadingText.textContent = german ? 'Übung wird geladen…' : 'Loading practice…';
    loadingLayer.appendChild(spinner);
    loadingLayer.appendChild(loadingText);
    holder.insertBefore(loadingLayer, frame);
    // The iframe may finish before Qualtrics runs addOnReady. Probe until
    // the embed acknowledges boot so an already-loaded page is not covered.
    var frameOrigin = '';
    try { frameOrigin = new URL(frame.src).origin; } catch (_) {}
    if (frameOrigin) readyProbeTimer = setInterval(function () {
      if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'rct_ready_probe' }, frameOrigin);
    }, 500);
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
    if (EXPECTED_ORIGIN && event.origin !== EXPECTED_ORIGIN) return;
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;
    var Q = Qualtrics.SurveyEngine;

    if (frame && event.source === frame.contentWindow &&
        (data.type === 'rct_ready' || data.type === 'rct_log_update' || data.type === 'rct_complete')) clearLoading();

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

    if (data.type === 'rct_scroll_top' && frame && event.source === frame.contentWindow) {
      frame.scrollIntoView({ block: 'start', behavior: 'auto' });
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
    clearLoading();
  });

  console.log('[PCP-train bridge] listening (one-field consolidated mode).');
});
