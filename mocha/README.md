# Mocha

Split your Mocha files across parallel jobs with bktest's custom runner and send results to Test Engine with the JavaScript test collector.

## Pipeline

Copy the `Mocha` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step).

`test-file-pattern` discovers files; `test-cmd` runs only each job's assignments. Mocha uses the custom runner, which splits whole files rather than individual tests and does not support automatic retries. This example does not configure a local result file or demonstrate muting.

The test collector uploads results, so keep `upload-results: false`.

## Test collector

Add `buildkite-test-collector` and `mocha-multi-reporters` to your dependencies and copy [reporter-config.json](./reporter-config.json). It enables the console reporter and `buildkite-test-collector/mocha/reporter`. Keep `token_name: "BUILDKITE_ANALYTICS_TOKEN"` in the collector options.

Mocha 12 requires collector 1.16.1 or later and `mocha-multi-reporters` 1.5.2 or later.

For tests in a subdirectory of a monorepo, set `BUILDKITE_ANALYTICS_LOCATION_PREFIX` to that directory, as our pipeline does with `mocha`. The collector reports repository-relative file locations.

## Run locally

Use Node from `mise.toml` and run these commands in this directory:

```bash
npm ci
npm test
```

Both tests pass deterministically. Without `BUILDKITE_ANALYTICS_TOKEN`, the collector reports a missing token and does not upload results; local assertions still run.
