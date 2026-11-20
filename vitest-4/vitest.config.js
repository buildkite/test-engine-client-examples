import { version } from 'vitest/package.json';

export default {
  test: {
    reporters: [
      'default',
      'json',
      ['buildkite-test-collector/vitest/reporter', {
        tags: {
          'test.framework.name': 'vitest',
          'test.framework.version': version,
        },
      }],
    ],
    outputFile: 'tmp/vitest-results.json',
    includeTaskLocation: true,
  },
};
