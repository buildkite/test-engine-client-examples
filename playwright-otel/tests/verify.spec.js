const { test, expect } = require('@playwright/test');

// Verification only: Test Engine must record a failed and a skipped execution.
test('fails on purpose for OTel verification', () => {
  expect(2 + 2).toBe(5);
});

test.skip('is skipped for OTel verification', () => {});
