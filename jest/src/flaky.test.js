// Simulates a flaky test that fails randomly ~50% of the time
test('flaky test that sometimes passes', () => {
  const shouldPass = Math.random() > 0.5;
  expect(shouldPass).toBe(true);
});
