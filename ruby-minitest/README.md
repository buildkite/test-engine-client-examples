# Minitest

Split Minitest files across parallel jobs with bktec's custom runner. The Ruby test collector sends results to Test Engine.

## Pipeline

Copy the `Minitest` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `test-file-pattern` finds your test files, and `test-cmd` passes each job's files to Rake in `TEST_FILES`. bktec doesn't read results from this step, so it can't retry or mute tests.

## Test collector

Add `buildkite-test_collector` and configure it with `hook: :minitest` in a helper your tests require, as in [test_helper.rb](./test_helper.rb). Keep the `TEST_FILES` handling in [Rakefile](./Rakefile) so each job runs only its files. See [minitest collector](https://buildkite.com/docs/pipelines/configure/tests/test-collection/ruby-collectors#minitest-collector).

## Run locally

Use Ruby from `mise.toml` in this directory:

```bash
bundle install
bundle exec rake test
```
