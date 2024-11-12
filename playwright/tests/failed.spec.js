const { test, expect } = require('@playwright/test');

test.describe('test group', () => {
  test('failed', () => {
    expect(1).toBe(2);
  });
})
