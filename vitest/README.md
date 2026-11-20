# Vitest 5

Run Vitest 5 with bktec while the JavaScript test collector sends results to Test Engine.

## Pipeline

```yaml
steps:
  - label: ":vitest: Vitest"
    commands:
      - npm ci
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: vitest
          test-cmd: "npx vitest run {{testExamples}} --outputFile {{resultPath}}"
          retry-cmd: "npx vitest run {{testExamples}} --testNamePattern '{{testNamePattern}}' --outputFile {{resultPath}}"
          result-path: tmp/vitest-results.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector uploads results, so set `upload-results: false`. Keep the explicit commands: bktec's default `--reporter` flags would replace the test collector reporter. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Vitest` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add `buildkite-test-collector` to your dependencies and copy the reporters from [vitest.config.js](./vitest.config.js). The test collector reporter uploads results; the JSON reporter writes the file bktec reads. Keep `includeTaskLocation` for source locations.

## Run locally

Use Node from `mise.toml` and run in this directory:

```bash
npm ci
npm test
```
