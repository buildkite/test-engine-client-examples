# Split Java and Kotlin Gradle tests across Buildkite jobs

Gradle discovers test classes once. bktec splits them across two jobs using
Test Engine timing history, and collector 0.4.1 uploads the results. The
collector is published as the Android collector, but its Gradle plugin works
with any JVM project's `Test` tasks.

## Requirements

JDK 17+, Gradle 8.3+ (wrapper: 8.9), bktec 3.5.0 and a Test Engine suite. The
pipeline installs the JDK with mise using [`mise.toml`](./mise.toml).

## Run locally without credentials

```sh
cd gradle-jvm
./gradlew splitTests -PdiscoverTests
cat build/test-selectors/all.txt
./gradlew splitTests -PtestClasses='com.buildkite.examples.jvm.CartTest com.buildkite.examples.jvm.ShippingTest'
```

Discovery lists four classes. The second command runs only `CartTest` (including
its nested class) and `ShippingTest`. Without `BUILDKITE_ANALYTICS_TOKEN`, the
collector logs that it won't upload.

## Setup

Apply the collector in each module with tests:

```kotlin
plugins {
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
}
```

Copy [test-splitting.gradle.kts](./test-splitting.gradle.kts) to your project root
and add `apply(from = "test-splitting.gradle.kts")` to the root `build.gradle.kts`.
It is the same script as the [Android example](../android/README.md), which splits
`testDebugUnitTest` by default, so add `splitTestTask=test` to the root
`gradle.properties`.

Copy the Java / Kotlin group from [the pipeline](../.buildkite/pipeline.yml), set
`suite-slug` and `parallelism`, and keep `upload-results: false` to avoid duplicate
uploads. Agents need a JDK; this pipeline installs one with the mise plugin.

## Limits

- Splits whole outer classes, including nested and parameterized tests.
- Class names must be unique across modules, with no whitespace, apostrophes or `*`.
- New classes use default durations; timing history can take about an hour to appear.
- No bktec retries or muting. Gradle failures stay nonzero and fail the pipeline step.
- Each job configures and compiles. Keep `--no-configuration-cache`; test tasks always rerun.
