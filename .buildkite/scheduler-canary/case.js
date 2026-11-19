const fs = require('node:fs');
const { trace } = require('@opentelemetry/api');

module.exports = function defineCase(name) {
  test(`scheduler canary ${name}`, () => {
    const ledger = `scheduler-receipts/${name}`;
    const attempt = fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8').trim().split('\n').length + 1 : 1;
    const passes = name === 'steady' || (name === 'recover' && attempt > 1);
    const span = trace.getTracer('examples.scheduler-canary').startSpan(`${name} attempt ${attempt}`);
    span.end();
    fs.appendFileSync(ledger, `${attempt} ${passes ? 'passed' : 'failed'}\n`);
    expect(passes).toBe(true);
  });
};
