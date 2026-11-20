# Minitest

Split your Minitest files across parallel jobs with bktec's custom runner.

## Pipeline

```yaml
steps:
  - label: ":ruby: Minitest"
    parallelism: 2
    commands:
      - bundle install
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: custom
          test-cmd: "bundle exec rake test TEST_FILES='{{testExamples}}'"
          test-file-pattern: "**/*_test.rb"
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

`test-file-pattern` discovers files; `test-cmd` passes each job's assignments to Rake. Keep the `TEST_FILES` handling from [Rakefile](./Rakefile) so each job runs only its files.

The Ruby test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Minitest` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add `buildkite-test_collector` to your Gemfile and configure `hook: :minitest` in your test helper, as in [test_helper.rb](./test_helper.rb). Require that helper from your tests.

## Run locally

Use Ruby from `mise.toml` and run these commands in this directory:

```bash
bundle install
bundle exec rake test
```
