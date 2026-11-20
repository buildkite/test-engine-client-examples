plugins {
    id("org.jetbrains.kotlin.jvm")
    id("com.buildkite.test-collector-android.unit-test-collector-plugin")
}

dependencies {
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
