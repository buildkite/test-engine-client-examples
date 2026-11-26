// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('playwright.dev', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://127.0.0.1:${process.env.TEST_SITE_PORT}`);
  });

  test('has title', async ({ page }) => {
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
  });

  test.describe('nested', () => {

    test('get started link', async ({ page }) => {
      // Click the get started link.
      await page.getByRole('link', { name: 'Get started' }).click();

      // Expects page to have a heading with the name of Installation.
      await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
    });
  })
});
