# Go test

Split your Go tests across parallel jobs and upload results to Test Engine with bktec, without adding a test collector.

## Pipeline

```yaml
steps:
  - label: ":golang: Go test"
    parallelism: 2
    commands:
      - go install gotest.tools/gotestsum@v1.12.0
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: gotest
          result-path: tmp/gotest-result.jsonl
          suite-slug: your-suite-slug
          client-version: "3.5.0"
          tags:
            - "language.name=go"
            - "test.framework.name=go-test"
```

The Tests Buildkite plugin enables bktec's built-in upload by default. `result-path` is the local JSONL file bktec reads and uploads. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Go test` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Run locally

Use Go from `mise.toml` and run in this directory. This runs the tests without uploading results:

```bash
go test ./...
```
