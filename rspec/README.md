# RSpec quick start

Use the [Tests plugin](https://github.com/buildkite-plugins/tests-buildkite-plugin) to install bktec, split tests across two jobs and upload RSpec JSON results. No collector is needed. The complete setup is [pipeline.yml](./pipeline.yml).

## Adopt it

Copy the Gemfile, lockfile, mise.toml and pipeline step into your repository. Change `suite-slug` to your Test Engine suite. Create the suite and [allow your pipeline in its OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) before running a public pipeline; automatic suite creation is unavailable there. Adjust the test/result paths if needed. Remove `cd rspec` and the mise plugin's `dir` when tests live at your repository root.

**Plugin v1.1.0 token lifetime:** its default token expires 300 seconds after pre-command, including dependency installation. A longer job can pass but lose its uploads. This example sets `oidc-lifetime: 7200` until the plugin defaults to a two-hour token. Keep the lifetime above your longest expected job duration.

## Run locally

With [mise](https://mise.jdx.dev/) installed, run `mise install`, `mise exec -- bundle install`, then `mise exec -- bundle exec rspec`. This runs tests without uploading. In Buildkite, use `bktec run` as shown in the pipeline.

## What the fixtures cover

The kite workshop has **8 passed and 1 skipped** test. Only the wind-safety check contains domain logic: 10–40 km/h inclusive is safe.

| Specs | Test Engine behaviour |
| --- | --- |
| Frames, Sails, Bridles, Flight log | Four files taking 0.2, 0.4, 0.8 and 1.6 seconds, for timing-based splitting |
| Flight checks › Wind | Nested scope and parameterized names at 25, 5 and 60 km/h |
| Repairs archive | A deep file path for test selectors |
| Night flying | One skipped test, waiting for lights |

For execution tags, see [the collector setup](../rspec-collector). For traces, see [OpenTelemetry](../rspec-otel).
