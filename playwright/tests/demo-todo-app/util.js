const { TODO_ITEMS } = require('./fixtures');

async function createDefaultTodos(page) {
  // create a new todo locator
  const newTodo = page.getByPlaceholder('What needs to be done?');

  for (const item of TODO_ITEMS) {
    await newTodo.fill(item);
    await newTodo.press('Enter');
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} expected
 */
async function checkNumberOfTodosInLocalStorage(page, expected) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['react-todos']).length === e;
  }, expected);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} expected
 */
async function checkNumberOfCompletedTodosInLocalStorage(page, expected) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['react-todos']).filter(i => i.completed).length === e;
  }, expected);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
async function checkTodosInLocalStorage(page, title) {
  return await page.waitForFunction(t => {
    return JSON.parse(localStorage['react-todos']).map(i => i.title).includes(t);
  }, title);
}

module.exports = {
  createDefaultTodos,
  checkNumberOfTodosInLocalStorage,
  checkNumberOfCompletedTodosInLocalStorage,
  checkTodosInLocalStorage
};

