#!/usr/bin/env bash
set -euo pipefail

stable=d630c96e7be9772a46e9731d70b269d6e3fe7f084001de47cc8e91e1dc8227e7
released=37b30c73a18dabe469404af94b85b95efb327bff4691a8385009dc031c1b7c0f
hook_sha=2b995a7813df66d17bc21f7c5d4c6b5232a1f0b0d3478b816a38051f4fa2f053
legacy=https://github.com/buildkite/test-engine-client/releases/download
canonical=https://github.com/buildkite/bktest/releases/download

sha() { printf '%s  %s\n' "$1" "$2" | sha256sum -c; }
get() { curl -qfsSL --proto '=https' --proto-redir '=https' -o "$2" "$1"; }
[[ $(uname -s)/$(uname -m) == Linux/x86_64 ]]
case ${1:-} in
  verify-public) ;;
  hosted)
    [[ ${BUILDKITE_ORGANIZATION_SLUG:-}/${BUILDKITE_PIPELINE_SLUG:-}/${BUILDKITE_BRANCH:-} == buildkite/test-engine-client-examples/te-8021-stable-canary ]]
    [[ ${TE8021_CONFIRMED_ARCHIVE_SHA256:-} == e758f9e8d17b175a744c315c3f9daf281719f8f312e6baa84da51d5ee2feb0c8 ]]
    ;;
  *) echo 'Expected verify-public or hosted' >&2; exit 2 ;;
esac

work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
get "$canonical/v3.6.0/bktest_3.6.0_linux_amd64" "$work/bktest"
get "$legacy/v3.6.0/bktec_3.6.0_linux_amd64" "$work/bktec"
get "$canonical/v3.6.0/bktest_3.6.0_checksums.txt" "$work/canonical.checksums"
get "$legacy/v3.6.0/bktec_3.6.0_checksums.txt" "$work/legacy.checksums"
sha "$stable" "$work/bktest"
sha "$stable" "$work/bktec"
sha 71c61dd13d2747dbadb7acb13248263498ee1297844e7a6f2a87c356e6ca138b "$work/canonical.checksums"
sha 3b47139e950824db2bcd8235509a36cf12759164305509dacbc2e76e9564405d "$work/legacy.checksums"
cmp "$work/bktest" "$work/bktec"
get "$legacy/v3.5.0/bktec_3.5.0_linux_amd64" "$work/control-bktec"
sha "$released" "$work/control-bktec"

get https://raw.githubusercontent.com/buildkite-plugins/tests-buildkite-plugin/b6fce715c84e0237a005b9ab41c58a6c4a834f54/hooks/pre-command "$work/plugin-hook"
sha "$hook_sha" "$work/plugin-hook"
# Exercise the unchanged tagged installer in a fresh cache without sourcing
# the suite lookup/creation hook. Preserve its command substitution behavior.
sed -n '/^verify_checksum() {/,/^org_oidc_audience() {/ { /^org_oidc_audience() {/!p; }' "$work/plugin-hook" > "$work/installer"
source "$work/installer"
export BUILDKITE_PLUGIN_TESTS_CLIENT_VERSION=v3.6.0 BUILDKITE_PLUGIN_TESTS_CLIENT_OS=linux BUILDKITE_PLUGIN_TESTS_CLIENT_ARCH=amd64
bin="$(download_bktec "$work/plugin-cache")"
[[ "$bin" == "$work/plugin-cache/3.6.0/linux_amd64/bktec" ]]
sha "$stable" "$bin"
cmp "$bin" "$work/bktec"
chmod +x "$work/bktest" "$work/control-bktec"
[[ $("$work/bktest" --version) == 'bktest v3.6.0' ]]
[[ $("$bin" --version) == 'bktest v3.6.0' ]]
[[ $("$work/control-bktec" --version) == 'bktec v3.5.0' ]]
[[ $1 == hosted ]] || exit 0

export BUILDKITE_TEST_ENGINE_SUITE_SLUG=test-engine-client-examples
export BUILDKITE_ANALYTICS_LOCATION_PREFIX=jest-otel
unset BUILDKITE_ANALYTICS_TOKEN BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN BUILDKITE_TESTS_OTLP_TOKEN
mkdir stable-receipts
for arm in control stable; do
  client=$work/control-bktec
  [[ $arm == control ]] || client=$bin
  export BUILDKITE_ANALYTICS_KEY="$BUILDKITE_BUILD_ID-stable-canary-$arm-$BUILDKITE_JOB_ID"
  "$client" run --test-runner=jest --test-file-pattern=otel.test.js \
    --test-command 'npx jest --runInBand --runTestsByPath {{testExamples}} --json --testLocationInResults --outputFile {{resultPath}}' \
    --result-path="stable-receipts/$arm.json" --plan-out="stable-receipts/$arm-plan.json" \
    --upload-results=false --otlp-relay=true --otlp-relay-batching=true 2>&1 | tee "stable-receipts/$arm.log"
  jq -e '[.testResults[].assertionResults[] | [.title,.status]] | sort ==
    [["captures a fetch request","passed"],["captures a manual child span","passed"],["captures an HTTP request","passed"]]' "stable-receipts/$arm.json" >/dev/null
  jq -e '.fallback != true and .parallelism == 1 and
    ([.tasks["0"].tests[] | if .format == "selector" then .value elif .format == "file" then .path else null end] |
      . == ["otel.test.js"] or . == ["jest-otel/otel.test.js"])' "stable-receipts/$arm-plan.json" >/dev/null
  grep -F '0 dropped permanently, 0 dropped at drain deadline' "stable-receipts/$arm.log"
done
