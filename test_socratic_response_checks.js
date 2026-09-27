const assert = require('assert');
const test = require('node:test');

const checks = require('./socratic_response_checks.js');

test('accepts a concise response with one cue and one focused question', () => {
  const result = checks.inspect(
    'Start with the two variables named in the question and compare only the lines between those neighboring axes. Do they mostly cross or remain roughly parallel?'
  );

  assert.strictEqual(result.question_count, 1);
  assert.strictEqual(result.sentence_count, 2);
  assert.strictEqual(result.has_list, false);
  assert.strictEqual(result.passes_hard_checks, true);
  assert.deepStrictEqual(result.violations, []);
});

test('reports multiple questions, list formatting, excessive length, and sentence count', () => {
  const longWords = Array.from({ length: 61 }, (_, i) => `word${i + 1}`).join(' ');
  const result = checks.inspect(`First? Second?\n- ${longWords}. Another sentence. Final sentence.`);

  assert.strictEqual(result.question_count, 2);
  assert.strictEqual(result.has_list, true);
  assert.ok(result.word_count > 60);
  assert.ok(result.sentence_count > 2);
  assert.deepStrictEqual(result.violations.sort(), [
    'list_format',
    'more_than_60_words',
    'more_than_one_question',
    'more_than_two_sentences'
  ]);
  assert.strictEqual(result.passes_hard_checks, false);
});

test('tracks the 25-50 word target separately from hard failures', () => {
  const short = checks.inspect('Use the legend first. Which label matches the line you are tracing?');
  assert.strictEqual(short.passes_hard_checks, true);
  assert.strictEqual(short.within_target_length, false);

  const targeted = checks.inspect(
    'The relevant evidence is in the legend and the two adjacent axes named by the item, but you still need to interpret it. What pattern do you see between those axes?'
  );
  assert.strictEqual(targeted.within_target_length, true);
});

test('flags a response that contains no focused question', () => {
  const result = checks.inspect('Inspect the legend and the two relevant axes before deciding.');
  assert.deepStrictEqual(result.violations, ['missing_question']);
  assert.strictEqual(result.passes_hard_checks, false);
});

test('summarises a replay batch without hiding individual failures', () => {
  const summary = checks.summarise([
    'Use the legend first. Which label matches the line you are tracing?',
    'What do you see? What does it mean?'
  ]);

  assert.strictEqual(summary.total, 2);
  assert.strictEqual(summary.hard_pass_count, 1);
  assert.strictEqual(summary.hard_pass_rate, 0.5);
  assert.strictEqual(summary.results.length, 2);
});
