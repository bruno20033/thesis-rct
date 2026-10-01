// Offline prompt regression tests; no API calls or dialogue-comparison artifacts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const canonical = [...read('rct_arm_prompts.md').matchAll(/```\n([\s\S]*?)\n```/g)].map(m => m[1]);

function prompts(source) {
  const start = source.indexOf('var SYSTEM_PROMPT_UNRESTRICTED_CHART');
  const end = source.indexOf('// System prompts for CR', start);
  assert.ok(start >= 0 && end > start, 'chart prompt declarations must be present');
  return vm.runInNewContext(source.slice(start, end) + `
    ({ socratic: SYSTEM_PROMPT_SOCRATIC_CHART,
       unrestricted: SYSTEM_PROMPT_UNRESTRICTED_CHART });`);
}

for (const file of ['embed-pcp.html', 'embed.html']) {
  const source = read(file);
  const p = prompts(source);
  const prefix = canonical[0] + (file === 'embed-pcp.html' ? '\n\n' + canonical[1] : '');

  test(`${file}: deployed prompts exactly match the canonical text`, () => {
    assert.equal(p.unrestricted, prefix + '\n\n' + canonical[2]);
    assert.equal(p.socratic, prefix + '\n\n' + canonical[3]);
  });

  test(`${file}: both arms receive identical framing, length, format and grounding`, () => {
    for (const prompt of [p.socratic, p.unrestricted]) {
      assert.ok(prompt.startsWith(prefix + '\n\n'));
      assert.equal((prompt.match(/Aim for 25–50 words/g) || []).length, 1);
      assert.match(prompt, /never exceed 60 words\. Use no more than two sentences/);
      assert.match(prompt, /Do not use bullets or lists/);
      assert.match(prompt, /Ground your response in context actually present/);
    }
    assert.doesNotMatch(prefix, /company performance|Socratic|never state or confirm/i);
    if (file === 'embed-pcp.html') {
      assert.match(p.socratic, /depending on the axis directions/);
      assert.match(p.socratic, /do not establish that the current image is a parallel-coordinates plot/);
    }
  });

  test(`${file}: answer provision remains distinct from progressive Socratic scaffolding`, () => {
    assert.match(p.unrestricted, /state or confirm the final answer when asked/);
    assert.match(p.unrestricted, /do not require the participant to work through a Socratic dialogue/);
    assert.doesNotMatch(p.unrestricted, /Ask exactly one focused question|Never state or confirm/);
    assert.match(p.socratic, /Never state or confirm the final answer/);
    assert.match(p.socratic, /Never read out or calculate the target value/);
    assert.match(p.socratic, /when that is what the item tests/);
    assert.match(p.socratic, /Ask exactly one focused question/);
    assert.match(p.socratic, /After a first failure/);
    assert.match(p.socratic, /On repeated difficulty/);
    assert.match(p.socratic, /Never repeat substantially the same question/);
  });

  test(`${file}: chart regeneration follows the canonical format without changing CR`, () => {
    const start = source.indexOf('function rctJudgeBuildReinforcement(');
    const end = source.indexOf('// Forgiving JSON parser', start);
    assert.ok(start >= 0 && end > start);
    const run = isCR => vm.runInNewContext(source.slice(start, end) +
      '\nrctJudgeBuildReinforcement;', { IS_CR_MODE: isCR });
    const reason = 'The draft states the target answer.';
    const suffix = run(false)({ fidelity_reasoning: reason });
    assert.equal('{SYSTEM_PROMPT_SOCRATIC}' + suffix,
      canonical[4].replace('{fidelity_reasoning}', reason));
    assert.match(run(false)(null), /no specific reason given/);
    assert.equal(run(true)({ fidelity_reasoning: reason }),
      '\n\nIMPORTANT: Your previous draft response was scored below the Socratic-fidelity threshold for this study. Specific reason: ' + reason +
      '. Re-generate the message so it asks a probing conceptual question that targets the participant\'s reasoning WITHOUT revealing or computing the answer. Do NOT perform any arithmetic. Do NOT confirm or deny the participant\'s proposed answer. Keep it to 1-3 sentences, ideally one focused question.');
  });

  test(`${file}: all inline JavaScript parses after prompt edits`, () => {
    let count = 0;
    for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      if (!match[1].trim()) continue;
      new vm.Script(match[1], { filename: file });
      count += 1;
    }
    assert.ok(count > 0);
  });
}
