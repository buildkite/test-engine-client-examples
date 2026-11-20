plugins {
    id("org.jetbrains.kotlin.jvm")
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
}

dependencies {
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
