const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PCP_KEY, PCP_OMIT } = require('./pcp_scoring.js');
const extension = require('./pcp_training_extension.js');
const released = require(path.join(__dirname, 'pcp_items_data.js'));

const practice = released.filter(x => x.block === 'practice').concat(extension);
const post = new Set(released.filter(x => x.block !== 'practice').map(x => x.id));
assert.equal(practice.length, 16);
assert.equal(new Set(practice.map(x => x.id)).size, 16);
assert.equal(extension.length, 8);
assert.equal(extension.filter(x => x.reflection).length, 4);
assert.ok(practice.every(x => x.block === 'practice' && !post.has(x.id)));
for (const item of practice) {
  assert.ok(fs.existsSync(path.join(__dirname, 'charts', `${item.chartId}.png`)), item.id);
  assert.ok(item.options.some(o => o.label === PCP_KEY[item.id]), item.id);
  assert.ok(PCP_OMIT[item.id], item.id);
}
const expected = {
  pcp_create_1: 'Golden Crisp and Smacks',
  pcp_create_2: 'All-Bran with Extra Fiber',
  pcp_create_3: 'G and K',
  pcp_create_4: "Cap'n'Crunch",
  pcp_create_5: 'Golden Grahams',
  pcp_analyze_7: '90–230',
  pcp_analyze_2: 'The axes are not sorted uniformly; some are ascending and some are descending.',
  pcp_analyze_4: 'California'
};
for (const item of extension) {
  assert.equal(item.options.find(o => o.label === PCP_KEY[item.id]).text, expected[item.id], item.id);
}
const counts = Object.fromEntries('ABCD'.split('').map(letter => [letter, extension.filter(x => PCP_KEY[x.id] === letter).length]));
assert.deepEqual(counts, {A: 2, B: 2, C: 2, D: 2});
console.log('Training arm: 16 unique items, 4 reflection gates, all assets/keys and balanced extensions verified');
