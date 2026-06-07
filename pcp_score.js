// PCP offline scoring / analysis pipeline.
// Turns a participant's exported Embedded Data (the flat pcp_<id>_response /
// _timeout fields) into the study outcomes. The unaided post-tests ship NO answer
// key, so scoring happens here against PCP_KEY / PCP_OMIT in pcp_scoring.js.
//
//   node pcp_score.js --test     # run the synthetic unit tests
//
// scoreBlock(resp, block) -> { accuracy, omit_rate, accuracy_attempted, byBloom, ... }
//   resp  = { "pcp_rem_sa_1_response": "A", "pcp_rem_sa_1_timeout": "false", ... }  (legacy flat/blob)
//   block = "posttest1" | "posttest2" | "practice"
// scoreResponses(arr) -> same shape, for the NEW one-field consolidated format
//   arr   = [ { id, answer, timeout, ... }, ... ]  (post-test, or the richer training array)
const path = require('path');
const items = require(path.join(__dirname, 'pcp_items_data.js'));
const { PCP_KEY, PCP_OMIT } = require(path.join(__dirname, 'pcp_scoring.js'));

function classify(id, resp, timeout) {
  if (timeout || resp == null || resp === '' || resp === 'timeout') return 'missing';
  if (!(id in PCP_KEY)) return 'unkeyed';   // id absent from the answer key (e.g. a training-only item)
  if (resp === PCP_OMIT[id]) return 'omit';
  if (resp === PCP_KEY[id]) return 'correct';
  return 'wrong';
}
const round = x => (x == null ? null : Math.round(x * 1000) / 1000);

// The renderer writes BOTH flat per-item fields (pcp_<id>_response/_rt/_timeout)
// AND an authoritative JSON blob (pcp_<block>_responses = [{id,answer,rt,timeout}]).
// If the survey declared only the blob (the lean Embedded Data set — ~35 fields
// instead of ~120), expand it here into the flat lookups scoreBlock expects.
// Any flat field that IS present wins (never overwritten by the blob).
function expandBlob(resp, block) {
  const raw = resp['pcp_' + block + '_responses'];
  if (!raw) return resp;
  let arr;
  try { arr = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return resp; }
  if (!Array.isArray(arr)) return resp;
  const out = Object.assign({}, resp);
  arr.forEach(r => {
    if (!r || !r.id) return;
    if (out[r.id + '_response'] == null) out[r.id + '_response'] = r.answer;
    if (out[r.id + '_timeout']  == null) out[r.id + '_timeout']  = r.timeout;
    if (out[r.id + '_rt']       == null && r.rt != null) out[r.id + '_rt'] = r.rt;
  });
  return out;
}

function scoreBlock(resp, block) {
  resp = expandBlob(resp, block);
  const blockItems = items.filter(i => i.block === block);
  let correct = 0, wrong = 0, omit = 0, missing = 0;
  const byBloom = {}, perItem = [];
  for (const it of blockItems) {
    const r = resp[it.id + '_response'];
    const to = String(resp[it.id + '_timeout']).toLowerCase() === 'true';
    const st = classify(it.id, r, to);
    if (st === 'correct') correct++; else if (st === 'wrong') wrong++;
    else if (st === 'omit') omit++; else missing++;
    (byBloom[it.bloom] = byBloom[it.bloom] || { n: 0, correct: 0 });
    byBloom[it.bloom].n++; if (st === 'correct') byBloom[it.bloom].correct++;
    perItem.push({ id: it.id, bloom: it.bloom, response: r == null ? '' : r, status: st });
  }
  const n = blockItems.length, attempted = correct + wrong;
  Object.values(byBloom).forEach(v => (v.accuracy = round(v.correct / v.n)));
  return {
    block, n, correct, wrong, omit, missing,
    accuracy: round(correct / n),
    omit_rate: round(omit / n),
    accuracy_attempted: attempted > 0 ? round(correct / attempted) : null,
    byBloom, perItem
  };
}
// id -> item-bank entry (bloom, block, ...) for grouping consolidated arrays.
const ITEM_BY_ID = {};
items.forEach(it => { ITEM_BY_ID[it.id] = it; });

// Score the NEW one-field consolidated format: a JSON array (or its string),
// one dict per item — {id, answer, timeout, ...} (post-test) or the richer
// training dict {id, answer, interaction, ...}. Both carry id + answer, so one
// scorer handles either. Unkeyed ids (training-only items absent from PCP_KEY)
// are tallied separately and excluded from the accuracy denominator.
function scoreResponses(arr) {
  if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch (e) { arr = []; } }
  if (!Array.isArray(arr)) arr = [];
  let correct = 0, wrong = 0, omit = 0, missing = 0, unkeyed = 0;
  const byBloom = {}, perItem = [];
  for (const e of arr) {
    const id = e && e.id;
    const to = !!(e && (e.timeout === true || String(e.timeout).toLowerCase() === 'true'));
    const st = classify(id, e && e.answer, to);
    if      (st === 'correct') correct++;
    else if (st === 'wrong')   wrong++;
    else if (st === 'omit')    omit++;
    else if (st === 'unkeyed') unkeyed++;
    else                       missing++;
    const bloom = (ITEM_BY_ID[id] && ITEM_BY_ID[id].bloom) || 'unknown';
    if (st !== 'unkeyed') {
      (byBloom[bloom] = byBloom[bloom] || { n: 0, correct: 0 });
      byBloom[bloom].n++; if (st === 'correct') byBloom[bloom].correct++;
    }
    perItem.push({ id, bloom, answer: (e && e.answer != null) ? e.answer : '', status: st });
  }
  const keyed = correct + wrong + omit + missing, attempted = correct + wrong;
  Object.values(byBloom).forEach(v => (v.accuracy = round(v.correct / v.n)));
  return {
    n: arr.length, correct, wrong, omit, missing, unkeyed,
    accuracy:           keyed > 0 ? round(correct / keyed) : null,
    omit_rate:          keyed > 0 ? round(omit / keyed)    : null,
    accuracy_attempted: attempted > 0 ? round(correct / attempted) : null,
    byBloom, perItem
  };
}

module.exports = { scoreBlock, scoreResponses, classify };

// ---------------- synthetic unit tests ----------------
if (require.main === module && process.argv[2] === '--test') {
  const block = 'posttest1';
  const ids = items.filter(i => i.block === block);
  const wrongLabel = it => it.options.find(o => o.label !== PCP_KEY[it.id] && o.label !== PCP_OMIT[it.id]).label;
  const build = fn => { const o = {}; ids.forEach(it => { const r = fn(it); if (r !== undefined) o[it.id + '_response'] = r; }); return o; };
  let pass = 0, fail = 0;
  const check = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL:', name)); };

  let s = scoreBlock(build(it => PCP_KEY[it.id]), block);
  check('all-correct → accuracy 1', s.accuracy === 1);
  check('all-correct → omit 0', s.omit_rate === 0);
  check('all-correct → correct 16', s.correct === 16);

  s = scoreBlock(build(it => PCP_OMIT[it.id]), block);
  check('all-IDK → accuracy 0', s.accuracy === 0);
  check('all-IDK → omit_rate 1', s.omit_rate === 1);
  check('all-IDK → acc_attempted null', s.accuracy_attempted === null);

  s = scoreBlock(build(wrongLabel), block);
  check('all-wrong → accuracy 0', s.accuracy === 0);
  check('all-wrong → omit 0', s.omit_rate === 0);
  check('all-wrong → acc_attempted 0', s.accuracy_attempted === 0);

  s = scoreBlock({}, block);
  check('no-responses → missing 16', s.missing === 16);
  check('no-responses → accuracy 0', s.accuracy === 0);
  check('no-responses → acc_attempted null', s.accuracy_attempted === null);

  let i = 0; s = scoreBlock(build(it => (i++ < 8 ? PCP_KEY[it.id] : PCP_OMIT[it.id])), block);
  check('half-correct/half-IDK → accuracy 0.5', s.accuracy === 0.5);
  check('half-correct/half-IDK → omit 0.5', s.omit_rate === 0.5);
  check('half-correct/half-IDK → acc_attempted 1', s.accuracy_attempted === 1);

  s = scoreBlock(build(it => (it.bloom === 'remember' ? PCP_KEY[it.id] : wrongLabel(it))), block);
  check('per-bloom: remember acc 1', s.byBloom.remember.accuracy === 1);
  check('per-bloom: analyze acc 0', s.byBloom.analyze.accuracy === 0);

  // lean Embedded Data: ONLY the pcp_<block>_responses JSON blob declared (no flat fields)
  const blob = fn => ({ ['pcp_' + block + '_responses']: JSON.stringify(ids.map(it => ({ id: it.id, answer: fn(it), rt: 1000, timeout: false }))) });
  s = scoreBlock(blob(it => PCP_KEY[it.id]), block);
  check('blob-only all-correct → accuracy 1 / correct 16', s.accuracy === 1 && s.correct === 16);
  let bi = 0; s = scoreBlock(blob(it => (bi++ < 8 ? PCP_KEY[it.id] : PCP_OMIT[it.id])), block);
  check('blob-only half-IDK → omit_rate 0.5', s.omit_rate === 0.5);
  check('blob-only half-IDK → acc_attempted 1', s.accuracy_attempted === 1);

  // NEW one-field consolidated format: score directly from the array (scoreResponses).
  const arr = fn => ids.map(it => ({ id: it.id, chart_id: it.chartId, format: it.questionFormat || 'mc', answer: fn(it), rt_ms: 1000, timeout: false }));
  s = scoreResponses(arr(it => PCP_KEY[it.id]));
  check('consolidated all-correct → accuracy 1 / correct 16', s.accuracy === 1 && s.correct === 16);
  s = scoreResponses(JSON.stringify(arr(it => PCP_OMIT[it.id])));   // also accepts a JSON string
  check('consolidated all-IDK (string) → omit_rate 1 / accuracy 0', s.omit_rate === 1 && s.accuracy === 0);
  let ci = 0; s = scoreResponses(arr(it => (ci++ < 8 ? PCP_KEY[it.id] : wrongLabel(it))));
  check('consolidated half-correct → accuracy 0.5 / acc_attempted 0.5', s.accuracy === 0.5 && s.accuracy_attempted === 0.5);
  s = scoreResponses([{ id: ids[0].id, answer: 'timeout', timeout: true }]);
  check('consolidated timeout entry → missing 1 / accuracy 0', s.missing === 1 && s.accuracy === 0);
  s = scoreResponses([{ id: 'nonexistent_item_xyz', answer: 'B' }]);
  check('consolidated unkeyed id → unkeyed 1 / accuracy null', s.unkeyed === 1 && s.accuracy === null);

  console.log(`\nscoring pipeline: ${pass} passed, ${fail} failed`);
  i = 0;
  const ex = scoreBlock(build(it => [PCP_KEY[it.id], PCP_OMIT[it.id], wrongLabel(it)][i++ % 3]), block);
  console.log('\nexample (cycling correct/IDK/wrong):');
  console.log('  accuracy:', ex.accuracy, '| omit_rate:', ex.omit_rate, '| acc_attempted:', ex.accuracy_attempted);
  console.log('  byBloom acc:', JSON.stringify(Object.fromEntries(Object.entries(ex.byBloom).map(([k, v]) => [k, v.accuracy]))));
}
