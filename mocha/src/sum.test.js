const assert = require('node:assert/strict');
const sum = require('./sum');

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    assert.equal(sum(1, 2), 3);
  });
});
