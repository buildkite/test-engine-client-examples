# Cucumber

Split Cucumber features across parallel jobs with bktec. The Ruby test collector sends results to Test Engine.

## Pipeline

Copy the `Cucumber` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step).

## Test collector

Add `buildkite-test_collector` and configure it with `hook: :cucumber` in your support code, as in [features/support/env.rb](./features/support/env.rb). See the collector's [Cucumber setup](https://github.com/buildkite/bktest/tree/test-collector-ruby/v2.17.1/test-collector-ruby#cucumber).

## Run locally

Use Ruby from `mise.toml` in this directory:

```bash
bundle install
bundle exec cucumber
```
