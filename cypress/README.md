# Cypress

Run Cypress across parallel jobs with bktec and send results to Test Engine with the JavaScript test collector.

## Pipeline

```yaml
steps:
  - label: ":cypress: Cypress"
    parallelism: 2
    commands:
      - bin/setup
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: cypress
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

Copy [bin/setup](./bin/setup) if your Linux agents need Cypress's browser dependencies, or replace it with your own setup command. Our script uses apt and installs npm dependencies too.

The test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Cypress` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add `buildkite-test-collector` to your dependencies and set the reporter to `buildkite-test-collector/cypress/reporter`, as in [cypress.config.js](./cypress.config.js). Keep `token_name: "BUILDKITE_ANALYTICS_TOKEN"` in the reporter options.

## Run locally

Use Node from `mise.toml` with Cypress's system dependencies installed, then run in this directory:

```bash
npm install
npx cypress install
npm test
```
