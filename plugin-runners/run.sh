#!/usr/bin/env bash
# Runs examples with bktest's built-in runners and with the Bash and Go runner
# plugins from a bktest checkout, against a local fake Test Engine, and checks
# that every variant plans, runs and retries the same tests.
#
# Usage:
#   BKTEST=/path/to/bktest BKTEST_PLUGINS=/path/to/bktest/plugins plugin-runners/run.sh [runner...]
#
# Runners: rspec cucumber jest vitest playwright cypress pytest gotest.
# Install each example's dependencies first, as in its README. The Go plugins
# must be built with `plugins/build.sh` in the bktest checkout.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${BKTEST:?set BKTEST to a bktest binary with runner plugin support}"
: "${BKTEST_PLUGINS:?set BKTEST_PLUGINS to the plugins directory of a bktest checkout}"
variants=(${VARIANTS:-built-in bash go})
runners=("$@")
if ((${#runners[@]} == 0)); then
  runners=(rspec cucumber jest vitest playwright cypress pytest gotest)
fi

out="${OUT:-$root/plugin-runners/tmp}"
rm -rf "$out"
mkdir -p "$out"
port="${PORT:-18765}"
python3 "$root/plugin-runners/fake-test-engine.py" "$port" "$out/requests.jsonl" &
server=$!
cleanup_files=()
cleanup() {
  kill "$server" 2>/dev/null || true
  rm -rf -- "${cleanup_files[@]}"
}
trap cleanup EXIT
sleep 1
kill -0 "$server" 2>/dev/null || { echo "fake Test Engine failed to start on port $port" >&2; exit 1; }

# Each example adds a test that fails on its first attempt and passes when
# bktest retries it, using a marker file. Cypress has no report, so bktest
# can't retry its tests and it gets no such test.
flaky_test() {
  local runner=$1
  case $runner in
    rspec)
      echo spec/plugin_demo_flaky_spec.rb
      cat >spec/plugin_demo_flaky_spec.rb <<'RUBY'
RSpec.describe "Runner plugin demo" do
  it "passes when bktest retries it" do
    marker = ENV.fetch("PLUGIN_DEMO_MARKER")
    attempted = File.exist?(marker)
    File.write(marker, "attempted\n") unless attempted
    expect(attempted).to be(true)
  end
end
RUBY
      ;;
    cucumber)
      echo features/plugin_demo_flaky.feature features/step_definitions/plugin_demo_steps.rb
      cat >features/plugin_demo_flaky.feature <<'GHERKIN'
Feature: Runner plugin demo
  Scenario: passes when bktest retries it
    Given bktest has attempted this scenario before
GHERKIN
      cat >features/step_definitions/plugin_demo_steps.rb <<'RUBY'
Given("bktest has attempted this scenario before") do
  marker = ENV.fetch("PLUGIN_DEMO_MARKER")
  attempted = File.exist?(marker)
  File.write(marker, "attempted\n") unless attempted
  raise "first attempt" unless attempted
end
RUBY
      ;;
    vitest)
      echo tests/plugin-demo-flaky.test.js
      cat >tests/plugin-demo-flaky.test.js <<'JS'
import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('runner plugin demo', () => {
  test('passes when bktest retries it', () => {
    const marker = process.env.PLUGIN_DEMO_MARKER;
    const attempted = fs.existsSync(marker);
    if (!attempted) fs.writeFileSync(marker, 'attempted\n');
    expect(attempted).toBe(true);
  });
});
JS
      ;;
    playwright)
      echo tests/plugin-demo-flaky.spec.js
      cat >tests/plugin-demo-flaky.spec.js <<'JS'
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

test.describe('runner plugin demo', () => {
  test('passes when bktest retries it', () => {
    const marker = process.env.PLUGIN_DEMO_MARKER;
    const attempted = fs.existsSync(marker);
    if (!attempted) fs.writeFileSync(marker, 'attempted\n');
    expect(attempted).toBe(true);
  });
});
JS
      ;;
    pytest)
      echo tests/test_plugin_demo_flaky.py
      cat >tests/test_plugin_demo_flaky.py <<'PY'
import os


def test_passes_when_bktest_retries_it():
    marker = os.environ["PLUGIN_DEMO_MARKER"]
    attempted = os.path.exists(marker)
    if not attempted:
        open(marker, "w").write("attempted\n")
    assert attempted
PY
      ;;
    gotest)
      echo calculator/plugin_demo_flaky_test.go
      cat >calculator/plugin_demo_flaky_test.go <<'GO'
package calculator

import (
	"os"
	"testing"
)

func TestPassesWhenBktestRetriesIt(t *testing.T) {
	marker := os.Getenv("PLUGIN_DEMO_MARKER")
	if _, err := os.Stat(marker); err != nil {
		_ = os.WriteFile(marker, []byte("attempted\n"), 0o644)
		t.Fatal("first attempt")
	}
}
GO
      ;;
  esac
}

# configure sets the example directory and bktest settings, mirroring the
# example's step in .buildkite/pipeline.yml.
configure() {
  dir=$1
  env=()
  case $1 in
    rspec) env=(BUILDKITE_TEST_ENGINE_RESULT_PATH=tmp/rspec.json BUILDKITE_TEST_ENGINE_SPLIT_BY_EXAMPLE=true) ;;
    cucumber) env=(BUILDKITE_TEST_ENGINE_RESULT_PATH=tmp/cucumber.json BUILDKITE_TEST_ENGINE_SPLIT_BY_EXAMPLE=true) ;;
    jest)
      env=(BUILDKITE_TEST_ENGINE_RESULT_PATH=jest-result.json
        "BUILDKITE_TEST_ENGINE_RETRY_CMD=npx jest {{testExamples}} --testNamePattern '{{testNamePattern}}' --json --testLocationInResults --outputFile {{resultPath}}"
        JEST_RETRY_DEMO_MARKER="$marker")
      ;;
    vitest)
      env=(BUILDKITE_TEST_ENGINE_RESULT_PATH=tmp/vitest-results.json
        "BUILDKITE_TEST_ENGINE_TEST_CMD=npx vitest run {{testExamples}} --outputFile {{resultPath}}"
        "BUILDKITE_TEST_ENGINE_RETRY_CMD=npx vitest run {{testExamples}} --testNamePattern '{{testNamePattern}}' --outputFile {{resultPath}}")
      ;;
    playwright) env=(BUILDKITE_TEST_ENGINE_RESULT_PATH=tmp/playwright-results.json BUILDKITE_TEST_ENGINE_SPLIT_BY_EXAMPLE=true) ;;
    cypress) env=() ;;
    pytest) env=(BUILDKITE_TEST_ENGINE_SPLIT_BY_EXAMPLE=true) ;;
    gotest) dir=go env=(BUILDKITE_TEST_ENGINE_RESULT_PATH=tmp/gotest-result.jsonl) ;;
  esac
}

status=0
for runner in "${runners[@]}"; do
  for variant in "${variants[@]}"; do
    marker="$out/$runner-$variant.marker"
    configure "$runner"
    cd "$root/$dir"
    mkdir -p tmp
    mapfile -t added < <(flaky_test "$runner" | tr ' ' '\n')
    for file in "${added[@]}"; do cleanup_files+=("$root/$dir/$file"); done
    plugin_args=()
    if [[ $variant != built-in ]]; then plugin_args=(--plugin "$BKTEST_PLUGINS/$runner/$variant"); fi
    build_id="$(python3 -c 'import uuid; print(uuid.uuid4())')"
    for node in 0 1; do
      log="$out/$runner-$variant-$node.log"
      echo "--- $runner ($variant) node $node"
      set +e
      env "${env[@]}" \
        PLUGIN_DEMO_MARKER="$marker" \
        BUILDKITE_TEST_ENGINE_TEST_RUNNER="$runner" \
        BUILDKITE_TEST_ENGINE_BASE_URL="http://127.0.0.1:$port" \
        BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN=fake \
        BUILDKITE_TEST_ENGINE_SUITE_SLUG=plugin-demo \
        BUILDKITE_ORGANIZATION_SLUG=plugin-demo \
        BUILDKITE_TEST_ENGINE_UPLOAD_RESULTS=false \
        BUILDKITE_TEST_ENGINE_RETRY_COUNT=1 \
        BUILDKITE_BUILD_ID="$build_id" \
        BUILDKITE_STEP_ID="$runner-$variant" \
        BUILDKITE_JOB_ID="$runner-$variant-$node" \
        BUILDKITE_PARALLEL_JOB="$node" \
        BUILDKITE_PARALLEL_JOB_COUNT=2 \
        "$BKTEST" run "${plugin_args[@]}" >"$log" 2>&1
      code=$?
      set -e
      attempts=$(grep -c 'Attempt [0-9]* of' "$log" || true)
      echo "exit $code, $attempts retries; log: $log"
      if ((code != 0)); then status=1; tail -20 "$log"; fi
    done
    for file in "${added[@]}"; do rm -f "$root/$dir/$file"; done
  done
done

# Compare what each variant sent to Test Engine.
set +e
python3 - "$out/requests.jsonl" <<'PY'
import collections, json, sys
plans, stats = {}, collections.defaultdict(list)
for line in open(sys.argv[1]):
    r = json.loads(line)
    body = r["body"] or {}
    if r["path"].endswith("/test_plan") and r["method"] == "POST":
        tests = body["tests"]
        key = body["identifier"]
        plans[key] = (body["runner"], sorted(json.dumps(t, sort_keys=True) for t in tests.get("selectors", []) + tests.get("examples", [])))
    if r["path"].endswith("/test_plan_metadata"):
        stats[body["env"]["BUILDKITE_TEST_ENGINE_IDENTIFIER"]].append(body.get("statistics"))
rows = collections.defaultdict(dict)
for identifier, (runner, tests) in plans.items():
    rows[runner][identifier] = (tests, stats.get(identifier))
ok = True
for runner, by_id in rows.items():
    variants = list(by_id.values())
    same_tests = all(v[0] == variants[0][0] for v in variants)
    same_stats = all(v[1] == variants[0][1] for v in variants)
    print(f"{runner}: {len(variants)} variants sent runner {runner!r}; same planned tests: {same_tests}; same statistics: {same_stats}; tests: {len(variants[0][0])}; statistics: {variants[0][1]}")
    ok = ok and same_tests and same_stats
sys.exit(0 if ok else 1)
PY
compare=$?
exit $((status || compare))
