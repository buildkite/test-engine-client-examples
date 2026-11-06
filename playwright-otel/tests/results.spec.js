const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  numbers: async ({}, use) => {
    await use({ left: 2, right: 3 });
  },
});

test('passed', async ({ numbers }) => {
  await test.step('calculate', async () => {
    await test.step('add', async () => {
      expect(numbers.left + numbers.right).toBe(5);
    });
    await test.step('multiply', async () => {
      expect(numbers.left * numbers.right).toBe(6);
    });
  });
});

test('failed', async () => {
  await test.step('intentional failure', async () => {
    expect(1, 'Intentional example failure').toBe(2);
  });
});

test.skip('skipped', () => {});

test.describe('retry', () => {
  test.describe.configure({ retries: 1 });

  test('passes on retry', async ({}, testInfo) => {
    await test.step('retry attempt', async () => {
      expect(testInfo.retry, 'Intentional first-attempt failure').toBe(1);
    });
  });
});
