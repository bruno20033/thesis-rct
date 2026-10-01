const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(__dirname + '/embed-pcp.html', 'utf8');
const modalCode = source.slice(source.indexOf('  function showReflectionModal(q) {'), source.indexOf('  function allAnswered() {'));
const submitCode = source.slice(source.indexOf('  function refreshSubmitState() {'), source.indexOf('  // Called after current_question_index has been incremented.'));

function setup(answer = 'A', last = false) {
  const events = [];
  const completions = [];
  let overlay = null;
  let advanced = false;
  class Element {
    constructor() { this.value = ''; this.checked = false; this.disabled = false; this.listeners = {}; }
    addEventListener(type, cb) { this.listeners[type] = cb; }
    fire(type) { this.listeners[type]({type}); }
    focus() { document.activeElement = this; }
  }
  const textEl = new Element();
  const toolEl = new Element();
  const button = new Element();
  button.disabled = true; // Mirrors the disabled attribute in the modal markup.
  const slider = new Element(); slider.value = '4';
  const confidenceValue = new Element();
  const confidenceButton = new Element(); confidenceButton.disabled = true;
  const root = {
    classes: new Set(),
    classList: { add(name) { root.classes.add(name); }, remove(name) { root.classes.delete(name); } },
    setAttribute() {}, removeAttribute() {}
  };
  const document = {
    activeElement: null,
    querySelector() { return overlay; },
    createElement() {
      return {
        className: '', innerHTML: '', listeners: {},
        querySelector(selector) { return {'#rct-reflection-text': textEl, '#rct-reflection-tool': toolEl, '#rct-reflection-continue': button,
          '#rct-confidence-slider': slider, '#rct-confidence-value': confidenceValue, '#rct-confidence-continue': confidenceButton}[selector]; },
        addEventListener(type, cb) { this.listeners[type] = cb; },
        remove() { overlay = null; }
      };
    },
    body: { appendChild(el) { overlay = el; } }
  };
  const QUESTIONS = [
    {id: 'q12', type: 'vlat', options: [{key: 'A'}], reflection: true},
    {id: 'q13', type: 'vlat', options: [{key: 'A'}], reflection: true}
  ];
  const activeId = last ? 'q13' : 'q12';
  const log = {answers: {[activeId]: answer}, reflections: {[activeId]: {complete: false}}, confidences: {}, events, current_question_index: last ? 1 : 0};
  const context = {
    document, root, QUESTIONS, log, _viewingResult: false, chartReady: true, IS_VLAT_MODE: true,
    t: x => x, esc: x => x,
    currentQuestion: () => QUESTIONS[log.current_question_index],
    isLastQuestion: () => last,
    logEvent: event => events.push(event),
    persist() {}, postHeight() {}, lockPanel() {}, showPracticeCompletion() {}, postToParent: event => completions.push(event),
    advanceToNextQuestion() { advanced = true; },
    $() { return null; }, $$() { return []; }
  };
  vm.runInNewContext(`${modalCode}\n${submitCode}\nglobalThis.submit = onSubmitCurrent;`, context);
  function submitConfidence() { slider.fire('input'); confidenceButton.fire('click'); }
  return {context, events, completions, textEl, toolEl, button, slider, confidenceButton, submitConfidence, root, get overlay() { return overlay; }, get advanced() { return advanced; }};
}

test('reflection is requested after choosing an answer, before advancing', () => {
  const x = setup();
  x.context.submit();
  assert.ok(x.overlay);
  assert.ok(x.root.classes.has('is-reflecting'));
  assert.equal(x.events.some(e => e.type === 'answer_final'), false);
  x.submitConfidence();
  assert.equal(x.button.disabled, true);
  x.textEl.value = 'I compared the axis values.';
  x.textEl.fire('input');
  assert.equal(x.button.disabled, false);
  x.button.fire('click');
  assert.equal(x.overlay, null);
  assert.equal(x.advanced, true);
  assert.deepEqual(x.events.map(e => e.type), ['confidence_submitted', 'reflection_submitted', 'answer_final', 'question_advanced']);
  assert.equal(x.events[1].question_id, 'q12');
  assert.equal(x.events[1].reasoning_text, 'I compared the axis values.');
  assert.equal(x.events[2].reasoning_mode, 'own_reasoning');
});

test('tool reliance checkbox submits without a written explanation', () => {
  const x = setup();
  x.context.submit();
  x.submitConfidence();
  x.toolEl.checked = true;
  x.toolEl.fire('change');
  assert.equal(x.textEl.disabled, true);
  assert.equal(x.button.disabled, false);
  x.button.fire('click');
  assert.equal(x.events[1].reasoning_text, null);
  assert.equal(x.events[1].mode, 'tool_reliance');
  assert.equal(x.events[2].value, 'A');
});

test('no answer cannot open the reflection modal', () => {
  const x = setup(null);
  x.context.submit();
  assert.equal(x.overlay, null);
  assert.equal(x.events.length, 0);
});

test('last answer completes only after the reflection is submitted', () => {
  const x = setup('A', true);
  x.context.submit();
  assert.equal(x.completions.length, 0);
  x.submitConfidence();
  x.toolEl.checked = true;
  x.toolEl.fire('change');
  x.button.fire('click');
  assert.equal(x.events.find(e => e.type === 'answer_final').question_id, 'q13');
  assert.equal(x.completions.length, 1);
  assert.equal(x.completions[0].type, 'rct_complete');
});
