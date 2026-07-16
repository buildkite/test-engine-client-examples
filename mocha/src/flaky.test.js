const assert = require('node:assert');

// Simulates a flaky test that fails randomly ~30% of the time
it('flaky test that sometimes passes', () => {
  const shouldPass = Math.random() > 0.3;
  assert.strictEqual(shouldPass, true);
});

describe('Random number generator tests', () => {
  it('flaky test for random value above threshold', () => {
    const randomValue = Math.random();
    assert.ok(randomValue > 0.3);
  });

  it('flaky test for random coin flip', () => {
    const coinFlip = Math.random() > 0.5;
    assert.strictEqual(coinFlip, true);
  });
});
