plugins {
    id("org.jetbrains.kotlin.jvm") version "2.4.21" apply false
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1" apply false
}

apply(from = "test-splitting.gradle.kts")
