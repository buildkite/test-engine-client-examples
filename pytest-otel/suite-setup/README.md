# pytest with test suite SDK setup

[conftest.py](./conftest.py) creates an OpenTelemetry provider before the session starts and enables SQLite and urllib instrumentation. The Python test collector uses that provider.

Use `pytest (OTel setup in suite)` in [pipeline.yml](../../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the test collector sends results through bktec's OTLP relay with xdist enabled.

Copy [requirements.txt](./requirements.txt), [pytest.ini](./pytest.ini), and the provider setup. Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, result, artifact, and mise paths; remove `cd pytest-otel/suite-setup` for tests at the repository root. Keep `BUILDKITE_ANALYTICS_OTEL_ENABLED` and the relay configuration.

Run locally in this directory with Python from `mise.toml` and a virtual environment: `pip install -r requirements.txt`, then `BUILDKITE_ANALYTICS_OTEL_ENABLED=true pytest -n 3`.
