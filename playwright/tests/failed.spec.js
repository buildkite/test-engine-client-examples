const { test, expect } = require('@playwright/test');

test('failed', () => {
  expect(1).toBe(2);
})
