const assert = require('node:assert/strict');
const test = require('node:test');

test('decodes an escaped Unicode identifier in JavaScript', () => {
  assert.equal(JSON.parse('"\\u0275"'), 'ɵ');
});
