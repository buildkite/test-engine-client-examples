# Runner plugins (experimental)

Run the examples with bktest's built-in test runners, and with the same runners as external [runner plugins](https://github.com/buildkite/bktest/blob/spike/runner-plugins-combined/docs/runner-plugins.md) written in Go and in Bash, and check that all three plan, run and retry the same tests.

On this branch, CI also runs every example all three ways with the real Test Engine; see [In CI](#in-ci). The script here runs them locally against a fake Test Engine and compares what the three variants sent.

## What it does

[run.sh](./run.sh) starts [a fake Test Engine](./fake-test-engine.py) on localhost, then runs each example on two parallel nodes three times:

| Variant | How bktest runs the tests |
| --- | --- |
| `built-in` | `bktest run`, with the runner that is part of the bktest binary |
| `go` | `bktest run --runner-plugin <bktest>/plugins/<runner>/go`, the built-in runner's code as an external executable |
| `bash` | `bktest run --runner-plugin <bktest>/plugins/<runner>/bash`, an independent implementation in Bash and jq |

Each run uses the example's settings from [pipeline.yml](../.buildkite/pipeline.yml), with one retry. The `custom` runner runs the [Mocha example](../mocha).

- The fake Test Engine asks bktest to split every file by example, so RSpec, Cucumber, Playwright and pytest list their examples through the plugin's dry run.
- Each example gets a temporary test that fails on its first attempt and passes on its retry, so every plugin retries a real failure. The Jest example uses its existing [retry demo](../jest/src/retry.test.js). Cypress has no report bktest reads and the custom runner doesn't retry, so they get no such test.
- At the end, it compares what each variant sent to Test Engine: the runner name, the planned tests, and each node's statistics.

## Run it

Build bktest and its Go plugins from the branch, and install each example's dependencies as in its README. The Bash plugins need `jq`, and `python3` for JUnit XML.

```bash
git clone -b spike/runner-plugins-combined https://github.com/buildkite/bktest
(cd bktest && go build -o /tmp/bktest ./cmd/bktest && plugins/build.sh)

BKTEST=/tmp/bktest BKTEST_PLUGINS="$PWD/bktest/plugins" plugin-runners/run.sh
```

Pass runner names to run only some examples, such as `plugin-runners/run.sh rspec vitest`, and set `VARIANTS` to run only some variants, such as `VARIANTS="built-in bash"`. Logs and the recorded requests are in `plugin-runners/tmp`.

Expected output ends with one line per runner, for example:

```
rspec: 3 variants sent runner 'rspec'; same planned tests: True; same statistics: True; tests: 11; statistics: [...]
```

## In CI

Released bktest versions don't support `--runner-plugin`, so on this branch [pipeline.yml](../.buildkite/pipeline.yml) builds bktest from the `spike/runner-plugins-combined` branch of buildkite/bktest and every step uses that build:

- [build-bktest](../.buildkite/build-bktest) builds bktest and the Go plugins, and uploads them with the Bash plugins as an artifact.
- Each step starts with `source .buildkite/use-built-bktest`, which puts that bktest on `PATH` in place of the release the `tests` plugin would install.
- The steps in pipeline.yml run with bktest's built-in runners. [runner-plugin-variants](../.buildkite/runner-plugin-variants) then adds two groups that repeat every step that runs `bktest run`: one with each runner as an external Go plugin, and one as a Bash plugin. Those steps differ only in `BKTEST_RUNNER_VARIANT`, which `use-built-bktest` turns into `BUILDKITE_TEST_ENGINE_RUNNER_PLUGIN`.

The pool steps and the macOS steps use the built bktest with built-in runners only. Set `BKTEST_REF` on a new build to build another bktest branch, tag or commit.
