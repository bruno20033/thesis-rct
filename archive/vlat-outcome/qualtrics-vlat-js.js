/* ====================================================================
 * QUALTRICS VLAT BLOCK — Add JavaScript snippets.
 *
 * Each section below is a self-contained paste-in for one Qualtrics
 * question block. Paste the corresponding section into the "Add
 * JavaScript" panel (gear icon -> Add JavaScript) of each VLAT block.
 *
 * The Question Text (HTML source) for each block should be:
 *   <iframe src="https://bruno20033.github.io/thesis-rct/<page>?pid=${e://Field/pid}&condition=${e://Field/condition}"
 *           width="100%" style="border:none;min-height:700px"></iframe>
 *
 * Replace <page> with the correct HTML page for each block.
 *
 * IMPORTANT: The main bridge JS (qualtrics-question-js.js) must also
 * be pasted into the LLM/SEARCH question blocks as before. The VLAT
 * blocks use a simpler bridge that only handles VLAT-specific messages.
 * ==================================================================== */


// ====================================================================
// SECTION 1: PRACTICE BLOCK
// Question Text (HTML source):
//   <iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-vlat-practice.html?pid=${e://Field/pid}" ...>
// ====================================================================

Qualtrics.SurveyEngine.addOnReady(function () {
  var qThis = this;
  qThis.hideNextButton();

  // Remove label[for] that steals clicks inside iframes
  var labelEl = qThis.questionContainer
    ? qThis.questionContainer.querySelector('label.QuestionText')
    : null;
  if (labelEl && labelEl.getAttribute('for')) {
    labelEl.removeAttribute('for');
  }

  function handleMessage(event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;

    var Q = Qualtrics.SurveyEngine;

    if (data.type === 'vlat_item_response') {
      try {
        Q.setEmbeddedData('vlat_' + data.itemId + '_response', String(data.response || ''));
        Q.setEmbeddedData('vlat_' + data.itemId + '_rt',       String(data.rt       || 0));
        Q.setEmbeddedData('vlat_' + data.itemId + '_timeout',  String(data.timeout  || false));
      } catch (e) { console.warn('[VLAT bridge] item write failed:', e); }
    }

    if (data.type === 'vlat_block_complete' && data.embeddedData) {
      try {
        Object.keys(data.embeddedData).forEach(function (k) {
          Q.setEmbeddedData(k, String(data.embeddedData[k]));
        });
      } catch (e) { console.warn('[VLAT bridge] block write failed:', e); }
    }

    if (data.type === 'rct_complete') {
      qThis.showNextButton();
    }

    if (data.type === 'rct_height' && typeof data.value === 'number') {
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
  this.addOnUnload && this.addOnUnload(function () {
    window.removeEventListener('message', handleMessage, false);
  });

  console.log('[VLAT bridge] practice block — listening.');
});


// ====================================================================
// SECTION 2: POST-TEST 1 BLOCK
// Question Text (HTML source):
//   <iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-vlat-posttest1.html?pid=${e://Field/pid}" ...>
// ====================================================================

/* --- PASTE THE EXACT SAME CODE AS SECTION 1 ABOVE --- */
/* The bridge is identical for all VLAT blocks. The HTML page    */
/* (set via iframe src) determines which items appear. The only  */
/* difference is the console.log label for debugging:            */
/*   console.log('[VLAT bridge] posttest1 block — listening.');  */


// ====================================================================
// SECTION 3: POST-TEST 2 BLOCK
// Question Text (HTML source):
//   <iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-vlat-posttest2.html?pid=${e://Field/pid}" ...>
// ====================================================================

/* --- PASTE THE EXACT SAME CODE AS SECTION 1 ABOVE --- */
/*   console.log('[VLAT bridge] posttest2 block — listening.');  */


// ====================================================================
// SECTION 4: MINI-VLAT BASELINE BLOCK
// Question Text (HTML source):
//   <iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-minivlat-baseline.html?pid=${e://Field/pid}" ...>
// ====================================================================

/* --- PASTE THE EXACT SAME CODE AS SECTION 1 ABOVE --- */
/* Mini-VLAT uses minivlat_ prefix in its embeddedData object,   */
/* so the bridge writes minivlat_{id}_response etc. automatically */
/*   console.log('[VLAT bridge] minivlat block — listening.');   */


// ====================================================================
// EMBEDDED DATA FIELDS — declare ALL of these in Qualtrics Survey Flow
// (Embedded Data block at the top).
//
// VLAT per-item fields (29 items x 3 fields = 87 fields):
//   vlat_{id}_response, vlat_{id}_rt, vlat_{id}_timeout
//   where {id} is one of: 3,5,8,9,11,12,14,15,18,28,29,31,32,34,36,
//                          37,38,40,45,46,47,49,51,52,53,54,55,59,60
//
// VLAT block-level fields (3 blocks x 7 fields = 21 fields):
//   vlat_practice_completed, vlat_practice_total_time,
//   vlat_practice_items_answered, vlat_practice_order,
//   vlat_practice_score, vlat_practice_total
//   (same pattern for posttest1, posttest2)
//
// Mini-VLAT per-item fields (12 items x 3 fields = 36 fields):
//   minivlat_{id}_response, minivlat_{id}_rt, minivlat_{id}_timeout
//   where {id} is one of: 1,6,10,16,19,22,33,35,41,48,57,61
//
// Mini-VLAT block-level fields (7 fields):
//   minivlat_completed, minivlat_total_time,
//   minivlat_items_answered, minivlat_order,
//   minivlat_score, minivlat_total
// ====================================================================
