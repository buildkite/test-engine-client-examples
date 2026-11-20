# pytest OpenTelemetry

Two ways to configure the Python test collector's OpenTelemetry path:

- [collector-setup](./collector-setup/README.md): the test collector creates the provider.
- [suite-setup](./suite-setup/README.md): `conftest.py` creates the provider before the session starts.

Use `pytest (OTel setup by collector)` or `pytest (OTel setup in suite)` in [pipeline.yml](../.buildkite/pipeline.yml). Both use xdist and the Tests Buildkite plugin with `upload-results: false`, sending test collector data through bktec's OTLP relay.

Copy one variant's requirements and configuration. Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, result, artifact, and mise paths; remove the variant's `cd` for tests at the repository root.

Run locally inside the chosen variant with Python from its `mise.toml` and a virtual environment: `pip install -r requirements.txt`, then `BUILDKITE_ANALYTICS_OTEL_ENABLED=true pytest -n 3`.
