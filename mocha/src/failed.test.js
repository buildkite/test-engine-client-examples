const assert = require('node:assert');

describe('failed test', () => {
  it('adds 1 + 2 to equal 2', () => {
    assert.strictEqual(1 + 2, 2);
  });
});

describe('passing test', () => {
  it('adds 3 + 4 to equal 7', () => {
    assert.strictEqual(3 + 4, 7);
  });
});
