# pytest OpenTelemetry

Collect pytest results with HTTP and SQLite spans using OpenTelemetry, including when tests run in xdist workers.

## Pipeline

Add this step after choosing one of the test collector setups below:

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

The Python test collector sends results through bktec's OTLP relay, so set `upload-results: false`. `PYTEST_ADDOPTS` starts three xdist workers. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Both `pytest (OTel setup by collector)` and `pytest (OTel setup in suite)` are in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

- Use [collector-setup](./collector-setup/README.md) to let the test collector create the provider.
- Use [suite-setup](./suite-setup/README.md) if you already configure an OpenTelemetry provider in your tests.

Copy the chosen variant's requirements and configuration into your project, not the enclosing example directory.

## Run locally

Use Python from the chosen variant's `mise.toml`, activate a virtual environment, and run inside that variant:

```bash
pip install -r requirements.txt
BUILDKITE_ANALYTICS_OTEL_ENABLED=true pytest -n 3
```
