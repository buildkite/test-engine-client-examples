const fs = require('node:fs');
const path = require('node:path');

// Only the Retry Enabled step opts in; ordinary and pool runs skip this demo.
const marker = process.env.JEST_RETRY_DEMO_MARKER;
const retryTest = marker ? test : test.skip;

retryTest('passes when bktec retries the first failure', () => {
  const attempted = fs.existsSync(marker);
  if (!attempted) {
    fs.mkdirSync(path.dirname(marker), { recursive: true });
    fs.writeFileSync(marker, 'first attempt\n');
  }
  expect(attempted).toBe(true);
});
