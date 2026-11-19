# RSpec with OpenTelemetry

The Ruby collector creates the OpenTelemetry provider and instruments local HTTP and Active Record calls. bktec splits tests and relays OTLP results; built-in JSON upload stays off. See [pipeline.yml](./pipeline.yml) and [spec_helper.rb](./spec/spec_helper.rb).

## Adopt it

Copy the Gemfile, lockfile, mise.toml, helper and pipeline step. Change `BUILDKITE_TEST_ENGINE_SUITE_SLUG`, create your suite and [allow your pipeline in its OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Keep the OTLP relay enabled. Adjust test/result paths; remove `cd rspec-otel` and the mise plugin's `dir` at your repository root.

bktec installs through mise and mints its own two-hour token in Buildkite. If your application already owns an OpenTelemetry provider, see the [collector's OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-ruby/v2.17.1/test-collector-ruby/docs/opentelemetry.md) for support and limitations instead of configuring a second provider.

## Run locally

With [mise](https://mise.jdx.dev/) installed, run `mise install`, `mise exec -- bundle install`, then `mise exec -- bundle exec rspec` to run tests without uploading. In Buildkite, `bktec run` starts the relay and supplies the collector's credentials.

## What the fixtures cover

The kite workshop has **9 passed and 1 skipped** test, with no external services.

| Specs | Test Engine behaviour |
| --- | --- |
| Frames, Sails, Bridles, Flight log | Four files taking 0.2, 0.4, 0.8 and 1.6 seconds, for timing-based splitting |
| Flight checks › Wind | Nested scope and parameterized names at 25, 5 and 60 km/h |
| Repairs archive | A deep file path for test selectors |
| Night flying | One skipped test, waiting for lights |
| Orders | HTTP child spans from a local stub and SQL spans from an in-memory SQLite insert |

For fewer dependencies, use [the quick start](../rspec) or [JSON collector](../rspec-collector).
