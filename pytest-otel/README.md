# pytest OpenTelemetry

Send pytest results to Test Engine as OpenTelemetry spans, with SQLite and HTTP child spans from xdist workers, through bktec's OTLP relay.

## Choose a setup

- [collector-setup](./collector-setup/README.md): the Python test collector creates the OpenTelemetry provider. Start here.
- [suite-setup](./suite-setup/README.md): your suite creates the provider, and the collector attaches to it. Suites that already configure OpenTelemetry [aren't yet supported](https://buildkite.com/docs/pipelines/configure/tests/test-collection/python-collectors#pytest-collector-collecting-pytest-tests-with-opentelemetry).

Copy the files from the setup you choose, not this directory.
