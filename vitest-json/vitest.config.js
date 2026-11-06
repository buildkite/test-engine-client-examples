export default {
  test: {
    reporters: [
      'default',
      ['json', { outputFile: 'tmp/vitest-results.json' }],
      ['buildkite-test-collector/vitest/reporter', {
        tags: { 'json.proof.mode': process.env.JSON_PROOF_MODE || 'control' },
      }],
    ],
    includeTaskLocation: true,
  },
};
