#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
[[ ${BUILDKITE_ORGANIZATION_SLUG:-}/${BUILDKITE_PIPELINE_SLUG:-}/${BUILDKITE_BRANCH:-} == buildkite/test-engine-client-examples/te-8021-scheduler-canary ]]
if [[ $(uname -s)/$(uname -m) != Linux/x86_64 ]]; then
  echo 'Scheduler acceptance requires the pinned Linux amd64 binaries' >&2
  exit 1
fi
case "$1" in
  released)
    dir=$(mktemp -d)
    trap 'rm -rf -- "$dir"' EXIT
    client="$dir/bktec"
    curl -qfsSL -o "$client" https://github.com/buildkite/test-engine-client/releases/download/v3.5.0/bktec_3.5.0_linux_amd64
    printf '%s  %s\n' 37b30c73a18dabe469404af94b85b95efb327bff4691a8385009dc031c1b7c0f "$client" | sha256sum -c
    chmod +x "$client"
    ;;
  rc3) client="$root/.buildkite/run-bktest" ;;
  *) exit 2 ;;
esac

mkdir scheduler-receipts
cp "$root/.buildkite/scheduler-canary/case.js" scheduler-case.js
for name in steady recover terminal; do
  printf "require('./scheduler-case')('%s');\n" "$name" > "scheduler-$name.test.js"
done

export BUILDKITE_ANALYTICS_KEY="$BUILDKITE_BUILD_ID-scheduler-canary-$1-$BUILDKITE_JOB_ID"
export BUILDKITE_ANALYTICS_LOCATION_PREFIX=jest-otel
export BUILDKITE_TEST_ENGINE_SUITE_SLUG=test-engine-client-examples
export BUILDKITE_TEST_ENGINE_DEBUG_ENABLED=true
unset BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN BUILDKITE_TESTS_OTLP_TOKEN
# Use the same suite-scoped OIDC audience as the existing Tests plugin, but
# never fall back to the plugin's suite-creation path.
BUILDKITE_ANALYTICS_TOKEN=$(buildkite-agent oidc request-token --audience \
  https://buildkite.com/organizations/buildkite/analytics/suites/test-engine-client-examples --lifetime 600)
export BUILDKITE_ANALYTICS_TOKEN

# The existing Jest collector owns reporting, not the CLI.
# Keep one Scheduler entry per lease; the two executions of a failing case
# should settle the same attempt, not create another Scheduler attempt.
# Matrix jobs share a step ID; each binary needs its own pool in this build.
status=0
"$client" pool consume --test-runner=jest --result-path=jest-result.json --test-file-pattern='scheduler-*.test.js' \
  --test-command 'npx jest --runInBand --runTestsByPath {{testExamples}} --json --testLocationInResults --outputFile {{resultPath}}' \
  --retry-command "npx jest --runInBand --runTestsByPath {{testExamples}} --testNamePattern '{{testNamePattern}}' --json --testLocationInResults --outputFile {{resultPath}}" \
  --pool-key "te-8021-$1" --pool-lease-max-attempts 1 --local-retry-count 1 --upload-results=false \
  2>&1 | tee scheduler-receipts/pool.log || status=${PIPESTATUS[0]}
test "$status" -eq 1
diff -u <(printf '1 passed\n') scheduler-receipts/steady
diff -u <(printf '1 failed\n2 passed\n') scheduler-receipts/recover
diff -u <(printf '1 failed\n2 failed\n') scheduler-receipts/terminal
test "$(grep -Ec 'Completed lease .* \(passed: 1, failed: 0, errored: 0\)' scheduler-receipts/pool.log)" -eq 2
test "$(grep -Ec 'Completed lease .* \(passed: 0, failed: 1, errored: 0\)' scheduler-receipts/pool.log)" -eq 1
test "$(grep -c 'Completed lease ' scheduler-receipts/pool.log)" -eq 3
if grep -Eq 'local fallback|Completed lease fallback-' scheduler-receipts/pool.log; then
  exit 1
fi
echo 'Verified 5 executions and 3 completed Scheduler leases'
