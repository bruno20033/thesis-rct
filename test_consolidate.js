// Unit tests for pcp_consolidate.js — per-question interaction consolidation.
//   node test_consolidate.js
const path = require('path');
const { consolidate } = require(path.join(__dirname, 'pcp_consolidate.js'));

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL:', name)); };

// monotonic ISO timestamps (1s apart) so time_ms is well-defined
let _t = 0;
const ts = () => new Date(Date.UTC(2026, 5, 7, 10, 0, _t++)).toISOString();

const items = [
  { id: 'rem_fa_1', raw_id: 3,  chart_id: 'pcp_rem_fa_1', chart_type: 'Parallel Coordinates', format: 'tf', answer: 'A' },
  { id: 'ana_fa_1', raw_id: 21, chart_id: 'pcp_ana_fa_1', chart_type: 'Parallel Coordinates', format: 'mc', answer: 'C' }
];

// ───────────────── LLM-Socratic (judge on every turn; q2 triggers a regen) ──
_t = 0;
const socEvents = [
  { type:'prompt',   content:'Is this a PCP?', question_id:'rem_fa_1', ts: ts() },
  { type:'response', content:'What do you notice about how the axes are arranged?', latency_ms:1740, question_id:'rem_fa_1', ts: ts() },
  { type:'judge_result', turn_index:1, fidelity_score:4, intent_score:4, fidelity_reasoning:'probes axes', intent_reasoning:'genuine', judge_status:'ok', judge_latency_ms:512, is_regen_score:false, active_regen_triggered:false, question_id:'rem_fa_1', ts: ts() },
  { type:'answer_final', value:'A', question_id:'rem_fa_1', ts: ts() },
  { type:'prompt',   content:'Just tell me the answer', question_id:'ana_fa_1', ts: ts() },
  { type:'judge_result', turn_index:2, fidelity_score:2, intent_score:2, judge_status:'ok', judge_latency_ms:480, is_regen_score:false, active_regen_triggered:false, question_id:'ana_fa_1', ts: ts() }, // draft below threshold
  { type:'response', content:'Which axis shows horsepower?', latency_ms:1620, question_id:'ana_fa_1', ts: ts() },
  { type:'judge_result', turn_index:2, fidelity_score:4, intent_score:2, judge_status:'ok', judge_latency_ms:900, is_regen_score:true, active_regen_triggered:true, question_id:'ana_fa_1', ts: ts() }, // regen judged
  { type:'answer_final', value:'C', question_id:'ana_fa_1', ts: ts() }
];
let r = consolidate(socEvents, items, 'LLM');
check('soc: 2 questions', r.length === 2);
check('soc: q1 mode=llm', r[0].interaction && r[0].interaction.mode === 'llm');
check('soc: q1 one turn', r[0].interaction.turns.length === 1);
check('soc: q1 prompt captured', r[0].interaction.turns[0].prompt === 'Is this a PCP?');
check('soc: q1 response captured', /axes/.test(r[0].interaction.turns[0].response));
check('soc: q1 judge fidelity=4', r[0].interaction.turns[0].judge.fidelity === 4);
check('soc: q1 judge intent=4', r[0].interaction.turns[0].judge.intent === 4);
check('soc: q1 keeps answer + chart meta', r[0].answer === 'A' && r[0].chart_id === 'pcp_rem_fa_1' && r[0].format === 'tf');
check('soc: q1 time_ms > 0', r[0].time_ms > 0);
check('soc: q2 last judge wins (fidelity 4)', r[1].interaction.turns[0].judge.fidelity === 4);
check('soc: q2 active_regen surfaced', r[1].interaction.turns[0].judge.active_regen === true);
check('soc: q2 response captured', /horsepower/.test(r[1].interaction.turns[0].response));

// ───────────────── LLM-Unrestricted (no judge layer) ──────────────────────
_t = 0;
const unrEvents = [
  { type:'prompt',   content:'Is this a PCP?', question_id:'rem_fa_1', ts: ts() },
  { type:'response', content:'Yes — several vertical parallel axes, each point a line.', latency_ms:1450, question_id:'rem_fa_1', ts: ts() },
  { type:'answer_final', value:'A', question_id:'rem_fa_1', ts: ts() }
];
r = consolidate(unrEvents, items, 'LLM');
check('unr: q1 one turn', r[0].interaction.turns.length === 1);
check('unr: q1 judge is null', r[0].interaction.turns[0].judge === null);
check('unr: q2 no events → empty turns', r[1].interaction.turns.length === 0);

// ───────────────── SEARCH (queries with clicks; dwell matched by url) ──────
_t = 0;
const url1 = 'https://en.wikipedia.org/wiki/Parallel_coordinates';
const url2 = 'https://www.data-to-viz.com/graph/parallel.html';
const url3 = 'https://datavizcatalogue.com/methods/parallel_coordinates.html';
const seaEvents = [
  { type:'search_query', query:'what is a parallel coordinates plot', question_id:'rem_fa_1', ts: ts() },
  { type:'result_click', index:1, url:url1, title:'Parallel coordinates - Wikipedia', query:'what is a parallel coordinates plot', question_id:'rem_fa_1', ts: ts() },
  { type:'result_dwell', url:url1, dwell_ms:23400, fallback_clicked:false, question_id:'rem_fa_1', ts: ts() },
  { type:'search_query', query:'pcp axes connected lines', question_id:'rem_fa_1', ts: ts() },
  { type:'result_click', index:2, url:url2, title:'How to read', query:'pcp axes connected lines', question_id:'rem_fa_1', ts: ts() },
  { type:'result_dwell', url:url2, dwell_ms:18900, fallback_clicked:false, question_id:'rem_fa_1', ts: ts() },
  { type:'answer_final', value:'A', question_id:'rem_fa_1', ts: ts() },
  { type:'search_query', query:'highest value parallel coordinates', question_id:'ana_fa_1', ts: ts() },
  { type:'result_click', index:1, url:url1, title:'A', query:'highest value parallel coordinates', question_id:'ana_fa_1', ts: ts() },
  { type:'result_dwell', url:url1, dwell_ms:12200, fallback_clicked:true, question_id:'ana_fa_1', ts: ts() },
  { type:'result_click', index:3, url:url3, title:'B', query:'highest value parallel coordinates', question_id:'ana_fa_1', ts: ts() },
  { type:'result_dwell', url:url3, dwell_ms:8700, fallback_clicked:false, question_id:'ana_fa_1', ts: ts() },
  { type:'answer_final', value:'C', question_id:'ana_fa_1', ts: ts() }
];
r = consolidate(seaEvents, items, 'SEARCH');
check('sea: q1 mode=search', r[0].interaction.mode === 'search');
check('sea: q1 two searches', r[0].interaction.searches.length === 2);
check('sea: q1 search1 query', r[0].interaction.searches[0].query === 'what is a parallel coordinates plot');
check('sea: q1 search1 one click', r[0].interaction.searches[0].clicks.length === 1);
check('sea: q1 dwell matched by url', r[0].interaction.searches[0].clicks[0].dwell_ms === 23400);
check('sea: q1 click url', r[0].interaction.searches[0].clicks[0].url === url1);
check('sea: q2 one search, two clicks', r[1].interaction.searches.length === 1 && r[1].interaction.searches[0].clicks.length === 2);
check('sea: q2 click2 dwell', r[1].interaction.searches[0].clicks[1].dwell_ms === 8700);
check('sea: q2 click1 fallback_clicked', r[1].interaction.searches[0].clicks[0].fallback_clicked === true);

// ───────────────── edge: NOAID → interaction null, answers still present ───
r = consolidate([], items, 'NOAID');
check('noaid: interaction null', r[0].interaction === null);
check('noaid: entries + answers preserved', r.length === 2 && r[1].answer === 'C');

console.log(`\nconsolidation: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
