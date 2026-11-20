dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}

rootProject.name = "buildkite-test-engine-gradle-jvm-example"

include(":java", ":kotlin")
