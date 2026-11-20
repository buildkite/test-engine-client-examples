# Split Android JVM unit tests across Buildkite jobs

Discover Android JVM test classes with Gradle once, then split them across parallel jobs with bktec's custom runner. The Android test collector sends results to Test Engine.

## Pipeline

Copy the `Discover JVM tests` and `Android` steps from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt them](../README.md#adapt-a-step). Discovery dry-runs `testDebugUnitTest` in every module and saves the class lists as artifacts. Each job downloads them and runs only its classes in the Android SDK container, which receives the token and build details through the `--env` flags.

## Test collector

Use JDK 17 or later, Android SDK 34, and Gradle 8.3 or later. Copy [test-splitting.gradle.kts](./test-splitting.gradle.kts) to your project root and add `apply(from = "test-splitting.gradle.kts")` to the root `build.gradle.kts`. Apply collector plugin 0.4.1 in each module with JVM tests, as in [app/build.gradle.kts](./app/build.gradle.kts). See [Android](https://buildkite.com/docs/pipelines/configure/tests/test-collection/android-collectors#android).

To split another variant, pass the same `-PsplitTestTask`, such as `-PsplitTestTask=testDemoDebugUnitTest`, to both Gradle commands. For Kotlin or Java projects without Android, see the [Kotlin and Java example](../gradle-jvm/README.md).

## Limits

- Only JVM `Test` tasks, not instrumented tests. Use a separate step and test suite for each variant.
- Splits whole outer classes or suites, including nested, parameterized, and factory tests.
- Binary class names must be unique across modules, with no whitespace, apostrophes, or `*`.
- Disabled, skipped, and empty tasks add no classes. Missing owners and skipped assigned tasks fail the job.
- New classes use default timings until history appears, which can take about an hour.
- bktec doesn't read results from this step, so it can't retry or mute tests. Gradle failures fail the job.
- Every job configures and compiles. Keep `--no-configuration-cache`; test tasks always rerun.
- Discovery and Docker add overhead. Measure before expecting a speedup, and watch for order-dependent tests.

## Run locally

Use JDK 17 and Android SDK 34 in this directory. Replace the class name with one from discovery:

```bash
./gradlew --no-configuration-cache splitTests -PdiscoverTests
./gradlew --no-configuration-cache --continue splitTests -PtestClasses="com.buildkite.examples.PassingTest"
```
