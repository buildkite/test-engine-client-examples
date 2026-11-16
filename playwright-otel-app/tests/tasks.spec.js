const { test, expect } = require('buildkite-test-collector/playwright/fixture');
const { randomUUID } = require('node:crypto');

test('design team creates and lists tasks', async ({ page }) => {
  await page.goto(`/?project=design-${process.env.APP_TRACE_PROOF_ID || randomUUID()}`);
  await expect(page.getByRole('status')).toHaveText('0 tasks');
  await page.getByLabel('Task title').fill('Review checkout accessibility');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem')).toHaveText(['Review checkout accessibility']);
  await page.getByLabel('Task title').fill('Publish component guidelines');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem')).toHaveText([
    'Review checkout accessibility', 'Publish component guidelines',
  ]);
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('2 tasks');
});

test('operations API creates and lists a task', async ({ request }) => {
  const endpoint = `/api/projects/operations-${process.env.APP_TRACE_PROOF_ID || randomUUID()}/tasks`;
  const created = await request.post(endpoint, { data: { title: 'Rotate staging credentials' } });
  expect(created.status()).toBe(201);
  const task = await created.json();
  expect(task).toEqual({ id: expect.any(Number), title: 'Rotate staging credentials' });
  const listed = await request.get(endpoint);
  expect(listed.ok()).toBe(true);
  expect(await listed.json()).toEqual([task]);
});

test('finance team loads a deliberately slow report', async ({ page }) => {
  await page.goto(`/?project=finance-${process.env.APP_TRACE_PROOF_ID || randomUUID()}`);
  await expect(page.getByRole('status')).toHaveText('0 tasks');
  await page.getByLabel('Task title').fill('Reconcile October invoices');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('status')).toHaveText('1 task');
  await page.getByRole('button', { name: 'Load slow report' }).click();
  await expect(page.getByRole('status')).toHaveText('Report ready · 1 task');
  await expect(page.getByRole('listitem')).toHaveText(['Reconcile October invoices']);
});
