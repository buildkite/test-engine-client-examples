# Split Kotlin and Java Gradle tests across Buildkite jobs

Gradle discovers test classes once, bktec splits them across parallel jobs using
Test Engine timing history, and the Buildkite collector uploads the results.

The Kotlin module uses the Kotlin DSL and the Java module uses the Groovy DSL, so
copy whichever matches your build. The collector is published as
`test-collector-android`, but its Gradle plugin works with any JVM project.

## Requirements

Gradle 8.3+ running on JDK 17+, bktec 3.5.0, collector 0.4.1 and a Test Engine suite.

## Set up your build

1. Apply the collector in each module with tests.

   Kotlin DSL (`build.gradle.kts`):

   ```kotlin
   plugins {
       id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
   }
   ```

   Groovy DSL (`build.gradle`):

   ```groovy
   plugins {
       id 'com.buildkite.test-collector-android.unit-test-collector-plugin' version '0.4.1'
   }
   ```

2. Copy [`test-splitting.gradle.kts`](./test-splitting.gradle.kts) to your root
   project and apply it from the root build file. Groovy builds can apply it too:

   ```kotlin
   apply(from = "test-splitting.gradle.kts") // build.gradle.kts
   ```

   ```groovy
   apply from: 'test-splitting.gradle.kts' // build.gradle
   ```

3. Add `splitTestTask=test` to the root `gradle.properties`.

## Set up your pipeline

Copy the Java / Kotlin group from [the pipeline](../.buildkite/pipeline.yml). One
step discovers the classes; a parallel step runs `bktec run`, which gives each job
its classes. Set `suite-slug` and `parallelism`, and keep:

- `upload-results: false`, because the collector uploads results.
- `oidc-lifetime: 7200`, because the collector uploads after Gradle finishes and
  the Tests plugin's token otherwise expires after five minutes.

Agents need JDK 17+; this pipeline installs it with mise.

## Try it locally

```sh
./gradlew splitTests -PdiscoverTests
./gradlew splitTests -PtestClasses='com.buildkite.examples.jvm.CartTest com.buildkite.examples.jvm.ShippingTest'
```

Discovery writes four classes to `build/test-selectors/all.txt`. The second command
runs only the two assigned classes. Without `BUILDKITE_ANALYTICS_TOKEN`, nothing uploads.

## Limits

- Splits whole classes. Nested and parameterized tests stay with their outer class.
- Class names must be unique across modules.
- New classes have no timing history for about an hour, so bktec assumes one second each.
- No bktec retries or muting.
- Every job compiles the build, and test tasks always run. Keep `--no-configuration-cache`.
