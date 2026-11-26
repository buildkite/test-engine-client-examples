# Runner plugins (experimental)

Run the examples with the Bash and Go [runner plugins](https://github.com/buildkite/bktest/blob/spike/runner-plugins-opus/docs/runner-plugins.md) from a bktest branch, and check that they plan, run and retry the same tests as bktest's built-in runners.

This is a local demo for a draft bktest change, not part of [pipeline.yml](../.buildkite/pipeline.yml): released bktec versions don't support `--plugin`.

## What it does

[run.sh](./run.sh) starts [a fake Test Engine](./fake-test-engine.py) on localhost, then runs each example on two parallel nodes three times: with the built-in runner, with `--plugin <bktest>/plugins/<runner>/bash`, and with `--plugin <bktest>/plugins/<runner>/go`. Each run uses the example's settings from [pipeline.yml](../.buildkite/pipeline.yml), with one retry.

- The fake Test Engine asks bktest to split every file by example, so RSpec, Cucumber, Playwright and pytest list their examples through the plugin's dry run.
- Each example except Cypress gets a temporary test that fails on its first attempt and passes on its retry, so every plugin retries a real failure. The Jest example uses its existing [retry demo](../jest/src/retry.test.js). Cypress has no report, so bktest can't retry its tests.
- At the end, it compares what each variant sent to Test Engine: the runner name, the planned tests, and each node's statistics.

## Run it

Build bktest and its Go plugins from the branch, and install each example's dependencies as in its README:

```bash
git clone -b spike/runner-plugins-opus https://github.com/buildkite/bktest
(cd bktest && go build -o /tmp/bktest ./cmd/bktest && plugins/build.sh)

BKTEST=/tmp/bktest BKTEST_PLUGINS="$PWD/bktest/plugins" plugin-runners/run.sh
```

Pass runner names to run only some examples, such as `plugin-runners/run.sh rspec vitest`. Logs and the recorded requests are in `plugin-runners/tmp`.

Expected output ends with one line per runner, for example:

```
rspec: 3 variants sent runner 'rspec'; same planned tests: True; same statistics: True; tests: 11; statistics: [...]
```
