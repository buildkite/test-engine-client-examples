# pytest

Split pytest tests across parallel jobs with bktest. The Python test collector sends results to Test Engine.

## Pipeline

Copy the `pytest` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Other steps build on it:

- `pytest (with xdist)` runs three workers in each job through `PYTEST_ADDOPTS`.
- `Plan pytest pool` uploads [pool-workers.yml](./pool-workers.yml). `bktest pool run` starts a fresh pytest process for each batch.
- `Plan persistent pytest pool` uploads [pool-workers-persistent.yml](./pool-workers-persistent.yml). `bktest pool run -- buildkite-pytest` keeps one process per worker, so startup and session fixtures run once. `buildkite-pytest` needs collector 1.10.0 or later; this example pins 1.10.0.

For either pool example, copy the planner and its template, then [adapt the pair](../README.md#adapt-a-test-scheduler-pool).

## Test collector

Add `buildkite-test-collector` to your test dependencies, as in [setup.py](./setup.py), and pytest loads it automatically. [tests/conftest.py](./tests/conftest.py) adds execution tags. See [pytest collector](https://buildkite.com/docs/pipelines/configure/tests/test-collection/python-collectors#pytest-collector).

## Run locally

Use Python from `mise.toml` and run these commands from this directory:

```bash
pip install -e '.[dev]'
pytest
pytest -n 3 # with three xdist workers
```
