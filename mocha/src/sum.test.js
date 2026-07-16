const assert = require('node:assert');
const sum = require('./sum');

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    assert.strictEqual(sum(1, 2), 3);
  });
});
