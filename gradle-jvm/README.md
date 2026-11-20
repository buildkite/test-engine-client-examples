# Split Kotlin and Java Gradle tests across Buildkite jobs

Gradle discovers test classes once, bktec splits them across parallel jobs using
Test Engine timing history, and the Buildkite collector uploads the results.

The Kotlin module uses the Kotlin DSL and the Java module uses the Groovy DSL, so
copy whichever matches your build. The collector is published as
`test-collector-android`, but its Gradle plugin works with any JVM project.

## Requirements

Gradle 8.3+ running on JDK 17+, bktec 3.5.0, collector 0.4.1 and a Test Engine
suite. Tests must be JUnit 4, JUnit Jupiter or Kotest classes.

## Set up your build

1. Declare the collector's version once in the root build file, then apply it in
   each module with tests.

   Kotlin DSL:

   ```kotlin
   // Root build.gradle.kts
   plugins {
       id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1" apply false
   }

   // Each module's build.gradle.kts
   plugins {
       id("com.buildkite.test-collector-android.unit-test-collector-plugin")
   }
   ```

   Groovy DSL:

   ```groovy
   // Root build.gradle
   plugins {
       id 'com.buildkite.test-collector-android.unit-test-collector-plugin' version '0.4.1' apply false
   }

   // Each module's build.gradle
   plugins {
       id 'com.buildkite.test-collector-android.unit-test-collector-plugin'
   }
   ```

   If your modules get their plugins from convention plugins in `buildSrc` or
   `build-logic`, add
   `implementation("com.buildkite.test-collector-android:unit-test-collector-plugin:0.4.1")`
   to that build's dependencies and apply the plugin ID in your convention plugin instead.

2. Copy [`test-splitting.gradle.kts`](./test-splitting.gradle.kts) to your root
   project and apply it from the root build file. Groovy builds can apply it too:

   ```kotlin
   apply(from = "test-splitting.gradle.kts") // build.gradle.kts
   ```

   ```groovy
   apply from: 'test-splitting.gradle.kts' // build.gradle
   ```

3. Add `splitTestTask=test` to the root `gradle.properties`. To split another test
   task, such as `integrationTest`, add a separate pipeline group that passes
   `-PsplitTestTask=integrationTest` to both Gradle commands.

## Set up your pipeline

Copy the Kotlin / Java group from [the pipeline](../.buildkite/pipeline.yml). One
step discovers the classes; a parallel step runs `bktec run`, which gives each job
its classes. Replace the `gradle-jvm` paths with your project's, replace
`*bktec_version` with a version such as `"3.5.0"`, set `suite-slug` and
`parallelism`, and keep:

- `unset BUILDKITE_ANALYTICS_TOKEN` before discovery. Otherwise the collector
  uploads every discovered test as skipped. Discovery then logs
  `Missing or invalid 'BUILDKITE_ANALYTICS_TOKEN'`, which is expected.
- `upload-results: false`, because the collector uploads results.
- `oidc-lifetime: 7200`. The collector uploads as each test task finishes, which
  can be more than five minutes after the Tests plugin issues its token.
- `--no-configuration-cache`, because the split script doesn't support Gradle's
  configuration cache.

Agents need JDK 17+; this pipeline installs it with mise.

## Try it locally

```sh
./gradlew --no-configuration-cache splitTests -PdiscoverTests
./gradlew --no-configuration-cache splitTests -PtestClasses='com.buildkite.examples.jvm.CartTest com.buildkite.examples.jvm.ShippingTest'
```

Discovery writes four classes to `build/test-selectors/all.txt`. The second command
runs only the two assigned classes. Without `BUILDKITE_ANALYTICS_TOKEN`, nothing uploads.

## Limits

- Splits whole classes. Nested and parameterized tests stay with their outer class.
- Tests that aren't in `all.txt` never run in split jobs. Check it lists every test class.
- Class names must be unique across modules.
- New classes use default durations until their timing history appears, which can
  take about an hour.
- No bktec retries or muting.
- Every job compiles the build, and split test tasks are never up to date or
  loaded from the build cache.
