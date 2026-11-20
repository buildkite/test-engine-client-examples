# Go test

Go test splitting with gotestsum and bktec's built-in result upload. No test collector is required.

Use the `Go test` step in [pipeline.yml](../.buildkite/pipeline.yml). Keep the Tests Buildkite plugin's default result upload enabled.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result and mise paths; remove `cd go` if your module is at the repository root. Use your own module path rather than copying [go.mod](./go.mod) unchanged.

Run locally in this directory with Go from `mise.toml`: `go test ./...`. This does not upload results.
