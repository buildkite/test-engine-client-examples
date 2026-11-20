# Split Android JVM unit tests across Buildkite jobs

Discover Android JVM test classes with Gradle, then split them across parallel jobs with bktec. The Android test collector sends results to Test Engine.

## Pipeline

```yaml
steps:
  - label: ":android: Discover JVM tests"
    key: android-discover
    command: ./gradlew --no-configuration-cache splitTests -PdiscoverTests
    artifact_paths: "**/build/test-selectors/*.txt"
    plugins:
      - docker#v5.14.0:
          image: ghcr.io/cirruslabs/android-sdk:34
          user: "0:0"
  - label: ":android: Android"
    depends_on: android-discover
    parallelism: 2
    commands:
      - buildkite-agent artifact download "*/test-selectors/*.txt" . --step android-discover
      - bktec run
    env:
      BUILDKITE_TEST_ENGINE_SELECTOR_FILE: build/test-selectors/all.txt
    plugins:
      - tests#v1.1.0:
          test-runner: custom
          test-cmd: >-
            sh -c 'docker run --rm --user 0:0 --volume "$$PWD:/workdir" --workdir /workdir
            --env BUILDKITE_ANALYTICS_TOKEN --env BUILDKITE_BUILD_ID --env BUILDKITE_JOB_ID
            --env BUILDKITE_BUILD_NUMBER --env BUILDKITE_BUILD_URL --env BUILDKITE_BRANCH --env BUILDKITE_COMMIT
            ghcr.io/cirruslabs/android-sdk:34
            ./gradlew --no-configuration-cache --continue splitTests -PtestClasses="$$1"' sh '{{testExamples}}'
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector uploads from the test container, so keep the token forwarding and `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite. Our `Discover JVM tests` and `Android` steps are in [pipeline.yml](../.buildkite/pipeline.yml); this snippet assumes your Gradle project is at the repository root.

## Test collector

Apply [test-splitting.gradle.kts](./test-splitting.gradle.kts) from your root build file and configure the test collector in each test module as in [app/build.gradle.kts](./app/build.gradle.kts). Keep `--no-configuration-cache`; to split another variant, set the same `-PsplitTestTask` on both Gradle commands. Class names must be unique across modules. This custom runner splits classes, not device tests, and does not configure bktec retries or muting.

## Run locally

Use JDK 17 and Android SDK 34 in this directory. Replace the class name with one from discovery:

```bash
./gradlew --no-configuration-cache splitTests -PdiscoverTests
./gradlew --no-configuration-cache --continue splitTests -PtestClasses="com.buildkite.examples.PassingTest"
```
