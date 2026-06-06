/**
 * VLAT Scoring Module
 *
 * Scoring methods:
 *   1. Proportion Correct (PC) = R / N
 *   2. Correction for Guessing (CS) = R - W / (C - 1)
 *      where R = right, W = wrong, C = number of choices per item
 *      Omits and timeouts are excluded from both R and W.
 *
 * Source: Kim, Lee & Kwon (2017), VLAT scoring; Pandey & Ottley (2023)
 * for Mini-VLAT V2.
 */

// ── Answer keys ─────────────────────────────────────────────────
// VLAT 29-item answer key — NOT YET AVAILABLE. Every value is `null`.
//
// The VLAT implementation handoff (§ "Correct Answers") states the
// correct answers are NOT marked in the supplemental material. They
// must be obtained from the authoritative source before the VLAT
// blocks can be scored:
//   1. Take the test at https://bckwon.pythonanywhere.com/ and record answers
//   2. Or read the answers off the charts in the VLAT supplemental PDF
//      (https://www.bckwon.com/pdf/vlat_sup.pdf, pages 4-56)
//   3. Or contact the authors (Kim, Lee & Kwon, 2017)
//
// Do NOT guess these values: the study uses a correction-for-guessing
// formula, so a wrong key would silently corrupt the primary outcome.
// scoreBlock() treats a null answer as `unverified` and refuses to emit
// a numeric score for any block that still contains one. Replace the
// nulls below with the real labels once obtained.
var VLAT_ANSWER_KEY = {
  // Practice
  8:  null,
  11: null,
  12: null,
  18: null,
  31: null,
  38: null,
  49: null,
  51: null,
  55: null,
  // Posttest 1
  3:  null,
  9:  null,
  15: null,
  28: null,
  29: null,
  37: null,
  45: null,
  47: null,
  54: null,
  60: null,
  // Posttest 2
  5:  null,
  14: null,
  32: null,
  34: null,
  36: null,
  40: null,
  46: null,
  52: null,
  53: null,
  59: null
};

// Mini-VLAT V2 answer key (from PDF answer key page)
var MINIVLAT_ANSWER_KEY = {
  1:  'False',       // Q1  Treemap
  6:  'C',           // Q2  100% Stacked Bar → Great Britain
  10: 'C',           // Q3  Histogram → 30-40 km
  16: 'True',        // Q4  Choropleth → WA > WI
  19: 'A',           // Q5  Pie → 17.6%
  22: 'C',           // Q6  Bubble → Shanghai
  33: 'C',           // Q7  Stacked Bar → $6.1
  35: 'A',           // Q8  Line → $50.54
  41: 'C',           // Q9  Bar → 40.51 Mbps
  48: 'A',           // Q10 Area → $0.71
  57: 'C',           // Q11 Stacked Area → 1 to 2
  61: 'False'        // Q12 Scatterplot → no negative relationship
};

// ── Number of choices per item ──────────────────────────────────
// Needed for correction-for-guessing denominator (C-1).
// True/False items have C=2; multiple-choice items have C=4
// (except item 38 which has C=3).
function getChoiceCount(itemId) {
  // Items with True/False format (C=2)
  var tfItems = [18, 15, 45, 54, 60, 14, 32, 34, 46, 52, 53, 1, 16, 61];
  if (tfItems.indexOf(Number(itemId)) !== -1) return 2;
  // Item 38 has 3 options (rising/falling/staying)
  if (Number(itemId) === 38) return 3;
  // All other MC items have 4 options
  return 4;
}

// ── Scoring functions ───────────────────────────────────────────

/**
 * Score a set of responses against an answer key.
 *
 * @param {Object[]} responses — array of {itemId, response} objects
 * @param {Object}   answerKey — {itemId: correctLabel} mapping
 * @returns {Object} { right, wrong, omitted, timedOut, total,
 *                     proportionCorrect, correctedScore }
 */
function scoreBlock(responses, answerKey) {
  var right = 0;
  var wrong = 0;
  var omitted = 0;
  var timedOut = 0;
  var unverified = 0;   // items with no answer key entry (null/undefined)
  var total = responses.length;

  // For correction-for-guessing, we need per-item C values
  // and accumulate W/(C-1) across items with different C.
  var csPenalty = 0;

  responses.forEach(function (r) {
    var id = Number(r.itemId);
    var resp = String(r.response);

    var correct = answerKey[id];
    if (correct === null || correct === undefined) {
      // No answer key for this item yet — never treat as wrong.
      unverified++;
      return;
    }

    if (resp === 'omit') {
      omitted++;
      return;
    }
    if (resp === 'timeout') {
      timedOut++;
      return;
    }

    if (resp === correct) {
      right++;
    } else {
      wrong++;
      var C = getChoiceCount(id);
      csPenalty += 1 / (C - 1);
    }
  });

  // A block with any unverified item cannot be scored honestly. Return
  // null scores rather than a misleading partial number.
  var scorable = unverified === 0;

  // Proportion correct: R / N (total items, not just attempted)
  var proportionCorrect = (scorable && total > 0) ? right / total : null;

  // Correction for guessing: R - sum(1/(C_i - 1)) for each wrong answer
  // This generalises the standard CS = R - W/(C-1) to items with
  // different numbers of choices.
  var correctedScore = scorable ? right - csPenalty : null;

  return {
    right: right,
    wrong: wrong,
    omitted: omitted,
    timedOut: timedOut,
    unverified: unverified,
    total: total,
    proportionCorrect: proportionCorrect === null
      ? null : Math.round(proportionCorrect * 10000) / 10000,
    correctedScore: correctedScore === null
      ? null : Math.round(correctedScore * 100) / 100
  };
}

/**
 * Score VLAT practice block.
 * @param {Object[]} responses — [{itemId, response}, ...]
 */
function scorePractice(responses) {
  return scoreBlock(responses, VLAT_ANSWER_KEY);
}

/**
 * Score VLAT posttest1 block.
 */
function scorePosttest1(responses) {
  return scoreBlock(responses, VLAT_ANSWER_KEY);
}

/**
 * Score VLAT posttest2 block.
 */
function scorePosttest2(responses) {
  return scoreBlock(responses, VLAT_ANSWER_KEY);
}

/**
 * Score Mini-VLAT baseline.
 */
function scoreMiniVlat(responses) {
  return scoreBlock(responses, MINIVLAT_ANSWER_KEY);
}

/**
 * Score from Qualtrics Embedded Data fields.
 * Extracts vlat_{id}_response fields and scores them.
 *
 * @param {Object} embeddedData — flat key-value object
 * @param {string} block — 'practice', 'posttest1', 'posttest2', or 'minivlat'
 * @returns {Object} scoring result
 */
function scoreFromEmbeddedData(embeddedData, block) {
  var blockIds = {
    practice:  [8, 11, 12, 18, 31, 38, 49, 51, 55],
    posttest1: [3, 9, 15, 28, 29, 37, 45, 47, 54, 60],
    posttest2: [5, 14, 32, 34, 36, 40, 46, 52, 53, 59],
    minivlat:  [1, 6, 10, 16, 19, 22, 33, 35, 41, 48, 57, 61]
  };

  var ids = blockIds[block];
  if (!ids) return null;

  var prefix = block === 'minivlat' ? 'minivlat_' : 'vlat_';
  var answerKey = block === 'minivlat' ? MINIVLAT_ANSWER_KEY : VLAT_ANSWER_KEY;

  var responses = ids.map(function (id) {
    return {
      itemId: id,
      response: embeddedData[prefix + id + '_response'] || 'omit'
    };
  });

  return scoreBlock(responses, answerKey);
}

// ── Export ───────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VLAT_ANSWER_KEY: VLAT_ANSWER_KEY,
    MINIVLAT_ANSWER_KEY: MINIVLAT_ANSWER_KEY,
    getChoiceCount: getChoiceCount,
    scoreBlock: scoreBlock,
    scorePractice: scorePractice,
    scorePosttest1: scorePosttest1,
    scorePosttest2: scorePosttest2,
    scoreMiniVlat: scoreMiniVlat,
    scoreFromEmbeddedData: scoreFromEmbeddedData
  };
}
