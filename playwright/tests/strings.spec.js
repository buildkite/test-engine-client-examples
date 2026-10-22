// @ts-check
const { test, expect } = require('@playwright/test');

// Pure JavaScript tests that run without a browser page. They exist to give the
// Test Scheduler pool more files to split into batches.
test.describe('strings', () => {
  test('concatenates strings', async ({}) => {
    expect('test' + 'engine').toBe('testengine');
  });

  test('uppercases strings', async ({}) => {
    expect('buildkite'.toUpperCase()).toBe('BUILDKITE');
  });

  test('trims whitespace', async ({}) => {
    expect('  padded  '.trim()).toBe('padded');
  });
});
