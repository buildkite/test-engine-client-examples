# pytest

Run pytest across parallel jobs with bktec and collect results in Test Engine with the Python test collector.

## Pipeline

```yaml
steps:
  - label: ":pytest: pytest"
    parallelism: 2
    commands:
      - pip install -e '.[dev]'
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: pytest
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate.

See `pytest`, `pytest (with xdist)`, `pytest (Test Scheduler pool)`, and `pytest (Test Scheduler pool exec)` in [pipeline.yml](../.buildkite/pipeline.yml). Keep pool token unsets for job-identity claims. Pool exec retains the analytics token for the test collector and installs the version that provides `buildkite-pytest`.

## Test collector

Add `buildkite-test-collector` to your test dependencies, as in [setup.py](./setup.py); pytest loads it automatically. Add `pytest-xdist` if you want multiple workers per job. [tests/conftest.py](./tests/conftest.py) shows how to attach execution tags.

## Run locally

Use Python from `mise.toml` and an activated virtual environment in this directory:

```bash
pip install -e '.[dev]'
pytest
# To run with three xdist workers:
pytest -n 3
```
