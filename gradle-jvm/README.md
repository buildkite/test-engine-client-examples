# Split Kotlin and Java Gradle tests across Buildkite jobs

Discover Kotlin and Java test classes with Gradle once, then split them across parallel jobs with bktec's custom runner. The Android test collector's Gradle plugin, which works with any JVM project, sends results to Test Engine.

## Pipeline

Copy the `Discover Kotlin / Java tests` and `Kotlin / Java` steps from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt them](../README.md#adapt-a-step). Discovery dry-runs every module's `test` task and saves the class lists as artifacts. Each job downloads them and runs only its classes.

- Keep the `unset BUILDKITE_ANALYTICS_TOKEN` line in discovery. With a token, the collector uploads every discovered test as skipped.
- Keep `--no-configuration-cache`. The split script doesn't support Gradle's configuration cache.
- Keep `--no-daemon` if Gradle runs directly on your agents, so jobs don't leave Gradle running.

## Test collector

Use JDK 17 or later and Gradle 8.3 or later, with JUnit 4, JUnit Jupiter, or Kotest tests. The Kotlin module uses the Kotlin DSL and the Java module uses the Groovy DSL, so copy whichever matches your build.

1. Declare collector plugin 0.4.1 once in the root build file:

   ```kotlin
   // build.gradle.kts
   plugins {
       id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1" apply false
   }
   ```

   ```groovy
   // build.gradle
   plugins {
       id 'com.buildkite.test-collector-android.unit-test-collector-plugin' version '0.4.1' apply false
   }
   ```

   Then apply it without a version in each module with tests, as in [kotlin/build.gradle.kts](./kotlin/build.gradle.kts) and [java/build.gradle](./java/build.gradle). If your modules get their plugins from convention plugins in `buildSrc` or `build-logic`, add `implementation("com.buildkite.test-collector-android:unit-test-collector-plugin:0.4.1")` to that build instead, and apply the plugin ID in your convention plugin.
1. Copy [test-splitting.gradle.kts](./test-splitting.gradle.kts) to your project root and apply it from the root build file, with `apply(from = "test-splitting.gradle.kts")` or `apply from: 'test-splitting.gradle.kts'`.
1. Add `splitTestTask=test` to the root `gradle.properties`, as in [gradle.properties](./gradle.properties).

See [Android](https://buildkite.com/docs/pipelines/configure/tests/test-collection/android-collectors#android).

## Limits

- Only Gradle `Test` tasks. To split another task, such as `integrationTest`, add a separate step that passes `-PsplitTestTask=integrationTest` to both Gradle commands.
- Splits whole outer classes, including nested and parameterized tests.
- Tests missing from `build/test-selectors/all.txt` never run in split jobs. Check it lists every test class.
- Class names must be unique across modules.
- New classes use default timings until history appears, which can take about an hour.
- bktec doesn't read results from this step, so it can't retry or mute tests. Gradle failures fail the job.
- Every job configures and compiles, and split test tasks never come from the build cache.

## Run locally

Use JDK 17 from `mise.toml` in this directory. Replace the class names with ones from discovery:

```bash
./gradlew --no-configuration-cache splitTests -PdiscoverTests
./gradlew --no-configuration-cache --continue splitTests -PtestClasses="com.buildkite.examples.jvm.CartTest com.buildkite.examples.jvm.ShippingTest"
```

Without `BUILDKITE_ANALYTICS_TOKEN`, nothing uploads.
