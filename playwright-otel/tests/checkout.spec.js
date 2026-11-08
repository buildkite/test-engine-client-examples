const { test, expect } = require('@playwright/test');

test('confirms an order', async ({ page }) => {
  await page.setContent(`
    <label>Quantity <input type="number" value="1"></label>
    <button onclick="document.querySelector('[role=status]').textContent =
      'Ordered ' + document.querySelector('input').value + ' items'">Place order</button>
    <p role="status"></p>
  `);

  await test.step('checkout', async () => {
    await page.getByRole('spinbutton', { name: 'Quantity' }).fill('3');
    await test.step('submit order', async () => {
      await page.getByRole('button', { name: 'Place order' }).click();
      await expect(page.getByRole('status')).toHaveText('Ordered 3 items');
    });
  });
});
