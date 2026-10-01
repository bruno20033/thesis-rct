// Real-browser regression tests for the two hosted outcome pages and the existing
// Qualtrics bridge. The harness substitutes only the Qualtrics host API.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const items = require('./pcp_items_data.js');
const { PCP_KEY, PCP_OMIT } = require('./pcp_scoring.js');
const { scoreResponses, scoreBlock } = require('./pcp_score.js');

let server, browser, origin;
before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__bridge') {
      const block = url.searchParams.get('block');
      const lang = url.searchParams.get('lang');
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!doctype html><html><body style="margin:0">
        <div id="question"><iframe title="PCP test" style="width:100%;border:0"
          src="qualtrics-pcp-${block}.html?pid=regression&lang=${lang}"></iframe></div>
        <script>
          window.writes = []; window.messages = []; window.nextVisible = true;
          window.addEventListener('message', e => window.messages.push(e.data));
          window.Qualtrics = { SurveyEngine: {
            addOnReady: fn => fn.call({
              questionContainer: document.getElementById('question'),
              hideNextButton: () => window.nextVisible = false,
              showNextButton: () => window.nextVisible = true,
              addOnUnload: () => {}
            }),
            setEmbeddedData: (field, value) => window.writes.push({field, value})
          }};
        </script><script src="qualtrics-pcp-js.js"></script></body></html>`);
      return;
    }
    const file = path.resolve(__dirname, '.' + url.pathname);
    if (!file.startsWith(__dirname + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.png':'image/png'})[path.extname(file)] || 'text/plain');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (!String(error).includes("Executable doesn't exist")) throw error;
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }
});
after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function openTest(t, block, lang = 'EN', mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? {width:390,height:844} : {width:1100,height:900}, hasTouch: mobile });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.goto(`${origin}/__bridge?block=${block}&lang=${lang}`);
  const frame = page.frames().find(f => f.url().includes(`qualtrics-pcp-${block}.html`));
  await frame.locator('.option').first().waitFor();
  assert.equal(await frame.locator('#q-total').textContent(), '16');
  assert.equal(await page.evaluate(() => nextVisible), false);
  return {page, frame, errors, requests};
}

async function currentItem(frame) {
  const src = await frame.locator('#chart-area img').getAttribute('src');
  return items.find(it => src === `charts/${it.chartId}.png`);
}
async function waitChartReady(frame) {
  await frame.waitForFunction(() => {
    const img = document.querySelector('#chart-area img');
    return img && img.complete && img.naturalWidth > 0 && document.querySelector('#timer').textContent !== '…';
  }, null, {polling:50});
}

function confidenceField() { return 'confidence_rating'; }
function confidenceButton(frame) { return frame.locator('#btn-confidence'); }
async function chooseConfidence(frame, block, value) {
  const slider = frame.locator('#confidence-slider');
  await slider.focus();
  await slider.press('Home');
  for (let n = 1; n < value; n++) await slider.press('ArrowRight');
}

for (const block of ['posttest1', 'posttest2']) {
  for (const lang of ['EN', 'DE']) {
    test(`${block} ${lang}: 16 locked answers + confidence survive the unchanged bridge`, async t => {
      const {page, frame, errors, requests} = await openTest(t, block, lang, lang === 'DE');
      const seen = [], chosen = [];
      for (let i = 0; i < 16; i++) {
        const it = await currentItem(frame);
        seen.push(it.id);
        assert.equal(it.block, block);
        const expected = it.options.filter(o => o.label !== PCP_OMIT[it.id]);
        assert.deepEqual(await frame.locator('.option').evaluateAll(es => es.map(e => e.dataset.value)), expected.map(o => o.label));
        assert.equal(await frame.locator('#btn-next').isDisabled(), true);
        assert.equal(await frame.locator('#btn-next').textContent(), lang === 'DE' ? 'Antwort bestätigen' : 'Confirm answer');
        assert.equal(await frame.locator('#confidence-panel').isVisible(), false);
        await waitChartReady(frame);
        assert.equal(await frame.locator('#chart-area img').evaluate(img => img.complete && img.naturalWidth > 0), true);
        assert.equal(await frame.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth), true);

        const answer = i % 2 === 0 ? PCP_KEY[it.id] : expected.find(o => o.label !== PCP_KEY[it.id]).label;
        chosen.push(answer);
        await page.clock.runFor(1200);
        await frame.locator(`.option[data-value="${answer}"] input`).check();
        await frame.locator('#btn-next').click();
        assert.equal(await frame.locator('#q-current').textContent(), String(i + 1), 'answer must not advance');
        assert.equal(await frame.locator('#confidence-panel').isVisible(), true);
        assert.equal(await frame.locator('#confidence-question').textContent(), lang === 'DE'
          ? 'Wie sicher sind Sie, dass Ihre Antwort richtig ist?' : 'How confident are you that your answer is correct?');
        assert.equal(await confidenceButton(frame, block).isDisabled(), true, 'no default confidence');
        assert.equal(await frame.locator('input[name="confidence"]:checked').count(), 0);
        {
          assert.equal(await frame.locator('#confidence-panel').evaluate(el => el.tagName === 'DIALOG' && el.open), true);
          const slider = frame.locator('#confidence-slider');
          assert.equal(await slider.getAttribute('min'), '1');
          assert.equal(await slider.getAttribute('max'), '7');
          assert.equal(await slider.getAttribute('step'), '1');
          assert.equal(await slider.getAttribute('aria-valuetext'), lang === 'DE' ? 'Noch keine Bewertung ausgewählt' : 'No rating selected');
          assert.equal(await frame.locator('#confidence-low').innerText(), lang === 'DE' ? 'Überhaupt nicht sicher' : 'Not at all confident');
          assert.equal(await frame.locator('#confidence-high').innerText(), lang === 'DE' ? 'Sehr sicher' : 'Very confident');
          assert.equal(await frame.locator('#confidence-panel').evaluate(el => el.scrollWidth <= el.clientWidth), true);
        }
        assert.equal(await frame.locator('.option input:not(:disabled)').count(), 0, 'answer is locked');
        assert.equal(await frame.locator('#timer').isVisible(), false);
        if (i === 0) {
          if (process.env.PCP_TEST_ARTIFACTS_DIR) {
            fs.mkdirSync(process.env.PCP_TEST_ARTIFACTS_DIR, {recursive:true});
            await frame.locator('body').screenshot({path:path.join(process.env.PCP_TEST_ARTIFACTS_DIR, `${block}-${lang}.png`)});
          }
          // Confidence must neither consume answer time nor trigger answer timeout.
          await page.clock.runFor(95000);
          assert.equal(await frame.locator('#q-current').textContent(), '1');
        }
        const confidence = i === 0 ? 1 : i === 1 ? 7 : 4;
        await page.clock.runFor(2400);
        await chooseConfidence(frame, block, confidence);
        await confidenceButton(frame, block).click();
        assert.equal(await frame.locator('#q-current').textContent(), String(Math.min(i + 2, 16)));
        if (i < 15) assert.equal(await frame.evaluate(() => document.activeElement.id), 'question-progress');
      }
      await page.waitForFunction(() => writes.length === 1 && nextVisible, null, {polling:50});
      const {writes, messages} = await page.evaluate(() => ({writes, messages}));
      assert.equal(writes[0].field, 'post_test_1_q');
      const data = JSON.parse(writes[0].value);
      if (process.env.PCP_TEST_ARTIFACTS_DIR) {
        fs.writeFileSync(path.join(process.env.PCP_TEST_ARTIFACTS_DIR, `${block}-${lang}.json`), JSON.stringify(data, null, 2));
      }
      assert.equal(data.length, 16);
      assert.equal(new Set(seen).size, 16);
      assert.deepEqual(data.map(r => r.id), seen);
      assert.deepEqual(data.map(r => r.answer), chosen);
      data.forEach((r, i) => {
        assert.equal(r[confidenceField(block)], i === 0 ? 1 : i === 1 ? 7 : 4);
        {
          assert.equal(r.confidence_scale, '1-7');
          assert.equal('confidence_pct' in r, false, 'do not encode an ordinal rating as a percentage');
        }
        assert.equal(r.timeout, false);
        assert.equal(r.response_format, 'best_answer_confidence_likert7_v1');
        assert.ok(r.rt_ms >= 1200 && r.rt_ms < 3000, 'answer RT excludes confidence');
        assert.ok(r.confidence_rt_ms >= (i === 0 ? 97400 : 2400));
      });
      assert.equal(messages.filter(m => m.type === 'pcp_item_response').length, 16);
      assert.equal(messages.filter(m => m.type === 'rct_scroll_top').length, 16);
      assert.equal(messages.filter(m => m.type === 'pcp_block_complete').length, 1);
      assert.equal(messages.filter(m => m.type === 'rct_complete').length, 1);
      const complete = messages.find(m => m.type === 'pcp_block_complete');
      assert.equal(complete.itemsAnswered, 16);
      assert.equal(complete.attempted, 16);
      assert.equal(scoreResponses(data).accuracy, 0.5);
      assert.equal(scoreBlock(complete.embeddedData, block).accuracy, 0.5);
      const withoutConfidence = data.map(({confidence_pct, confidence_rating, confidence_scale, confidence_rt_ms, response_format, ...legacy}) => legacy);
      assert.deepEqual(scoreResponses(data), scoreResponses(withoutConfidence), 'confidence cannot change accuracy');
      assert.equal(await frame.locator('#complete-screen').isVisible(), true);
      // Repeated / stale UI submissions must not create another record or completion.
      await frame.evaluate(() => { submitAnswer(); submitAnswer(); });
      assert.equal(await page.evaluate(() => writes.length), 1);
      assert.ok(!requests.some(url => /pcp_scoring|\/llm|\/search/.test(url)), 'no key or tool access');
      assert.deepEqual(errors, []);
    });
  }

  test(`${block}: timeouts remain missing, reset state, and retain 16-item denominator`, async t => {
    const {page, frame, errors} = await openTest(t, block);
    for (let i = 0; i < 16; i++) {
      await waitChartReady(frame);
      if (i === 1) await frame.locator('.option input').first().check();
      await page.clock.runFor(90000);
    }
    await page.waitForFunction(() => writes.length === 1 && nextVisible, null, {polling:50});
    const records = await page.evaluate(() => JSON.parse(writes[0].value));
    assert.equal(records.length, 16);
    records.forEach(r => {
      assert.equal(r.answer, 'timeout');
      assert.equal(r.timeout, true);
      assert.equal(r[confidenceField(block)], null);
      assert.equal(r.confidence_rt_ms, null);
      assert.ok(r.rt_ms >= 90000);
    });
    assert.equal(scoreResponses(records).missing, 16);
    assert.equal(scoreResponses(records).accuracy, 0);
    assert.deepEqual(errors, []);
  });

  test(`${block}: keyboard selection, confidence validation, and immutable submitted answer`, async t => {
    const {page, frame} = await openTest(t, block);
    await waitChartReady(frame);
    await frame.locator('.option input').first().focus();
    await page.keyboard.press('Space');
    assert.equal(await frame.locator('#btn-next').isEnabled(), true);
    await frame.locator('#btn-next').click();
    const selected = await frame.locator('.option.selected').getAttribute('data-value');
    await frame.evaluate(block => {
      selectOption(document.querySelectorAll('.option')[1]);
      [-10, 0, 8, 101, '', null, NaN, 1.5].forEach(value => selectConfidence(value));
      submitAnswer();
    }, block);
    assert.equal(await frame.locator('.option.selected').getAttribute('data-value'), selected);
    assert.equal(await frame.locator('#q-current').textContent(), '1');
    assert.equal(await confidenceButton(frame, block).isDisabled(), true);
    await chooseConfidence(frame, block, 1);
    assert.equal(await confidenceButton(frame, block).isEnabled(), true);
    await confidenceButton(frame, block).click();
    assert.equal(await frame.locator('#q-current').textContent(), '2');
    assert.equal(await frame.locator('#btn-next').isDisabled(), true);
    assert.equal(await frame.locator('input[name="confidence"]:checked').count(), 0);
  });

  test(`${block}: answer/confidence state cannot leak across a timeout`, async t => {
    const {page, frame} = await openTest(t, block);
    await waitChartReady(frame);
    await page.clock.runFor(90000); // First item expires with no answer.
    await waitChartReady(frame);
    const it = await currentItem(frame);
    await frame.locator(`.option[data-value="${PCP_KEY[it.id]}"] input`).check();
    await frame.locator('#btn-next').click();
    await chooseConfidence(frame, block, 1);
    await confidenceButton(frame, block).click();
    // The next item's unconfirmed selection must not inherit that confidence.
    await frame.locator('.option input').first().check();
    for (let i = 2; i < 16; i++) { await waitChartReady(frame); await page.clock.runFor(90000); }
    await page.waitForFunction(() => writes.length === 1, null, {polling:50});
    const records = await page.evaluate(() => JSON.parse(writes[0].value));
    assert.equal(records[1].id, it.id);
    assert.equal(records[1][confidenceField(block)], 1);
    assert.equal(records[1].timeout, false);
    records.filter((_, i) => i !== 1).forEach(r => {
      assert.equal(r.answer, 'timeout');
      assert.equal(r[confidenceField(block)], null);
      assert.equal(r.confidence_rt_ms, null);
    });
    assert.equal(scoreResponses(records).missing, 15);
    assert.equal(scoreResponses(records).accuracy, 0.063);
  });
}

test('immediate confidence modal: midpoint requires a deliberate choice; focus stays in the pop-up', async t => {
  const {page, frame} = await openTest(t, 'posttest1');
  await frame.locator('.option input').first().check();
  await frame.locator('#btn-next').click();
  const dialog = frame.locator('#confidence-panel');
  const slider = frame.locator('#confidence-slider');
  assert.equal(await dialog.evaluate(el => el.open), true);
  assert.equal(await frame.locator('#btn-confidence').isDisabled(), true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.evaluate(el => el.open), true, 'confidence cannot be skipped');
  await slider.focus();
  assert.equal(await frame.locator('#btn-confidence').isDisabled(), true, 'focus alone is not a response');
  await slider.click(); // Deliberately select the midpoint, even without moving the native thumb.
  assert.equal(await slider.inputValue(), '4');
  assert.equal(await frame.locator('#confidence-value').innerText(), '4 / 7');
  assert.equal(await frame.locator('#btn-confidence').isEnabled(), true);
  await slider.press('Tab');
  assert.equal(await frame.evaluate(() => document.activeElement.id), 'btn-confidence');
  await page.keyboard.press('Tab');
  assert.equal(await frame.evaluate(() => document.activeElement.id), 'confidence-slider');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await frame.evaluate(() => document.activeElement.id), 'btn-confidence');
  await page.keyboard.press('Enter');
  assert.equal(await dialog.evaluate(el => el.open), false);
  assert.equal(await frame.locator('#q-current').textContent(), '2');
  await frame.locator('.option input').first().check();
  await frame.locator('#btn-next').click();
  assert.equal(await slider.getAttribute('aria-valuetext'), 'No rating selected');
  assert.equal(await frame.locator('#btn-confidence').isDisabled(), true);
});

test('immediate mobile slider accepts touch at both endpoints and posts raw 1–7 ratings', async t => {
  const {page, frame} = await openTest(t, 'posttest1', 'EN', true);
  let count = 0;
  for (const rating of [7, 1]) {
    await frame.locator('.option input').first().check();
    await frame.locator('#btn-next').click();
    const slider = frame.locator('#confidence-slider');
    const box = await slider.boundingBox();
    await slider.tap({position:{x:rating === 1 ? 1 : box.width - 1, y:box.height / 2}});
    assert.equal(await slider.inputValue(), String(rating));
    assert.equal(await frame.locator('#confidence-value').innerText(), `${rating} / 7`);
    await frame.locator('#btn-confidence').click();
    await page.waitForFunction(n => messages.filter(m=>m.type==='pcp_item_response').length === n, ++count, {polling:50});
    const response = await page.evaluate(() => messages.filter(m=>m.type==='pcp_item_response').at(-1));
    assert.equal(response.confidence_rating, rating);
    assert.equal(response.confidence_scale, '1-7');
    assert.equal(response.response_format, 'best_answer_confidence_likert7_v1');
    assert.equal('confidence_pct' in response, false);
  }
});

test('legacy abstentions retain their original offline classification', () => {
  const data = items.filter(it => it.block === 'posttest1').map(it => ({id:it.id, answer:PCP_OMIT[it.id], timeout:false}));
  assert.equal(scoreResponses(data).omit_rate, 1);
  assert.equal(scoreResponses(data).accuracy, 0);
  assert.equal(items.filter(it => it.block === 'practice').every(it => it.options.some(o => o.label === PCP_OMIT[it.id])), true);
});
