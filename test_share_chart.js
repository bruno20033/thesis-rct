const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const vm = require('vm');

const ROOT = __dirname;
const EMBEDS = ['embed-pcp.html', 'embed.html'];

function sourceFor(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function shareToolbarGate(file) {
  const source = sourceFor(file);
  const match = source.match(/var shareToolbarHtml = ([^\n]+)\n\s*\?/);
  assert.ok(match, `${file} must define the share-toolbar feature gate`);

  return new Function(
    'IS_CR_MODE',
    'ARM',
    `'use strict'; return (${match[1].trim()});`
  );
}

for (const file of EMBEDS) {
  test(`${file}: inline JavaScript remains syntactically valid`, () => {
    const source = sourceFor(file);
    const scripts = Array.from(
      source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi),
      (match) => match[1]
    );

    assert.ok(scripts.length > 0, `${file} must contain an inline application script`);
    scripts.forEach((script, index) => {
      assert.doesNotThrow(
        () => new vm.Script(script, { filename: `${file}:inline-script-${index + 1}` }),
        `${file} inline script ${index + 1} must parse`
      );
    });
  });

  test(`${file}: chart sharing is available to both LLM arms`, () => {
    const canShare = shareToolbarGate(file);

    assert.strictEqual(canShare(false, 'unrestricted'), true);
    assert.strictEqual(canShare(false, 'socratic'), true);
  });

  test(`${file}: chart sharing remains unavailable in CR mode`, () => {
    const canShare = shareToolbarGate(file);

    assert.strictEqual(canShare(true, 'unrestricted'), false);
    assert.strictEqual(canShare(true, 'socratic'), false);
  });

  test(`${file}: chart context does not relax Socratic answer guardrails`, () => {
    const source = sourceFor(file);
    const promptStart = source.indexOf('var SYSTEM_PROMPT_SOCRATIC_CHART');
    const promptEnd = source.indexOf('// System prompts for CR', promptStart);

    assert.notStrictEqual(promptStart, -1, `${file} must define a Socratic chart prompt`);
    assert.notStrictEqual(promptEnd, -1, `${file} must delimit the Socratic chart prompt`);
    assert.match(
      source.slice(promptStart, promptEnd),
      /(?:Seeing|Receiving) (?:the )?chart(?: context)? does not change/i
    );
  });

  test(`${file}: shared context is arm-neutral and multimodal`, () => {
    const source = sourceFor(file);
    const builderStart = source.indexOf('async function rctBuildMessagesFromLog');
    const branchStart = source.indexOf("else if (e.type === 'context_share')", builderStart);
    const branchEnd = source.indexOf('\n      }\n', branchStart);

    assert.notStrictEqual(builderStart, -1, `${file} must build messages from the log`);
    assert.notStrictEqual(branchStart, -1, `${file} must handle context_share events`);
    assert.notStrictEqual(branchEnd, -1, `${file} must close the context_share branch`);

    const branch = source.slice(branchStart, branchEnd);
    assert.match(branch, /type:\s*'image_url'/);
    assert.doesNotMatch(branch, /ARM\s*===/);
  });

  test(`${file}: sharing remains one event per question`, () => {
    const source = sourceFor(file);

    assert.match(source, /id="rct-share-chart-btn"/);
    assert.match(
      source,
      /e\.type === 'context_share' && e\.question_id === curId/
    );
    assert.match(
      source,
      /logEvent\(\{ type: 'context_share', question_id: q\.id \}\)/
    );
    assert.match(
      source,
      /share\.disabled = busy \|\| isFinalised\(\) \|\| currentQuestionAlreadyShared\(\)/
    );
  });
}
