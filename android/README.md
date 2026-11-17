# Android / Gradle JVM test splitting

bktec has no built-in Gradle runner. Use its **custom** runner to split JVM unit
tests, with Gradle discovering and selecting the tests and the Android collector
uploading their results.

Requires JDK 17+, the Android SDK 34, Gradle 8.3+ (`--test-dry-run`), bktec 3.5.0,
and an Android collector release containing class selector tags. **Collector
0.4.0 does not supply timing history for these selectors.** The companion
collector change must be released before this example can be copied as a
timing-aware setup; the intended next version is 0.4.1, pending release approval.

## Copying the example

1. Apply the Android unit-test collector Gradle plugin to the project containing
   your JVM tests. Despite its name, it works with Gradle's JVM `Test` tasks; an
   ordinary Java/Kotlin JVM project does not need the Android SDK or plugin.
2. Copy [`test-splitting.gradle`](./test-splitting.gradle) and apply it from that
   project's build file, adjusting the relative path:

   ```kotlin
   apply(from = "../test-splitting.gradle")
   ```

3. Copy the Android step from [the pipeline](../.buildkite/pipeline.yml), change
   the suite slug and replace `:app:testDebugUnitTest` with your `Test` task
   (`test` for a single-project JVM build). Update `BUILDKITE_TEST_ENGINE_SELECTOR_FILE`
   to that task's `build/test-selectors/<task-name>.txt`. For JVM-only projects,
   use a JDK Docker image instead of the Android SDK image.

Each job first runs Gradle's discovery without an analytics token:

```sh
env -u BUILDKITE_ANALYTICS_TOKEN ./gradlew --no-daemon :app:testDebugUnitTest --test-dry-run --rerun -PdiscoverTests
```

The shared Gradle script records the outermost class-bearing descriptor for each
runnable subtree, not source file names or a maintained list. Container callbacks
include Jupiter classes with only parameterized tests or test factories, without
executing their methods during discovery. Nested classes and JUnit 4 suite members
stay with their outermost runnable class or suite. Binary names keep their literal
`$` spelling. bktec requests a balanced plan and substitutes its job's assigned
classes into:

```sh
./gradlew --no-daemon --profile :app:testDebugUnitTest --rerun -PtestClasses='{{testExamples}}'
```

`testClasses` applies Gradle's `--tests` filters, intersecting the project's
existing includes and retaining its exclusions rather than adding OR-ed includes.
`--rerun` forces the Test task to execute even after
discovery or a cache hit, without recompiling up-to-date dependencies. Empty
assignments and filters matching no tests fail rather than running everything.
bktec itself runs nothing for a job with no assigned tests.

The collector tags **every method** with `test.selector.primary=<runnable class or suite>`
using that same outermost descriptor. Gradle's completed result supplies each
method's timing, including when multiple Gradle forks overlap.
Test Engine sums those method durations per selector per run and uses recent
history (seven days) for later plans. A first run without history uses defaults.
Test Engine may keep using default durations for new selectors for up to about an hour after their first run, so the build right after the first one may not be balanced yet.

Splitting stays at runnable-subtree granularity: nested and suite-member tests stay together. `SlowTest` deliberately
takes 15 seconds so a warm plan can put it alone opposite the four fast classes.

## Boundaries

- **Method-level splitting is not enabled.** Outermost runnable classes/suites
  are the assignment units across JUnit 4, JUnit Platform, parameterized tests,
  factories, and custom display names; individual nested/member classes are not
  independently assigned because Gradle's class filters select whole subtrees.
  Method selectors require framework-aware handling of descriptor names and
  matching collector tags; changing only the discovery list would silently
  discard timing history. A single slow method is indivisible anyway. Break up
  large classes to allow finer balancing, or add method discovery and matching
  tags together for a known framework before using method-level splitting.
- **Retries:** the bktec custom runner does not retry automatically. Add and
  configure Gradle's `org.gradle.test-retry` plugin if retries are needed.
- **Muting:** results and failure details reach Test Engine, but this example
  does not apply Test Engine muting to the exit code. Gradle emits one JUnit XML
  per class while the custom runner reads one result file; no merged report is
  configured. Failures retain Gradle's exit code. The pipeline soft-fails exit 1
  only because this repository intentionally includes failing and flaky tests.
  Remove that setting for a normal CI gate.
- **Build cost:** every shard configures Gradle and compiles before discovery.
  The subsequent filtered invocation reuses its local compilation outputs.
  Splitting does not divide compilation work; for short suites that overhead can
  outweigh test savings. The example uploads Gradle `--profile` reports so you
  can measure configuration, compilation, and test-task execution separately.
  A shared Gradle remote build cache can reuse compilation across isolated
  agents, but requires a cache endpoint and credentials; this example does not
  assume one. Keep the Test task forced with `--rerun` even when adding a cache.
- **Instrumented tests:** not built here. Provision an emulator/device, use
  `connectedDebugAndroidTest`, discover instrumentation tests, and pass assigned
  class names with `-Pandroid.testInstrumentationRunnerArguments.class=ClassA,ClassB`.
  Use the instrumented collector and forward CI/token arguments to the device.
  Its listener also needs runnable-selector tags for timing-aware plans; this
  companion change does not add instrumentation splitting. Gradle's
  `--test-dry-run` applies to JVM `Test` tasks, not instrumentation tasks.
