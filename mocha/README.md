# Mocha

Split your Mocha files across parallel jobs with bktec's custom runner and send results to Test Engine with the JavaScript test collector.

## Pipeline

```yaml
steps:
  - label: ":mocha: Mocha"
    parallelism: 2
    commands:
      - npm ci
      - bktec run
    plugins:
      - tests#v1.2.0:
          test-runner: custom
          test-cmd: "npx mocha {{testExamples}} --reporter mocha-multi-reporters --reporter-options configFile=reporter-config.json"
          test-file-pattern: "src/**/*.test.js"
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.6.0"
```

`test-file-pattern` discovers files; `test-cmd` runs only each job's assignments. Mocha uses the custom runner, which splits whole files rather than individual tests and does not support automatic retries. This example does not configure a local result file or demonstrate muting.

The test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Mocha` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add `buildkite-test-collector` and `mocha-multi-reporters` to your dependencies and copy [reporter-config.json](./reporter-config.json). It enables the console reporter and `buildkite-test-collector/mocha/reporter`. Keep `token_name: "BUILDKITE_ANALYTICS_TOKEN"` in the collector options.

This example currently pins Mocha 11. Mocha 12 requires collector 1.16.1 or later and `mocha-multi-reporters` 1.5.2 or later.

For tests in a subdirectory of a monorepo, set `BUILDKITE_ANALYTICS_LOCATION_PREFIX` to that directory, as our pipeline does with `mocha`. The collector reports repository-relative file locations.

## Run locally

Use Node from `mise.toml` and run these commands in this directory:

```bash
npm ci
npm test
```

Both tests pass deterministically. Without `BUILDKITE_ANALYTICS_TOKEN`, the collector reports a missing token and does not upload results; local assertions still run.
