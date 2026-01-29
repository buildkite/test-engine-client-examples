// Simulates a flaky test that fails randomly ~50% of the time
test('flaky test that sometimes passes', () => {
  const shouldPass = Math.random() > 0.3;
  expect(shouldPass).toBe(true);
});

describe('Random number generator tests', () => {
  test('flaky test for random value above threshold', () => {
    const randomValue = Math.random();
    expect(randomValue).toBeGreaterThan(0.3);
  });

  test('flaky test for random coin flip', () => {
    const coinFlip = Math.random() > 0.5;
    expect(coinFlip).toBe(true);
  });
});
