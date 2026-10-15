// @ts-check
const { test, expect } = require('@playwright/test');

// Pure JavaScript tests that run without a browser page. They exist to give the
// Test Scheduler pool more files to split into batches.
test.describe('math', () => {
  test('adds numbers', async ({}) => {
    expect(2 + 3).toBe(5);
  });

  test('multiplies numbers', async ({}) => {
    expect(4 * 5).toBe(20);
  });

  test('divides numbers', async ({}) => {
    expect(10 / 2).toBe(5);
  });
});
