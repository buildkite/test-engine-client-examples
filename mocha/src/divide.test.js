const assert = require('node:assert/strict');
const divide = require('./divide');

describe('divide', () => {
  it('divides 6 / 2 to equal 3', () => {
    assert.equal(divide(6, 2), 3);
  });
});
