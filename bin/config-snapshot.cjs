// Observe the shared Jest config after the collector has initialized, just as
// another reporter serializing the run would. Never print the config to logs.
const fs = require('node:fs');
module.exports = class {
  constructor(config) { this.config = config; }
  onRunComplete() {
    fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/token-config.json', JSON.stringify(this.config));
  }
};
