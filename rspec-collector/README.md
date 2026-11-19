# RSpec with the Ruby collector

Run bktec directly to split and retry tests; the pinned Ruby collector uploads results with execution tags from [spec_helper.rb](./spec/spec_helper.rb). bktec's built-in upload stays off by default, so results upload once. The complete setup, including a **preview** Test Scheduler pool step, is [pipeline.yml](./pipeline.yml).

## Adopt it

Copy the Gemfile, lockfile, mise.toml, helper and chosen pipeline step. Set `BUILDKITE_TEST_ENGINE_SUITE_SLUG` to your suite. Create it and [allow your pipeline in its OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Each step here uses a separate suite to keep its results and timings isolated. Adjust test/result paths as needed; remove `cd rspec-collector` and the mise plugin's `dir` at your repository root.

bktec installs through mise and mints its own two-hour token in Buildkite, which it passes to the collector. Another supported option is the Tests plugin with `upload-results: false` and `oidc-lifetime` above your longest job duration.

## Run locally

With [mise](https://mise.jdx.dev/) installed, run `mise install`, `mise exec -- bundle install`, then `mise exec -- bundle exec rspec` for tests without uploading. To exercise bktec, set `BUILDKITE_TEST_ENGINE_SUITE_SLUG`, `BUILDKITE_TEST_ENGINE_TEST_RUNNER=rspec`, `BUILDKITE_TEST_ENGINE_RESULT_PATH=tmp/rspec.json` and your API credentials, then `mise exec -- bktec run`.

## What the fixtures cover

The same kite-workshop specs as the quick start produce **8 passed and 1 skipped** test in both steps.

| Specs | Test Engine behaviour |
| --- | --- |
| Frames, Sails, Bridles, Flight log | Four files taking 0.2, 0.4, 0.8 and 1.6 seconds, for timing-based splitting |
| Flight checks › Wind | Nested scope and parameterized names at 25, 5 and 60 km/h |
| Repairs archive | A deep file path for test selectors |
| Night flying | One skipped test, waiting for lights |

Start with [the quick start](../rspec) for a new suite, or add [OpenTelemetry](../rspec-otel) for traces.
