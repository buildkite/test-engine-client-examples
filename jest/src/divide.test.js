const divide = require('./divide');

test('divides 4 / 2 to equal 2', () => {
  expect(divide(4, 2)).toBe(2);
});
