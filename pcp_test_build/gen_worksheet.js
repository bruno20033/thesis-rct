const path = require('path'), fs = require('fs');
const REPO = "/Users/brunokneffel/Library/Mobile Documents/com~apple~CloudDocs/gymnasium steglitz/B.SC Frankfurt School/Oxford/Python/GitHub/Thesis";
const PCP_ITEMS = require(path.join(REPO, 'pcp_items_data.js'));
const { PCP_KEY, PCP_CONF, PCP_OMIT } = require(path.join(REPO, 'pcp_scoring.js'));

// src=(module-form, img_index) from build_pcp.py  -> the upstream "raw_id" / quiz order
const py = fs.readFileSync(path.join(REPO, 'pcp_test_build/build_pcp.py'), 'utf8');
const srcMap = {};
const re = /item\("(pcp_[a-z0-9_]+)"\s*,\s*"[a-z]+"\s*,\s*"[a-z0-9]+"\s*,\s*\d+\s*,\s*\("([A-Za-z-]+)"\s*,\s*(\d+)\)/g;
let m; while ((m = re.exec(py)) !== null) srcMap[m[1]] = { folder: m[2], idx: +m[3] };

const CHART = 'https://bruno20033.github.io/thesis-rct/charts/';
const BLOOM = { remember: 'Remember', understand: 'Understand', analyze: 'Analyze', evaluate: 'Evaluate' };
const ORDER = ['remember', 'understand', 'analyze', 'evaluate'];
const setLbl = b => b === 'practice' ? 'TRAIN (practice)' : b === 'posttest1' ? 'TEST · immediate' : 'TEST · delayed';
const setCls = b => b === 'practice' ? 'train' : b === 'posttest1' ? 'imm' : 'del';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const byBloom = {};
PCP_ITEMS.forEach(it => (byBloom[it.bloom] = byBloom[it.bloom] || []).push(it));
ORDER.forEach(b => (byBloom[b] || []).sort((a, c) => {
  const A = srcMap[a.id] || {}, C = srcMap[c.id] || {};
  const fa = (A.folder || '').endsWith('FA') ? 0 : 1, fc = (C.folder || '').endsWith('FA') ? 0 : 1;
  return fa - fc || (A.idx || 0) - (C.idx || 0);
}));

function card(it) {
  const s = srcMap[it.id] || {}, key = PCP_KEY[it.id], conf = PCP_CONF[it.id] || '', omit = PCP_OMIT ? PCP_OMIT[it.id] : null;
  const srcRef = s.folder ? `${s.folder} · Q${(s.idx || 0) + 1}` : '';
  const opts = it.options.map(o => {
    const k = o.label === key, om = omit && o.label === omit;
    return `<li class="opt${k ? ' key' : ''}${om ? ' omit' : ''}"><b>${o.label})</b> ${esc(o.text)}` +
      (k ? ' <span class="tag tk">✓ current key</span>' : '') + (om ? ' <span class="tag to">“I don’t know”</span>' : '') + '</li>';
  }).join('');
  return `<div class="card${conf !== 'HIGH' ? ' flagged' : ''}" id="${it.id}">
  <div class="head"><span class="name" onclick="cp('${it.id}',this)" title="click to copy">${it.id}</span>
    <span class="src">${srcRef}</span><span class="badge ${setCls(it.block)}">${setLbl(it.block)}</span>
    <span class="badge c-${conf}">${conf}</span></div>
  <img class="chart" loading="lazy" src="${CHART}${it.chartId}.png" alt="${it.id} chart">
  <div class="q">${esc(it.questionText)}</div>
  <ol class="opts">${opts}</ol>
  <div class="rec"><span class="cur">key&nbsp;<b>${key}</b></span>
    <input class="live" data-id="${it.id}" data-key="${key}" placeholder="live quiz says…">
    <span class="st" id="st-${it.id}"></span></div>
</div>`;
}

const nav = ORDER.map(b => `<a href="#sec-${b}">${BLOOM[b]} <small>(${(byBloom[b] || []).length})</small></a>`).join('');
const flagged = PCP_ITEMS.filter(it => PCP_CONF[it.id] !== 'HIGH')
  .sort((a, c) => (PCP_CONF[a.id] === 'LOW' ? 0 : 1) - (PCP_CONF[c.id] === 'LOW' ? 0 : 1))
  .map(it => `<a href="#${it.id}">${it.id} <em>(${PCP_CONF[it.id]}, key ${PCP_KEY[it.id]})</em></a>`).join('');
const sections = ORDER.map(b => `<section id="sec-${b}"><h2>${BLOOM[b]} <small>— ${(byBloom[b] || []).length} items</small></h2><div class="grid">${(byBloom[b] || []).map(card).join('')}</div></section>`).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PCP answer-key verification worksheet</title><style>
*{box-sizing:border-box} body{margin:0;font:15px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a2e;background:#f4f5f7}
header{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid #dde;padding:10px 18px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
header h1{font-size:1.05rem;margin:0 0 6px} nav a{margin-right:14px;text-decoration:none;color:#1c64d8;font-weight:600} nav small{color:#888;font-weight:400}
.wrap{max-width:1500px;margin:0 auto;padding:18px}
.intro,.flag{background:#fff;border:1px solid #e3e6ee;border-radius:10px;padding:14px 16px;margin-bottom:16px}
.intro h3,.flag h3{margin:0 0 8px;font-size:.95rem} .intro ol{margin:6px 0 0 18px} .intro li{margin:3px 0}
.flag{border-left:4px solid #f59f00} .flag a{display:inline-block;margin:3px 10px 3px 0;text-decoration:none;color:#b54708;font-weight:600} .flag em{color:#888;font-weight:400;font-style:normal}
h2{margin:26px 0 12px;font-size:1.15rem;border-bottom:2px solid #dde;padding-bottom:6px} h2 small{color:#888;font-weight:400;font-size:.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
.card{background:#fff;border:1px solid #e3e6ee;border-radius:10px;padding:12px;display:flex;flex-direction:column}
.card.flagged{border-left:4px solid #f59f00}
.head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px}
.name{font:700 1rem ui-monospace,Menlo,monospace;color:#0b3d91;cursor:pointer} .name:hover{text-decoration:underline}
.src{font:600 .78rem ui-monospace,monospace;color:#666;background:#eef1f6;padding:2px 6px;border-radius:5px}
.badge{font-size:.7rem;font-weight:700;padding:2px 7px;border-radius:10px}
.train{background:#e7f5ff;color:#1971c2}.imm{background:#ebfbee;color:#2b8a3e}.del{background:#fff4e6;color:#e8590c}
.c-HIGH{background:#ebfbee;color:#2b8a3e}.c-MED{background:#fff3bf;color:#a37b00}.c-LOW{background:#ffe3e3;color:#c92a2a}
.chart{width:100%;border:1px solid #dee2e6;border-radius:7px;background:#fff}
.q{font-weight:600;margin:10px 0 6px}
.opts{margin:0;padding-left:22px} .opts li{margin:3px 0}
.opt.key{background:#d3f9d8;border-radius:5px;padding:2px 6px;margin-left:-6px}
.opt.omit{color:#868e96}
.tag{font-size:.68rem;font-weight:700;padding:1px 6px;border-radius:8px} .tk{background:#2b8a3e;color:#fff} .to{background:#ced4da;color:#495057}
.rec{margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px dashed #dde;padding-top:8px}
.cur b{color:#0b3d91} .live{padding:5px 8px;border:1px solid #ccd;border-radius:6px;width:150px}
.st{font-weight:700} .st.ok{color:#2b8a3e} .st.no{color:#c92a2a}
@media print{header{position:static}.grid{grid-template-columns:1fr 1fr}.card{break-inside:avoid}.live{border:1px solid #999}}
</style></head><body>
<header><h1>PCP / BTPL answer-key verification worksheet <small style="font-weight:400;color:#888">— ${PCP_ITEMS.length} items</small></h1><nav>${nav}</nav></header>
<div class="wrap">
<div class="intro"><h3>How to use this with the live quiz</h3>
<ol>
<li>Open the live quiz for a module (e.g. Understand: <code>usfca.qualtrics.com/jfe/form/SV_0TEScrqyom6gKzA</code>). Answer each question and submit — it shows the <b style="color:#2b8a3e">correct answer in green</b>.</li>
<li>Match the quiz's chart to the card below with the <b>same chart</b> (cards are grouped by module in the quiz's source order; the <code>src · Q#</code> tag = the upstream question number).</li>
<li>That card's <b>name</b> is your item id, and <b>“key X / ✓ current key”</b> is what we currently have. Type the green answer's <b>letter</b> (or text) into <b>“live quiz says…”</b>: it turns <span style="color:#2b8a3e">green ✓</span> if it matches our key, <span style="color:#c92a2a">red ✗</span> if not. Your entries auto-save in this browser.</li>
<li>Charts here are the same chart-only crops shown to participants, so they should match the quiz exactly. Prioritise the flagged items below.</li>
</ol></div>
<div class="flag"><h3>⚠️ Check these ${PCP_ITEMS.filter(it => PCP_CONF[it.id] !== 'HIGH').length} first (MED / LOW confidence)</h3>${flagged}</div>
${sections}
</div>
<script>
function cp(t,el){navigator.clipboard&&navigator.clipboard.writeText(t);el.textContent=t+' ✓';setTimeout(()=>el.textContent=t,800);}
function norm(v){return (v||'').trim().toUpperCase();}
document.querySelectorAll('.live').forEach(inp=>{
  const id=inp.dataset.id,key=inp.dataset.key,st=document.getElementById('st-'+id),LS='pcpws_'+id;
  inp.value=localStorage.getItem(LS)||'';
  function upd(){const v=norm(inp.value);localStorage.setItem(LS,inp.value);
    if(!v){st.textContent='';st.className='st';return;}
    if(v===norm(key)){st.textContent='✓ matches';st.className='st ok';}
    else{st.textContent='✗ ≠ key '+key;st.className='st no';}}
  inp.addEventListener('input',upd);upd();
});
</script></body></html>`;

fs.writeFileSync(path.join(REPO, 'pcp_key_worksheet.html'), html);
console.log('items:', PCP_ITEMS.length, '| src mapped:', Object.keys(srcMap).length, '| flagged:', PCP_ITEMS.filter(it => PCP_CONF[it.id] !== 'HIGH').length);
