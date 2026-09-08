import { version } from 'vitest/package.json';

export default {
  test: {
    reporters: [
      'default',
      ['buildkite-test-collector/vitest/reporter', {
        tags: {
          'test.framework.name': 'vitest',
          'test.framework.version': version,
        },
      }],
    ],
    includeTaskLocation: true,
  },
};
