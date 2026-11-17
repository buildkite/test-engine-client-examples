# Android / Gradle JVM test splitting

bktec has no built-in Gradle runner. Use its **custom** runner to split JVM unit
tests, with Gradle discovering and selecting the tests and the Android collector
uploading their results.

Requires JDK 17+, the Android SDK 34, Gradle 8.3+ (`--test-dry-run`), bktec 3.5.0,
and an Android collector release containing
[runnable selector tags and per-test timings](https://github.com/buildkite/bktest/pull/126)
and [complete uploads beyond 5,000 results](https://github.com/buildkite/bktest/pull/127).
**Collector 0.4.0 does not supply timing history for these selectors.** Those
companion changes must be released before this example can be copied as a
timing-aware setup; the intended next version is 0.4.1, pending release approval.

## Copying the example

1. Apply the Android unit-test collector Gradle plugin to each module containing
   your JVM tests. Despite its name, it works with Gradle's JVM `Test` tasks; an
   ordinary Java/Kotlin JVM project does not need the Android SDK or plugin.
2. Copy [`test-splitting.gradle`](./test-splitting.gradle) to the root project and
   apply it once from the root build file:

   ```kotlin
   apply(from = "test-splitting.gradle")
   ```

3. Copy the Android group from [the pipeline](../.buildkite/pipeline.yml) and change
   the suite slug. `splitTests` selects `testDebugUnitTest` in every module; use
   `-PsplitTestTask=test` on both invocations for JVM-only builds, or select your
   desired variant's task name. Modules without that task are ignored. Use a JDK
   Docker image instead of the Android SDK image for JVM-only projects.

The discovery job runs Gradle once without an analytics token:

```sh
env -u BUILDKITE_ANALYTICS_TOKEN ./gradlew --no-daemon splitTests -PdiscoverTests
```

The root task runs each selected `Test` task in Gradle dry-run mode, merges the
selectors into `build/test-selectors/all.txt`, and retains each task's discovered
classes in `<module>/build/test-selectors/<task-name>.txt` for ownership routing.
The pipeline uploads those manifests once. Each shard downloads them from this
build's `android-discover` step before running Gradle, so it configures only once.

The script records the outermost class-bearing descriptor for each runnable
subtree, not source file names or a maintained list. Atomic test callbacks omit
empty JUnit 4 suites and non-executing `Enclosed` placeholders. For Platform,
method-container callbacks also discover parameterized-only and factory-only
classes without executing their methods. Nested classes and suite members stay
with their outermost runnable class or suite. Binary names keep their literal
`$` spelling. bktec substitutes its job's assigned classes into:

```sh
./gradlew --no-daemon --profile --continue splitTests -PtestClasses='{{testExamples}}'
```

Each task receives only its owned assignments, using Gradle's `--tests` filters
to intersect existing includes and retain exclusions. Tasks owning no assigned
classes skip instead of failing with "No tests found". `--continue` lets other
modules finish and upload even if one module's tests fail; Gradle still exits
nonzero. The script forces the selected Test tasks to execute after discovery or
a cache hit, without recompiling up-to-date dependencies. Empty and undiscovered
assignments fail rather than running everything. bktec itself runs nothing for
a job with no assigned tests. `app` and `library` demonstrate two owning modules.

The collector tags **every method** with `test.selector.primary=<runnable class or suite>`
using that same outermost descriptor. Gradle's completed result supplies each
method's timing, including when multiple Gradle forks overlap.
Test Engine sums those method durations per selector per run and uses recent
history (seven days) for later plans. A first run without history uses defaults.
Test Engine may keep using default durations for new selectors for up to about an hour after their first run, so the build right after the first one may not be balanced yet.

Splitting stays at runnable-subtree granularity: nested and suite-member tests stay together. `SlowTest` deliberately
takes 15 seconds so a warm plan can put it alone opposite the fast classes in
both modules; the library task then skips on SlowTest's shard.

## Boundaries

- **Class names must be unique across selected modules.** Discovery rejects a
  duplicate fully qualified selector and names both owning tasks. The collector
  uses raw class/suite names, not module-qualified timing keys; silently merging
  duplicates would make ownership and history ambiguous. Rename/package them
  uniquely or split modules in separate Buildkite steps/suites.
- **Class names cannot contain whitespace.** Discovery fails with the offending
  name before bktec plans anything. Kotlin backtick class names with spaces cannot
  survive bktec's space-joined selector transport. Backtick method names are fine;
  the collector's raw timing key is unchanged.
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
- **Build cost:** discovery configures and compiles once in its own job; every
  shard still configures and compiles its own dependencies. Transferring selectors
  does not transfer compilation outputs. Splitting does not divide compilation
  work; for short suites that overhead can outweigh test savings. The pipeline
  uploads Gradle `--profile` reports for discovery and each execution job.
  A shared Gradle remote build cache can reuse compilation across isolated
  agents, but requires a cache endpoint and credentials; this example does not
  assume one. The script disables Test-task caching/up-to-date reuse, including
  with a shared cache; it does not disable compilation caching.
- **Instrumented tests:** not built here. Provision an emulator/device, use
  `connectedDebugAndroidTest`, discover instrumentation tests, and pass assigned
  class names with `-Pandroid.testInstrumentationRunnerArguments.class=ClassA,ClassB`.
  Use the instrumented collector and forward CI/token arguments to the device.
  Its listener also needs runnable-selector tags for timing-aware plans; this
  companion change does not add instrumentation splitting. Gradle's
  `--test-dry-run` applies to JVM `Test` tasks, not instrumentation tasks.

## Discovery overhead and large builds

Use the separate discovery step in the pipeline for large multi-module builds,
rather than adding discovery to every parallel job. In source-built collector
[build #1170](https://buildkite.com/buildkite/test-engine-client-examples/builds/1170),
per-shard discovery added **83.940 / 85.280 seconds**, including **66.380 / 68.310
seconds configuring projects**, before the assigned invocations took another
25.023 / 10.911 seconds (configuration 6.818 / 7.077 seconds). These are single-run
observations of this small Android example with included collector source, not
published-plugin benchmarks or estimates for a customer's build.

The separate step removes that extra Gradle invocation from each worker and pays
discovery once before the shards. It does not remove the initial discovery from
the critical path, or guarantee a faster total build: clean workers still compile,
and artifact transfer/queueing also cost time. Measure your own task graph and
configure a shared compilation cache if appropriate.

With that separate step, source-built
[build #1177](https://buildkite.com/buildkite/test-engine-client-examples/builds/1177)
paid 96.150 seconds for discovery (76.750 configuring), then 98.590 / 86.940
seconds for the assigned invocations (67.270 / 70.620 configuring). Each worker
configured only once, but clean workers paid the included collector's source-build
cost again. These measurements demonstrate fewer discovery invocations, not a
wall-clock speedup or the cost of the future published collector.

Do not enable configuration cache as a substitute for the discovery step here.
With Gradle 8.9, the current discovery task cannot store its task-collection closure
in the configuration cache; changing from discovery to assignments also invalidates
the entry because the Gradle properties change. An assignment-only invocation
can store an entry, but that does not make discovery and execution share one
configuration. Configuration-cache support is not claimed for this example.

A local deterministic JVM stress fixture (not included in this example) used
16 modules, 320 classes, 640 test methods and 3,986 registered tasks, of which
3,520 were inert tasks to exercise a larger task registry. Discovery took
15.009 seconds wall / 1.083 seconds configuration; three assigned invocations
took 12.293 / 10.444 / 11.103 seconds wall, with 1.558 / 0.960 / 1.100 seconds
configuration. Their exact (class, method, result) multiset matched the native
control's 640 methods. Repeating an identical assignment with configuration cache
reduced wall time from 8.951 to 7.254 seconds and configuration from 0.971 to 0,
but switching to discovery failed to store the cache. These are single-run local
measurements, without uploads or an Android plugin; a large real Android build's
configuration/dependency costs remain unproven. Profile that build before
choosing parallelism or claiming a speedup.
