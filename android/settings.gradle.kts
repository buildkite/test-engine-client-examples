pluginManagement {
    // Verification branch only: exercise the companion collector before release.
    System.getenv("ANDROID_COLLECTOR_SOURCE")?.let { includeBuild(it) }
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    @Suppress("UnstableApiUsage")
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "buildkite-test-engine-android-example"

include(":app", ":library")
