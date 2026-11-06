const { test, expect } = require('@playwright/test');

test('passed', () => {
  expect(2 + 3).toBe(5);
});

test('failed', () => {
  expect(1, 'Intentional example failure').toBe(2);
});

test.skip('skipped', () => {});

test.describe('retry', () => {
  test.describe.configure({ retries: 1 });

  test('passes on retry', ({}, testInfo) => {
    expect(testInfo.retry, 'Intentional first-attempt failure').toBe(1);
  });
});
