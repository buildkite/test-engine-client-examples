# Split Android JVM unit tests across Buildkite jobs

Gradle discovers JVM test classes once; bktec splits them across jobs. Copy [test-splitting.gradle.kts](./test-splitting.gradle.kts), apply it from the root build file, and configure the Android test collector in each test module as shown in [app/build.gradle.kts](./app/build.gradle.kts).

Use `Discover JVM tests` and `Android` in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the Android test collector uploads results from the test container.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust artifact and selector paths, and remove `cd android` for tests at the repository root. Keep Docker's token forwarding and `--no-configuration-cache`. For another variant, set `-PsplitTestTask` on both discovery and execution commands.

This splits whole classes, not instrumented device tests. Class names must be unique across modules. This custom runner does not configure bktec retries or muting.

Run locally in this directory with JDK 17 and Android SDK 34:

```sh
./gradlew --no-configuration-cache splitTests -PdiscoverTests
./gradlew --no-configuration-cache --continue splitTests -PtestClasses="com.buildkite.examples.PassingTest"
```
