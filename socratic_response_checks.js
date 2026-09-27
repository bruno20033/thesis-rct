'use strict';

const TARGET_MIN_WORDS = 25;
const TARGET_MAX_WORDS = 50;
const HARD_MAX_WORDS = 60;

function inspect(response) {
  const text = String(response == null ? '' : response).trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const questionCount = (text.match(/\?/g) || []).length;
  const sentenceCount = (text.match(/[.!?]+(?=\s|$)/g) || []).length;
  const hasList = /(^|\n)\s*(?:[-*+]|\d+[.)])\s+/m.test(text);
  const violations = [];

  if (questionCount === 0) violations.push('missing_question');
  if (questionCount > 1) violations.push('more_than_one_question');
  if (words.length > HARD_MAX_WORDS) violations.push('more_than_60_words');
  if (sentenceCount > 2) violations.push('more_than_two_sentences');
  if (hasList) violations.push('list_format');

  return {
    word_count: words.length,
    question_count: questionCount,
    sentence_count: sentenceCount,
    has_list: hasList,
    within_target_length: words.length >= TARGET_MIN_WORDS && words.length <= TARGET_MAX_WORDS,
    passes_hard_checks: violations.length === 0,
    violations
  };
}

function summarise(responses) {
  const results = (responses || []).map(inspect);
  const hardPassCount = results.filter((result) => result.passes_hard_checks).length;
  const targetLengthCount = results.filter((result) => result.within_target_length).length;

  return {
    total: results.length,
    hard_pass_count: hardPassCount,
    hard_pass_rate: results.length ? hardPassCount / results.length : null,
    target_length_count: targetLengthCount,
    target_length_rate: results.length ? targetLengthCount / results.length : null,
    results
  };
}

module.exports = {
  TARGET_MIN_WORDS,
  TARGET_MAX_WORDS,
  HARD_MAX_WORDS,
  inspect,
  summarise
};
