// PCP offline scoring / analysis pipeline.
// Turns a participant's exported Embedded Data (the flat pcp_<id>_response /
// _timeout fields) into the study outcomes. The unaided post-tests ship NO answer
// key, so scoring happens here against PCP_KEY / PCP_OMIT in pcp_scoring.js.
//
//   node pcp_score.js --test     # run the synthetic unit tests
//
// scoreBlock(resp, block) -> { accuracy, omit_rate, accuracy_attempted, byBloom, ... }
//   resp  = { "pcp_rem_sa_1_response": "A", "pcp_rem_sa_1_timeout": "false", ... }
//   block = "posttest1" | "posttest2" | "practice"
const path = require('path');
const items = require(path.join(__dirname, 'pcp_items_data.js'));
const { PCP_KEY, PCP_OMIT } = require(path.join(__dirname, 'pcp_scoring.js'));

function classify(id, resp, timeout) {
  if (timeout || resp == null || resp === '' || resp === 'timeout') return 'missing';
  if (resp === PCP_OMIT[id]) return 'omit';
  if (resp === PCP_KEY[id]) return 'correct';
  return 'wrong';
}
const round = x => (x == null ? null : Math.round(x * 1000) / 1000);

function scoreBlock(resp, block) {
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
module.exports = { scoreBlock, classify };

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

  console.log(`\nscoring pipeline: ${pass} passed, ${fail} failed`);
  i = 0;
  const ex = scoreBlock(build(it => [PCP_KEY[it.id], PCP_OMIT[it.id], wrongLabel(it)][i++ % 3]), block);
  console.log('\nexample (cycling correct/IDK/wrong):');
  console.log('  accuracy:', ex.accuracy, '| omit_rate:', ex.omit_rate, '| acc_attempted:', ex.accuracy_attempted);
  console.log('  byBloom acc:', JSON.stringify(Object.fromEntries(Object.entries(ex.byBloom).map(([k, v]) => [k, v.accuracy]))));
}
