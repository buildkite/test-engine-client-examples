# pytest

Split pytest tests across parallel jobs with bktec. The Python test collector sends results to Test Engine.

## Pipeline

Copy the `pytest` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Other steps build on it:

- `pytest (with xdist)` runs three workers in each job through `PYTEST_ADDOPTS`.
- `pytest (Test Scheduler pool)` starts pytest for each batch it takes from a pool shared by the step's jobs.
- `pytest (Test Scheduler pool exec)` keeps one `buildkite-pytest` process in each job, so startup and session fixtures run once. `buildkite-pytest` needs collector 1.10.0 or later; this example pins 1.10.0.

## Test collector

Add `buildkite-test-collector` to your test dependencies, as in [setup.py](./setup.py), and pytest loads it automatically. [tests/conftest.py](./tests/conftest.py) adds execution tags. See [pytest collector](https://buildkite.com/docs/pipelines/configure/tests/test-collection/python-collectors#pytest-collector).

## Run locally

Use Python from `mise.toml` with a virtual environment in this directory:

```bash
pip install -e '.[dev]'
pytest
pytest -n 3 # with three xdist workers
```
