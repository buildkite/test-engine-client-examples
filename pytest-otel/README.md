# pytest OpenTelemetry

Send pytest results to Test Engine as OpenTelemetry spans, with SQLite and HTTP child spans from xdist workers. The Python test collector creates the OpenTelemetry provider.

## Pipeline

Copy the `pytest (OTel setup by collector)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `BUILDKITE_ANALYTICS_OTEL_ENABLED` turns on OpenTelemetry collection, `BUILDKITE_TESTS_OTLP_RELAY` makes bktest forward the collector's spans to Test Engine and refresh their token, and `PYTEST_ADDOPTS` starts three xdist workers. See [Relay OpenTelemetry traces](https://github.com/buildkite/bktest/tree/v3.6.1#relay-opentelemetry-traces).

## Test collector

Use Python 3.10 or later, pytest 7 or later, and `buildkite-test-collector[otel]` 1.10.0 or later, as in [requirements.txt](./requirements.txt). The collector doesn't instrument libraries itself: turn on your instrumentation in [conftest.py](./conftest.py), before the session starts. Set `testpaths` in [pytest.ini](./pytest.ini) to your tests. See [Collecting pytest tests with OpenTelemetry](https://buildkite.com/docs/pipelines/configure/tests/test-collection/python-collectors#pytest-collector-collecting-pytest-tests-with-opentelemetry) and the collector's [OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-python/v1.10.0/test-collector-python/docs/opentelemetry.md#child-spans-and-instrumentation).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.

## Expected traces

```text
test.execution "tests/test_otel_spans.py::test_sql_queries"
└── test.body
    └── create_and_find_widget
        ├── CREATE
        ├── INSERT
        └── SELECT
```

The HTTP test has a urllib `GET` span.

## Run locally

Use Python from `mise.toml` with a virtual environment in this directory:

```bash
pip install -r requirements.txt
BUILDKITE_ANALYTICS_OTEL_ENABLED=true pytest -n 3
```
