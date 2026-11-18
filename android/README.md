# Split Android JVM unit tests across Buildkite jobs

Split `app` and `library` tests across two Buildkite jobs using historical timings.
bktec plans the split. Gradle discovers and filters tests. The Android collector
uploads results.

## Requirements

**Collector 0.4.1 is required and is not published yet.** It needs
[class timing tags and fork timings (#126)](https://github.com/buildkite/bktest/pull/126)
and [uploads beyond 5,000 results (#127)](https://github.com/buildkite/bktest/pull/127).
Version 0.4.0 lacks the timing history this example uses.

Until release, this repo's CI uses [pinned collector source](../.buildkite/android-collector-source).
That is CI-only; do not copy the `.buildkite/` helpers.

- JDK 17+ and Android SDK 34.
- Gradle 8.3+ for test dry runs (wrapper: 8.9).
- bktec 3.5.0 and the Buildkite Tests plugin.
- One Test Engine suite per variant.

Java/Kotlin JVM projects can use the same script and collector without the Android
SDK or Android Gradle plugin.

## Set up your project

1. Apply the collector plugin in every module with JVM tests:

   ```kotlin
   plugins {
       id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
   }
   ```

2. Copy [`test-splitting.gradle`](./test-splitting.gradle) into the root project
   and apply it once from the root `build.gradle.kts`:

   ```kotlin
   apply(from = "test-splitting.gradle")
   ```

3. Use the Android group in [the pipeline](../.buildkite/pipeline.yml) as a template.
   Remove `bash ../.buildkite/android-collector-source` from both Docker commands.
   Set `suite-slug` and `parallelism`.
   Keep `upload-results: false` so only the collector uploads.

`splitTests` selects `testDebugUnitTest` in every module. To choose another task,
pass the same property to **both** Gradle commands:

| Tests | Property |
| --- | --- |
| Android debug (default) | `-PsplitTestTask=testDebugUnitTest` |
| A product flavor | `-PsplitTestTask=testDemoDebugUnitTest` |
| Java/Kotlin JVM | `-PsplitTestTask=test` |

Use a separate group and suite for each variant; class timings have no variant
name. In mixed builds, put JVM modules in a separate `test` group with a JDK image.
Modules without the chosen `Test` task are ignored, including Android's aggregate
`test` task.

## How it runs

Run discovery once from the project root, without an upload token:

```sh
env -u BUILDKITE_ANALYTICS_TOKEN ./gradlew --no-daemon --no-configuration-cache splitTests -PdiscoverTests
```

The script enables Gradle's `--test-dry-run` mode on the selected `Test` tasks.
It writes `build/test-selectors/all.txt` and each task's class list to
`<module>/build/test-selectors/<task-name>.txt`. Each shard downloads these files
from the same build's `android-discover` step. No test bodies run or XML is written.

bktec's custom runner fills in each job's classes:

```sh
./gradlew --no-daemon --no-configuration-cache --profile --continue splitTests -PtestClasses='{{testExamples}}'
```

Each module's `Test` task runs only the assigned classes it owns, using Gradle
test filtering equivalent to `--tests`. Existing includes still apply and
exclusions are kept. Tasks with no assigned classes skip. Empty or undiscovered
assignments fail instead of running all tests; bktec skips jobs with no assignment.
The transferred module lists must give every assigned class exactly one owning
task. Missing or conflicting ownership, or an assigned task that skips, fails
the shard instead of silently dropping its tests.
`--continue` lets other modules finish and upload after a failure, but Gradle
still exits nonzero.

The collector tags each method result with `test.selector.primary`, the class
name Test Engine uses to match timing history. Durations come from Gradle's
completed results, including overlapping forks. Test Engine adds them by class
and uses seven days of history. `SlowTest` takes 15 seconds to make timing-based
assignment visible.

## Limits

- **Whole classes or suites.** Nested classes, suite members and JUnit Platform parameterized/factory tests stay with their outer class/suite. Empty suites are omitted.
- **Unique binary class names.** Keep `$`, not display names. Duplicate names across modules fail discovery. Whitespace, apostrophes and `*` are unsupported; backtick method names are fine.
- **Skipped tasks add no classes.** Disabled, `onlyIf`-skipped and `NO-SOURCE` tasks are omitted. Tasks that run must write fresh class lists.
- **Timing history takes time.** New classes use default durations; history can take about an hour to appear.
- **No automatic retries or muting.** Configure Gradle's test-retry plugin or Buildkite job retries separately. Per-class XML is not merged into a bktec result file; failures keep Gradle's exit code.
- **Remove `soft_fail` for a normal CI gate.** This repository deliberately includes failing and flaky tests.
- **Each shard configures and compiles.** Test tasks bypass caching and up-to-date checks; compilation caching is unchanged. Keep `--no-configuration-cache` because discovery cannot be cached.
- **Measure before expecting a speedup.** Discovery, queues and file transfer add overhead; use the uploaded `--profile` reports.
- **Filtering can expose flaky or order-dependent tests.** Reproduce with native task-specific `--tests` filters and matching fork settings.
- **No instrumented tests.** This script supports JVM `Test` tasks only, not device or emulator tests.

## Credentials and Docker

- The Tests plugin mints a suite-scoped token on the host for bktec and the collector; discovery gets no credentials.
- `oidc-lifetime: 7200` lasts two hours, even after the one-hour job ends; accept that lifetime and adjust both limits together.
- Trust the image and build/test code with access to the suite; keep token minting and artifact downloads on the host.
- Keep Docker's explicit environment list: no whole-environment forwarding, `--env-file`, agent credentials or job-API socket mounts.
- Keep the suite token set in Docker; the container cannot mint a replacement.
- Docker is optional on a trusted JDK/SDK host: remove the wrappers and keep the Tests plugin, suite and token settings. Tests then have the host's normal CI permissions.

## Verification

Hosted checks cover [two shards](https://buildkite.com/buildkite/test-engine-client-examples/builds/1196),
[three shards and a job retry](https://buildkite.com/buildkite/test-engine-client-examples/builds/1198),
and [native Gradle uploads](https://buildkite.com/buildkite/test-engine-client-examples/builds/1199).
The shard results were compared with an unfiltered Gradle run and Test Engine.

A [Now in Android run](https://buildkite.com/buildkite/test-engine-client-examples/builds/1201)
covered all 143 tests with no missing or duplicate uploads, but three methods had
different outcomes from the native control. A [follow-up](https://buildkite.com/buildkite/test-engine-client-examples/builds/1207)
reproduced those failures with plain Gradle, including the class alone. Five
trials with matching native and bktec filters had the same observed pass counts;
this does not establish statistical equivalence or a root cause.

These runs used collector source, not the unpublished 0.4.1 release.
