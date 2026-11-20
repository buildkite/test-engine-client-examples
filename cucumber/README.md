# Cucumber

Split your Cucumber features across parallel jobs with bktec and send results to Test Engine with the Ruby test collector.

## Pipeline

```yaml
steps:
  - label: ":cucumber: Cucumber"
    parallelism: 2
    commands:
      - bundle install
      - mkdir -p tmp
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: cucumber
          result-path: tmp/cucumber.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Cucumber` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add `buildkite-test_collector` to your Gemfile, then load it in your Cucumber support code as in [features/support/env.rb](./features/support/env.rb):

```ruby
require "buildkite/test_collector"
require "cucumber"

Buildkite::TestCollector.configure(hook: :cucumber)
```

## Run locally

Use Ruby from `mise.toml` and run these commands in this directory:

```bash
bundle install
bundle exec cucumber
```
