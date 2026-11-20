# pytest with test collector SDK setup

Collect pytest results with SQLite and HTTP spans while the Python test collector sets up OpenTelemetry for you.

## Pipeline

```yaml
steps:
  - label: ":pytest: pytest (OTel setup by collector)"
    commands:
      - pip install -r requirements.txt
      - mkdir -p tmp
      - export BUILDKITE_ANALYTICS_KEY="$$BUILDKITE_BUILD_ID-python-otel-relay-$$BUILDKITE_JOB_ID"
      - bktec run
    env:
      BUILDKITE_ANALYTICS_OTEL_ENABLED: "true"
      BUILDKITE_TESTS_OTLP_RELAY: "true"
      PYTEST_ADDOPTS: "-n 3"
    plugins:
      - tests#v1.1.0:
          test-runner: pytest
          result-path: tmp/otel-relay.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector sends results through bktec's OTLP relay, so set `upload-results: false`. `PYTEST_ADDOPTS` starts three xdist workers. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `pytest (OTel setup by collector)` step is in [pipeline.yml](../../.buildkite/pipeline.yml).

## Test collector

Install the dependencies in [requirements.txt](./requirements.txt), including `buildkite-test-collector[otel]`. Enable your instrumentation before the session starts, as in [conftest.py](./conftest.py), but leave provider setup to the test collector. Adjust `testpaths` in [pytest.ini](./pytest.ini) to your tests.

## Run locally

Use Python from `mise.toml` with an activated virtual environment in this directory:

```bash
pip install -r requirements.txt
BUILDKITE_ANALYTICS_OTEL_ENABLED=true pytest -n 3
```
