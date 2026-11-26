# Cypress

Split Cypress specs across parallel jobs with bktest. The JavaScript test collector sends results to Test Engine.

## Pipeline

Copy the `Cypress` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). bktest doesn't read Cypress results, so the collector is the only way to upload them, and bktest can't retry or mute tests.

[bin/setup](./bin/setup) installs Cypress's Linux dependencies with `apt-get` as root, then the npm packages and the Cypress binary. Replace it if your agents already have them.

## Test collector

Add `buildkite-test-collector` and keep the reporter and its `token_name` option from [cypress.config.js](./cypress.config.js). See [Cypress](https://buildkite.com/docs/pipelines/configure/tests/test-collection/javascript-collectors#configure-the-test-framework-cypress).

## Run locally

Install [Cypress's system dependencies](https://docs.cypress.io/app/get-started/install-cypress#Linux-Prerequisites), then use Node from `mise.toml` in this directory:

```bash
npm ci
npm test
```
