const multiply = require('./multiply');

describe('multiply', () => {
  test('multiplies 2 * 3 to equal 6', () => {
    expect(multiply(2, 3)).toBe(6);
  });

  test('multiplies 7 * 8 to equal 56', () => {
    expect(multiply(7, 8)).toBe(56);
  });

  test('multiplies 5 * 0 to equal 0', () => {
    expect(multiply(5, 0)).toBe(0);
  });
});
