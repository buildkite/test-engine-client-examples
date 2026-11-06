import { describe, expect, test } from 'vitest';

describe('widgets', () => {
  test('parses a widget', () => {
    expect(JSON.parse('{"name":"example"}').name).toBe('example');
  });

  describe('lookup', () => {
    test('reports a missing widget', () => {
      throw new Error('widget lookup failed');
    });
    test.skip('skips a disabled widget', () => {});
    test.todo('supports archived widgets');
    test('skips an unavailable widget', ({ skip }) => {
      skip();
    });
  });

  describe.skip('disabled lookup', () => {
    test('does not query widgets', () => {});
  });
});
