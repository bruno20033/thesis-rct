const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const ROOT = __dirname;
const EMBEDS = ['embed-pcp.html', 'embed.html'];

function sourceFor(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function chartPromptSource(file) {
  const source = sourceFor(file);
  const start = source.indexOf('var SYSTEM_PROMPT_SOCRATIC_CHART');
  const end = source.indexOf('// System prompts for CR', start);
  assert.notStrictEqual(start, -1, `${file} must define the Socratic chart prompt`);
  assert.notStrictEqual(end, -1, `${file} must delimit the Socratic chart prompt`);
  return source.slice(start, end);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `must define ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = bodyStart; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function ${name}`);
}

for (const file of EMBEDS) {
  test(`${file}: concise Socratic prompt has a measurable response contract`, () => {
    const prompt = chartPromptSource(file);
    assert.match(prompt, /(?:aim for|target) 25.{1,3}50 words/i);
    assert.match(prompt, /never exceed 60 words/i);
    assert.match(prompt, /(?:no more than|at most) two sentences/i);
    assert.match(prompt, /exactly one (?:focused )?question/i);
    assert.match(prompt, /one question mark/i);
    assert.match(prompt, /do not use (?:bullets|lists)/i);
  });

  test(`${file}: Socratic tutor may give actionable process guidance`, () => {
    const prompt = chartPromptSource(file);
    assert.match(prompt, /direct (?:their )?attention to .*axis.*legend.*label.*region/is);
    assert.match(prompt, /confirm .*reasoning step.*method/is);
    assert.doesNotMatch(prompt, /Never lead with where to look/i);
    assert.doesNotMatch(prompt, /never .*describe its values, axis contents/is);
  });

  test(`${file}: Socratic tutor escalates support instead of repeating probes`, () => {
    const prompt = chartPromptSource(file);
    assert.match(prompt, /first attempt/i);
    assert.match(prompt, /(?:first failure|I don.t know|stuck)/i);
    assert.match(prompt, /repeated difficulty/i);
    assert.match(prompt, /never repeat substantially the same question/i);
  });

  test(`${file}: Socratic tutor does not invent unseen task or chart context`, () => {
    const prompt = chartPromptSource(file);
    assert.match(prompt, /context actually (?:present|provided)/i);
    assert.match(prompt, /do not assume .*axes.*legend.*chart type/is);
    assert.match(prompt, /share chart with assistant/i);
  });

  test(`${file}: Socratic tutor handles an unreadable chart as an access problem`, () => {
    const prompt = chartPromptSource(file);
    assert.match(prompt, /unreadable or unavailable/i);
    assert.match(prompt, /do not ask them to read details/i);
    assert.match(prompt, /ask only whether they can use "Share chart with assistant"/i);
    assert.match(prompt, /do not also ask them to read, describe, or transcribe/i);
  });

  test(`${file}: concise prompt preserves the target-answer boundary`, () => {
    const prompt = chartPromptSource(file);
    assert.match(prompt, /never state or confirm the final answer/i);
    assert.match(prompt, /never read out or calculate the target value/i);
    assert.match(prompt, /never state the target relationship, finding, or flaw/i);
  });
}

test('PCP Judge defines usefulness independently from fidelity and intent', () => {
  const source = sourceFor('embed-pcp.html');
  assert.match(source, /var _JUDGE_USEFULNESS_RUBRIC/);
  assert.match(source, /actionable single next step/i);
  assert.match(source, /vague, repetitive, overlong, or burdens.*multiple questions/i);
  assert.match(source, /usefulness_score/);
  assert.match(source, /usefulness_reasoning/);
});

test('PCP Judge parser requires a bounded usefulness score', () => {
  const source = sourceFor('embed-pcp.html');
  const declaration = extractFunction(source, 'rctJudgeParseResponse');
  const parse = new Function(`${declaration}; return rctJudgeParseResponse;`)();

  const valid = parse(JSON.stringify({
    fidelity_score: 4,
    fidelity_reasoning: 'withholds answer',
    intent_score: 3,
    intent_reasoning: 'asks for help',
    usefulness_score: 4,
    usefulness_reasoning: 'one tailored next step'
  }));
  assert.strictEqual(valid.usefulness_score, 4);
  assert.strictEqual(valid.usefulness_reasoning, 'one tailored next step');

  assert.strictEqual(parse(JSON.stringify({
    fidelity_score: 4,
    fidelity_reasoning: 'ok',
    intent_score: 3,
    intent_reasoning: 'ok'
  })), null);

  assert.strictEqual(parse(JSON.stringify({
    fidelity_score: 4,
    fidelity_reasoning: 'ok',
    intent_score: 3,
    intent_reasoning: 'ok',
    usefulness_score: 6,
    usefulness_reasoning: 'invalid'
  })), null);
});

test('usefulness telemetry is retained and exported', () => {
  const embed = sourceFor('embed-pcp.html');
  const consolidate = sourceFor('pcp_consolidate.js');
  const qualtrics = sourceFor('qualtrics-question-js.js');

  assert.match(embed, /usefulness_score:\s+parsed\.usefulness_score/);
  assert.match(embed, /usefulness_reasoning:\s+parsed\.usefulness_reasoning/);
  assert.match(consolidate, /usefulness:/);
  assert.match(consolidate, /usefulness_reasoning:/);
  assert.match(qualtrics, /judge_usefulness_/);
  assert.match(qualtrics, /judge_usefulness_reasoning_/);
  assert.match(qualtrics, /judge_avg_usefulness/);
});

test('the changed intervention records an explicit Socratic prompt version', () => {
  for (const file of EMBEDS) {
    const source = sourceFor(file);
    assert.match(source, /var SOCRATIC_PROMPT_VERSION\s*=\s*'socratic-concise-v1'/);
    assert.match(source, /socratic_prompt_version:\s*\(CONDITION === 'LLM' && ARM === 'socratic'\)/);
  }
  assert.match(sourceFor('qualtrics-question-js.js'), /setEmbeddedData\('socratic_prompt_version'/);
  assert.match(sourceFor('README.md'), /^socratic_prompt_version$/m);
});

test('the usefulness Judge receives bounded recent history for repetition and adaptation', () => {
  for (const file of EMBEDS) {
    const source = sourceFor(file);
    assert.match(source, /function rctJudgeBuildRecentHistory\(turnIndex\)/);
    assert.match(source, /\.slice\(-2\)/);
    assert.match(source, /<recent_history>/);
    assert.match(source, /turn\.question_id !== currentId/);
    assert.match(source, /rctJudgeBuildUserMessage\(participantMsg, assistantMsg, turnIndex\)/);
    assert.match(source, /var userMsg = rctJudgeBuildUserMessage\(participantMsg, assistantMsg, turnIndex\)/);
  }
});

test('recent Judge history includes only the last two completed turns from the current item', () => {
  const source = sourceFor('embed-pcp.html');
  const escapeDeclaration = extractFunction(source, 'rctJudgeXmlEscape');
  const historyDeclaration = extractFunction(source, 'rctJudgeBuildRecentHistory');
  const log = {
    events: [
      { type: 'prompt', question_id: 'old', content: 'old item' },
      { type: 'response', question_id: 'old', content: 'old response' },
      { type: 'prompt', question_id: 'current', content: 'first' },
      { type: 'response', question_id: 'current', content: 'first response' },
      { type: 'prompt', question_id: 'current', content: 'second' },
      { type: 'response', question_id: 'current', content: 'second response' },
      { type: 'prompt', question_id: 'current', content: 'third <attempt>' },
      { type: 'response', question_id: 'current', content: 'third & response' },
      { type: 'prompt', question_id: 'current', content: 'current unscored turn' }
    ]
  };
  const buildHistory = new Function(
    'log',
    'currentQuestion',
    `${escapeDeclaration}\n${historyDeclaration}\nreturn rctJudgeBuildRecentHistory;`
  )(log, () => ({ id: 'current' }));

  const history = buildHistory(5);
  assert.doesNotMatch(history, /old item|first response|current unscored turn/);
  assert.match(history, /second response/);
  assert.match(history, /third &lt;attempt&gt;/);
  assert.match(history, /third &amp; response/);

  const crossItemLog = {
    events: [
      { type: 'prompt', question_id: 'old', content: 'old first' },
      { type: 'response', question_id: 'old', content: 'old first response' },
      { type: 'prompt', question_id: 'old', content: 'old second' },
      { type: 'response', question_id: 'old', content: 'old second response' },
      { type: 'prompt', question_id: 'current', content: 'only prior current turn' },
      { type: 'response', question_id: 'current', content: 'current response' },
      { type: 'prompt', question_id: 'current', content: 'current unscored turn' }
    ]
  };
  const buildCrossItemHistory = new Function(
    'log',
    'currentQuestion',
    `${escapeDeclaration}\n${historyDeclaration}\nreturn rctJudgeBuildRecentHistory;`
  )(crossItemLog, () => ({ id: 'current' }));
  const crossItemHistory = buildCrossItemHistory(4);
  assert.doesNotMatch(crossItemHistory, /old first|old second/);
  assert.match(crossItemHistory, /only prior current turn/);
});
