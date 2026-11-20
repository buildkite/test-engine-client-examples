# pytest with test collector SDK setup

[conftest.py](./conftest.py) enables SQLite and urllib instrumentation without creating a provider. The Python test collector configures OpenTelemetry.

Use `pytest (OTel setup by collector)` in [pipeline.yml](../../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the test collector sends results through bktec's OTLP relay with xdist enabled.

Copy [requirements.txt](./requirements.txt), [pytest.ini](./pytest.ini), and the instrumentation setup. Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, result, artifact, and mise paths; remove `cd pytest-otel/collector-setup` for tests at the repository root. Keep `BUILDKITE_ANALYTICS_OTEL_ENABLED` and the relay configuration.

Run locally in this directory with Python from `mise.toml` and a virtual environment: `pip install -r requirements.txt`, then `BUILDKITE_ANALYTICS_OTEL_ENABLED=true pytest -n 3`.
