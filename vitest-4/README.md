# Vitest 4

Run Vitest 4 with bktest. The JavaScript test collector sends results to Test Engine.

## Pipeline

Copy the `Vitest 4` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Keep its `test-cmd` and `retry-cmd`: bktest's default commands pass `--reporter` flags, which replace the collector's reporter. Add `parallelism` to split tests across jobs.

## Test collector

Add `buildkite-test-collector` and keep both reporters and `includeTaskLocation` from [vitest.config.js](./vitest.config.js): the collector's reporter uploads results, and the JSON reporter writes the file bktest reads. See [Vitest](https://buildkite.com/docs/pipelines/configure/tests/test-collection/javascript-collectors#configure-the-test-framework-vitest).

## Run locally

Use Node from `mise.toml` in this directory:

```bash
npm ci
npm test
```
