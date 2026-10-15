const reverseString = require('./reverse-string');

describe('reverseString', () => {
  test('reverses "buildkite" to "etikdliub"', () => {
    expect(reverseString('buildkite')).toBe('etikdliub');
  });

  test('reverses "abc" to "cba"', () => {
    expect(reverseString('abc')).toBe('cba');
  });

  test('reverses an empty string to an empty string', () => {
    expect(reverseString('')).toBe('');
  });
});
