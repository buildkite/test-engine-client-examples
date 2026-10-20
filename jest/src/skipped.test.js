describe('skipped tests', () => {
  test.skip('is skipped with test.skip', () => {
    expect(true).toBe(false);
  });

  test.todo('is still to be written');

  test('runs alongside the skipped ones', () => {
    expect(1).toBe(1);
  });
});
