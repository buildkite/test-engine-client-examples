const { test: base, expect } = require('@playwright/test');

const TODO_URL = 'https://demo.playwright.dev/todomvc/';

const test = base.extend({
  todoPage: async ({ page }, use) => {
    await test.step('Open TodoMVC', async () => {
      await page.goto(TODO_URL);
      await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
    });
    await use(page);
  },
});

test('manage tasks and persist changes after reload', async ({ todoPage: page }) => {
  const items = page.getByTestId('todo-item');
  const input = page.getByPlaceholder('What needs to be done?');

  await test.step('Plan the release', async () => {
    for (const task of ['Review collector changes', 'Publish release notes']) {
      await test.step(`Add task: ${task}`, async () => {
        await input.fill(task);
        await input.press('Enter');
      });
    }
    await expect(page.getByTestId('todo-title')).toHaveText([
      'Review collector changes', 'Publish release notes',
    ]);
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');
  });

  await test.step('Update the release notes task', async () => {
    await items.nth(1).dblclick();
    const editor = items.nth(1).getByRole('textbox', { name: 'Edit' });
    await editor.fill('Publish Playwright release notes');
    await editor.press('Enter');
    await expect(page.getByTestId('todo-title').nth(1)).toHaveText('Publish Playwright release notes');
  });

  await test.step('Complete the review and filter tasks', async () => {
    await items.nth(0).getByRole('checkbox').check();
    await expect(page.getByTestId('todo-count')).toHaveText('1 item left');
    await test.step('Show active tasks', async () => {
      await page.getByRole('link', { name: 'Active', exact: true }).click();
      await expect(page.getByTestId('todo-title')).toHaveText(['Publish Playwright release notes']);
    });
    await test.step('Show completed tasks', async () => {
      await page.getByRole('link', { name: 'Completed', exact: true }).click();
      await expect(page.getByTestId('todo-title')).toHaveText(['Review collector changes']);
    });
  });

  await test.step('Reload and verify saved changes', async () => {
    await page.reload();
    await expect(page.getByTestId('todo-title')).toHaveText(['Review collector changes']);
    await expect(items.getByRole('checkbox')).toBeChecked();
    await page.getByRole('link', { name: 'All', exact: true }).click();
    await expect(page.getByTestId('todo-title')).toHaveText([
      'Review collector changes', 'Publish Playwright release notes',
    ]);
    await expect(items.nth(1).getByRole('checkbox')).not.toBeChecked();
  });

  await test.step('Clear completed tasks', async () => {
    await page.getByRole('button', { name: 'Clear completed' }).click();
    await expect(page.getByTestId('todo-title')).toHaveText(['Publish Playwright release notes']);
    await expect(page.getByTestId('todo-count')).toHaveText('1 item left');
  });
});

test('intentional failure: adding a task leaves no active tasks', async ({ todoPage: page }) => {
  await test.step('Add a task', async () => {
    await page.getByPlaceholder('What needs to be done?').fill('Check failure details');
    await page.getByPlaceholder('What needs to be done?').press('Enter');
  });
  await test.step('Check an intentionally wrong counter', async () => {
    await expect(page.getByTestId('todo-count'), 'Intentional example failure').toHaveText('0 items left', { timeout: 1000 });
  });
});

test.skip('share tasks with another user (not supported by TodoMVC)', () => {});

test.describe('retry', () => {
  test.describe.configure({ retries: 1 });

  test('open the task list after a transient service failure', async ({ page }, testInfo) => {
    // Simulate a service outage only on the first attempt, without changing the demo.
    if (testInfo.retry === 0) {
      await page.route(TODO_URL, route => route.fulfill({
        status: 503, contentType: 'text/plain', body: 'Service temporarily unavailable',
      }));
    }
    await test.step('Open the task list', async () => {
      const response = await page.goto(TODO_URL);
      expect(response.status(), 'TodoMVC should be available').toBe(200);
      await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
      await expect(page.getByTestId('todo-item')).toHaveCount(0);
    });
  });
});
