# pytest tag filters

pytest selection by execution tags. Copy the dependencies in [setup.py](./setup.py) and replace the example [test tags](./tests) with your own.

Use the `pytest (tag filters)` step in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `tag-filters: "component:frontend"` and `upload-results: false`; the Python test collector uploads results.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Change `tag-filters`, adjust test and mise paths, and remove `cd pytest-tag-filters` for tests at the repository root.

Run locally in this directory with Python from `mise.toml` and a virtual environment: `pip install -e '.[dev]'`, then `pytest`. This runs all tests; bktec applies the tag filter in CI.
