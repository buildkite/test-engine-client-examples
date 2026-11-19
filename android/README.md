# Split Android JVM unit tests across Buildkite jobs

Gradle discovers test classes once. bktest splits them across two jobs using
Test Engine timing history, and collector 0.4.1 uploads the results.

## Requirements

JDK 17+, Android SDK 34, Gradle 8.3+ (wrapper: 8.9), bktest 3.6.0-rc.3 and a Test Engine
suite. The pipeline's Docker image supplies the JDK and SDK.

## Setup

Apply the collector in each module with JVM tests:

```kotlin
plugins {
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
}
```

Copy [test-splitting.gradle.kts](./test-splitting.gradle.kts) to your project root
and add `apply(from = "test-splitting.gradle.kts")` to the root `build.gradle.kts`.
Copy the Android group from [the pipeline](../.buildkite/pipeline.yml), set
`suite-slug` and `parallelism`, and keep `upload-results: false` to avoid duplicate uploads.

Discovery dry-runs `testDebugUnitTest` in every module; shards download its class
lists and run only their assignments. For another variant, pass
`-PsplitTestTask=testDemoDebugUnitTest` to both Gradle commands. For Java/Kotlin JVM
projects, use `-PsplitTestTask=test` and a JDK image without the Android SDK.

## Limits

- JVM `Test` tasks only, not instrumented tests. Use a separate group and suite per variant.
- Splits whole outer classes or suites, including nested, parameterized and factory tests.
- Binary class names must be unique across modules, with no whitespace, apostrophes or `*`.
- Disabled, skipped and empty tasks add no classes. Missing owners and skipped assigned tasks fail.
- New classes use default durations; timing history can take about an hour to appear.
- No bktest retries or muting. Gradle failures stay nonzero; remove this example's `soft_fail` for a CI gate.
- Each job configures and compiles. Keep `--no-configuration-cache`; test tasks always rerun.
- Discovery and Docker add overhead. Measure before expecting a speedup; filtering can expose order-dependent tests.

## Credentials and Docker

The Tests plugin mints a five-minute suite token on the host; set `oidc-lifetime`
for longer jobs. Only that token and build metadata enter Gradle's container;
discovery gets no credentials, and neither container gets agent credentials or sockets.
