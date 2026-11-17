#!/usr/bin/env bash
set -euo pipefail
cd /workdir/.nowinandroid
task=testDemoDebugUnitTest
# NIA enables configuration cache by default; the README explicitly opts out.
common=(--no-daemon --no-configuration-cache --console=plain --profile --max-workers=4)
case "$NIA_PROOF_ROLE" in
  discovery)
    env -u BUILDKITE_ANALYTICS_TOKEN -u BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN \
      ./gradlew "${common[@]}" splitTests -PdiscoverTests -PsplitTestTask="$task"
    ;;
  control)
    ./gradlew "${common[@]}" -q proofNativeTaskPaths -PsplitTestTask="$task" > native-tasks.log
    cat native-tasks.log
    mapfile -t tasks < <(sed -n 's/^NATIVE_TASK=//p' native-tasks.log)
    test "${#tasks[@]}" -gt 0
    env -u BUILDKITE_ANALYTICS_TOKEN -u BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN \
      ./gradlew "${common[@]}" --continue --rerun-tasks "${tasks[@]}"
    ;;
  shard)
    bktec run --plan-out build/test-plan.json
    ;;
  *) exit 2 ;;
esac
