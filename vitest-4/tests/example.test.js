import { describe, expect, test } from 'vitest';

describe('arithmetic', () => {
  test('adds two numbers', () => {
    expect(1 + 2).toBe(3);
  });

  describe('nested', () => {
    test.skip('is skipped', () => {});
    test.todo('is pending');
    test('skips at runtime', ({ skip }) => {
      skip();
    });
  });
});
