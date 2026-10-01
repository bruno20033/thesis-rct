// Exercise the actual training embed and bridge; no external backend calls.
const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const {chromium} = require('playwright');
const released = require('./pcp_items_data.js');
const additions = require('./pcp_training_extension.js');
const {PCP_KEY, PCP_OMIT} = require('./pcp_scoring.js');
const training = released.concat(additions).filter(it => it.block === 'practice');
const reflectionIds = training.filter(it => it.reflection).map(it => it.id);

test('training removes explicit and appended abstentions without changing source keys', () => {
  const source = fs.readFileSync(path.join(__dirname, 'embed-pcp.html'), 'utf8');
  const start = source.indexOf('  function loadVLATItems() {');
  const end = source.indexOf('  // ── Build QUESTIONS array', start);
  assert.ok(start >= 0 && end > start);
  const snapshot = JSON.stringify(training);
  const mapped = vm.runInNewContext(source.slice(start, end) + '\nloadVLATItems()', {
    PCP_ITEMS: released, PCP_TRAINING_EXTENSION_ITEMS: additions,
    LANG: 'EN', loc: (item, key) => item[key], shuffleArray: a => a
  });
  assert.equal(mapped.length, 16);
  for (const item of mapped) {
    const original = training.find(it => it.id === item.raw_id);
    assert.deepEqual(Array.from(item.options, o => o.key),
      original.options.filter(o => o.text !== "I don't know").map(o => o.label));
    assert.equal(item.hasOmit, false, 'do not append a synthetic IDK option');
    assert.ok(item.options.some(o => o.key === PCP_KEY[item.raw_id]));
  }
  assert.equal(reflectionIds.length, 5);
  assert.deepEqual(Array.from(mapped.slice(-reflectionIds.length), it => it.raw_id), reflectionIds);
  assert.equal(JSON.stringify(training), snapshot, 'preserve the shared source banks');
});

let server, browser, origin;
before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__training') {
      const params = new URLSearchParams();
      for (const key of ['condition', 'arm', 'lang']) params.set(key, url.searchParams.get(key) || '');
      params.set('pid', 'training-regression');
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!doctype html><html><body>
        <div id="question"><iframe title="PCP training" height="800" style="width:100%;min-height:700px;border:0"
          src="embed-pcp.html?${params}"></iframe></div>
        <script>
          window.writes=[]; window.messages=[]; window.nextVisible=true;
          window.addEventListener('message', e=>window.messages.push(e.data));
          window.Qualtrics={SurveyEngine:{
            addOnReady:fn=>fn.call({questionContainer:document.getElementById('question'),
              hideNextButton:()=>window.nextVisible=false,
              showNextButton:()=>window.nextVisible=true,addOnUnload:()=>{}}),
            setEmbeddedData:(field,value)=>window.writes.push({field,value})
          }};
        </script><script src="qualtrics-pcp-train-js.js"></script></body></html>`);
      return;
    }
    const file = path.resolve(__dirname, '.' + url.pathname);
    if (!file.startsWith(__dirname + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.png':'image/png'})[path.extname(file)] || 'text/plain');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({headless:true});
});
after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function openTraining(t, condition, arm, lang) {
  const context = await browser.newContext();
  t.after(() => context.close());
  // Keep item order stable when testing restoration of an older saved answer.
  await context.addInitScript(() => { Math.random = () => 0.999999; });
  await context.route('**/*', route => {
    if (route.request().url().startsWith(origin + '/')) return route.continue();
    return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${origin}/__training?${new URLSearchParams({condition,arm,lang})}`);
  const frame = page.frames().find(f => f.url().includes('/embed-pcp.html'));
  await frame.locator('#rct-submit-final').waitFor();
  assert.equal(await page.evaluate(() => nextVisible), false);
  return {page, frame, errors};
}

for (const [condition, arm] of [['SEARCH',''],['LLM','unrestricted'],['LLM','socratic']]) {
  for (const lang of ['EN','DE']) {
    test(`${condition} ${arm} ${lang}: 16 best answers, charts and five reflections survive the bridge`, async t => {
      const {page, frame, errors} = await openTraining(t, condition, arm, lang);
      const seen = [];
      for (let i=0; i<16; i++) {
        assert.match(await frame.locator('.rct-question-progress').innerText(), new RegExp(`\\b${i+1}\\s+\\S+\\s+16\\b`));
        const src = await frame.locator('#chart-root img').getAttribute('src');
        const item = training.find(it => src.split('?')[0] === `charts/${it.chartId}.png`);
        assert.ok(item); seen.push(item.id);
        await frame.locator('#chart-root img').evaluate(img => img.decode());
        assert.ok(await frame.locator('#chart-root img').evaluate(img => img.complete && img.naturalWidth > 0));
        const options = frame.locator('#question-area .rct-question-options input');
        assert.deepEqual(await options.evaluateAll(inputs => inputs.map(input => input.value)),
          item.options.filter(o => o.text !== "I don't know").map(o => o.label));
        assert.equal(await frame.locator('#confidence-panel').count(), 0, 'no training confidence scale');
        assert.equal(await frame.locator('#rct-submit-final').isDisabled(), true);
        await frame.locator(`#question-area input[value="${PCP_KEY[item.id]}"]`).check();
        await frame.locator('#rct-submit-final').click();
        if (i >= 16 - reflectionIds.length) {
          assert.equal(item.id, reflectionIds[i - (16 - reflectionIds.length)]);
          const next = frame.locator('#rct-reflection-continue');
          await next.waitFor();
          assert.equal(await next.isDisabled(), true);
          if (i % 2 === 0) {
            await frame.locator('#rct-reflection-text').fill('I compared the relevant axes and the selected lines.');
          } else {
            await frame.locator('#rct-reflection-tool').check();
          }
          assert.equal(await next.isDisabled(), false);
          await next.click();
          assert.equal(await frame.locator('.rct-reflection-overlay').count(), 0);
        }
      }
      await page.waitForFunction(() => nextVisible);
      assert.equal(new Set(seen).size, 16);
      const result = await page.evaluate(() => ({
        records:JSON.parse(writes.filter(w=>w.field==='vlat_train_responses').at(-1).value),
        completions:messages.filter(m=>m.type==='rct_complete').length
      }));
      assert.equal(result.completions, 1);
      assert.equal(result.records.length, 16);
      for (const [i, row] of result.records.entries()) {
        assert.equal(row.answer, PCP_KEY[row.raw_id]);
        assert.equal(row.interaction.mode, condition === 'SEARCH' ? 'search' : 'llm');
        if (i < 16 - reflectionIds.length) assert.equal(row.reflection, null);
        else {
          assert.equal(row.reflection.mode, i%2===0 ? 'own_reasoning' : 'tool_reliance');
          assert.equal(row.reflection.reasoning_text, i%2===0 ? 'I compared the relevant axes and the selected lines.' : null);
        }
      }
      assert.deepEqual(errors, []);
    });
  }
}

for (const kind of ['explicit', 'synthetic']) {
  test(`restored ${kind} abstention cannot enable training submission`, async t => {
    const {page, frame} = await openTraining(t, 'SEARCH', '', 'EN');
    const src = await frame.locator('#chart-root img').getAttribute('src');
    const item = training.find(it => src.split('?')[0] === `charts/${it.chartId}.png`);
    assert.ok(PCP_OMIT[item.id]);
    const value = kind === 'explicit' ? PCP_OMIT[item.id] : 'idk';
    await frame.evaluate(({id,value}) => {
      const key = Object.keys(localStorage).find(k=>k.startsWith('rct_log_'));
      const log = JSON.parse(localStorage.getItem(key));
      log.answers['vlat_'+id] = value;
      localStorage.setItem(key,JSON.stringify(log));
    }, {id:item.id,value});
    await page.reload();
    const restored = page.frames().find(f => f.url().includes('/embed-pcp.html'));
    await restored.locator('#rct-submit-final').waitFor();
    assert.equal(await restored.locator('#question-area input:checked').count(), 0);
    assert.equal(await restored.locator('#rct-submit-final').isDisabled(), true);
    await restored.locator(`#question-area input[value="${PCP_KEY[item.id]}"]`).check();
    await restored.locator('#rct-submit-final').click();
    assert.match(await restored.locator('.rct-question-progress').innerText(), /\b2\s+\S+\s+16\b/);
  });
}
