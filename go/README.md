# Go test

Split Go packages across parallel jobs with bktest, which uploads the results to Test Engine. You don't need a test collector.

## Pipeline

Copy the `Go test` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). bktest runs gotestsum and uploads its JSON results; the Tests Buildkite plugin turns on that upload by default. `tags` adds execution tags to every result. See [Go](https://buildkite.com/docs/pipelines/configure/tests/test-collection/golang-collectors#tests-buildkite-plugin-example-for-go-test).

## Run locally

Use Go from `mise.toml` in this directory. This runs the tests without uploading results:

```bash
go test ./...
```
