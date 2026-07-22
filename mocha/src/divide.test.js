const assert = require('node:assert');
const divide = require('./divide');

describe('divide', () => {
  it('divides 4 / 2 to equal 2', () => {
    assert.strictEqual(divide(4, 2), 2);
  });
});
