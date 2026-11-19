#!/usr/bin/env bash
# Contract checks without a Buildkite job or network access.
set -euo pipefail
cd "$(dirname "$0")/../.."
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
export BUILDKITE_ORGANIZATION_SLUG=example BUILDKITE_API_TOKEN=local-test

curl() {
  local url=${!#}
  [[ $case_name != unavailable ]] || return 22
  case $url in
    *runs\?build_id=*)
      jq -n --arg mode "$case_name" '[{build_id: "candidate", created_at: "2026-11-19T01:00:00Z", state: "finished",
        executions_count_by_result: {passed: (if $mode == "missing" then 7 else 8 end), failed: 0, skipped: 1}}]'
      ;;
    *runs\?*)
      jq -n --arg mode "$case_name" 'if $mode == "bootstrap" or $mode == "parity" then [] else
        [{build_id: "baseline", branch: "main", state: "finished", created_at: "2026-11-18T01:00:00Z"},
         {build_id: "newer", branch: "main", state: "finished", created_at: "2026-11-20T01:00:00Z"}] end'
      ;;
    *builds/*/tests*)
      [[ $url != */newer/* ]] || return 22
      jq -n --arg url "$url" --arg mode "$case_name" '["examples-rspec", "examples-rspec-collector"] | [ .[] as $suite | range(9) |
        {url: ("https://api.buildkite.com/v2/analytics/organizations/example/suites/" + $suite + "/tests/" + tostring),
         scope: "Workshop", name: ("test " + tostring), file_name: "./spec/workshop_spec.rb"} |
        if ($mode == "renamed" and ($url | contains("/candidate/"))) or ($mode == "parity" and $suite == "examples-rspec-collector")
        then .name += " renamed" else . end]'
      ;;
    *) return 22 ;;
  esac
}
# Advance the verifier's deadline without making failing tests take two minutes.
sleep() { SECONDS=$((SECONDS + 121)); }
export -f curl sleep
for case_name in pass bootstrap missing renamed parity unavailable; do
  export case_name
  expected=0
  case $case_name in missing|renamed|parity) expected=1 ;; unavailable) expected=2 ;; esac
  status=0
  .buildkite/harness/verify candidate examples-rspec examples-rspec-collector > "$work/$case_name" 2>&1 || status=$?
  [[ $status == "$expected" ]] || { cat "$work/$case_name"; echo "$case_name: expected exit $expected, got $status"; exit 1; }
done
grep -q BOOTSTRAP "$work/bootstrap"
grep -q 'identities match main build baseline' "$work/pass"
echo 'verify contracts passed: counts, main identity, parity, bootstrap, API/auth failures'

# Use the REAL agent parser: it expands shorthand plugin keys before upload sees them.
BUILDKITE_AGENT_ACCESS_TOKEN=dry-run BUILDKITE_PIPELINE_UPLOAD_DRY_RUN=true \
  BUILDKITE_BUILD_ID=11111111-2222-4333-8444-555555555555 BKTEC_VERSION=3.6.0-rc.2 \
  EXAMPLES=rspec .buildkite/harness/upload run > "$work/pipeline.json"
jq -e '.steps | length == 2 and .[0].key == "rspec" and
  .[0].plugins[0][]["client-version"] == "3.6.0-rc.2" and
  .[1].depends_on == ["rspec"] and .[1].allow_dependency_failure == true' "$work/pipeline.json" >/dev/null
echo 'upload contracts passed: selection, version override, verification after failed dependencies'

mkdir "$work/collector"
cp rspec-collector/mise.toml "$work/collector/"
(EXAMPLE="$work/collector" BKTEC_VERSION=3.6.0-rc.2 source .buildkite/hooks/pre-command
  grep -q 'version = "3.6.0-rc.2", bin = "bktec"' "$work/collector/mise.toml"
  rm "$BUILDKITE_TEST_ENGINE_PLAN_OUT")
for fallback in true false; do
  echo "{\"fallback\": $fallback}" > "$work/plan.json"
  status=0
  EXAMPLE=rspec BUILDKITE_TEST_ENGINE_PLAN_OUT="$work/plan.json" .buildkite/hooks/post-command > "$work/plan.log" 2>&1 || status=$?
  if [[ $fallback == true ]]; then [[ $status == 1 ]]; else [[ $status == 0 ]]; fi
done
echo 'hook contracts passed: direct-client version override before mise, fallback rejection'
