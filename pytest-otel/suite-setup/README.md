# pytest with suite OpenTelemetry setup

Send pytest results to Test Engine as OpenTelemetry spans, with SQLite and HTTP child spans from xdist workers, from a suite that creates its own OpenTelemetry provider.

> [!WARNING]
> Suites that already configure OpenTelemetry [aren't yet supported](https://buildkite.com/docs/pipelines/configure/tests/test-collection/python-collectors#pytest-collector-collecting-pytest-tests-with-opentelemetry). Use [collector-setup](../collector-setup/README.md) unless your suite must own the provider.

## Pipeline

Copy the `pytest (OTel setup in suite)` step from [pipeline.yml](../../.buildkite/pipeline.yml) and [adapt it](../../README.md#adapt-a-step). `BUILDKITE_ANALYTICS_OTEL_ENABLED` turns on OpenTelemetry collection, `BUILDKITE_TESTS_OTLP_RELAY` makes bktec forward the collector's spans to Test Engine and refresh their token, and `PYTEST_ADDOPTS` starts three xdist workers. See [Relay OpenTelemetry traces](https://github.com/buildkite/test-engine-client/tree/v3.5.0#relay-opentelemetry-traces).

## Test collector

Use Python 3.10 or later, pytest 7 or later, and `buildkite-test-collector[otel]` 1.10.0 or later, as in [requirements.txt](./requirements.txt). Set your tracer provider and instrumentation when [conftest.py](./conftest.py) is imported, before the collector attaches at session start. Child spans keep your provider's resource, including its `service.name`. Set `testpaths` in [pytest.ini](./pytest.ini) to your tests. See the collector's [OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-python/v1.10.0/test-collector-python/docs/opentelemetry.md#child-spans-and-instrumentation).

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
