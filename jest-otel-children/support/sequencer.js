const Sequencer = require('@jest/test-sequencer').default
module.exports = class extends Sequencer {
  sort(tests) {
    // The nock file and its companion must run consecutively in the same worker.
    const priority = (test) => /nock.test.js$/.test(test.path) ? 0 : /plain.case.js$/.test(test.path) ? 1 : 2
    return [...tests].sort((a, b) => priority(a) - priority(b) || a.path.localeCompare(b.path))
  }
}
