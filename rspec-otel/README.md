# RSpec OpenTelemetry

Send RSpec results to Test Engine as OpenTelemetry spans, with HTTP, Active Record, and Redis child spans, through bktec's OTLP relay.

## Choose a setup

- [collector-setup](./collector-setup/README.md): the Ruby test collector configures the OpenTelemetry SDK and installs the instrumentation you add. Start here.
- [suite-setup](./suite-setup/README.md): your suite configures the SDK, and the collector attaches to it. Suites that already configure OpenTelemetry [aren't yet supported](https://buildkite.com/docs/pipelines/configure/tests/test-collection/ruby-collectors#collecting-rspec-tests-with-opentelemetry).

Copy the files from the setup you choose, not this directory.

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.
