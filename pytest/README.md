# pytest

pytest with parallel jobs, xdist, and Test Scheduler pools. Copy the dependencies in [setup.py](./setup.py); [tests/conftest.py](./tests/conftest.py) shows execution tags.

Use the `pytest`, `pytest (with xdist)`, `pytest (Test Scheduler pool)`, or `pytest (Test Scheduler pool exec)` steps in [pipeline.yml](../.buildkite/pipeline.yml). All set `upload-results: false` in the Tests Buildkite plugin; the Python test collector uploads results.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test and mise paths; remove `cd pytest` for tests at the repository root. Keep pool token unsets for job-identity claims. Pool exec retains the analytics token for test collection and installs the test collector version that provides `buildkite-pytest`.

Run locally in this directory with Python from `mise.toml` and a virtual environment: `pip install -e '.[dev]'`, then `pytest` or `pytest -n 3`.
