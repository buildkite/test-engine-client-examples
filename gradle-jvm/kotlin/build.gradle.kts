plugins {
    id("org.jetbrains.kotlin.jvm")
    id("com.buildkite.test-collector-android.unit-test-collector-plugin")
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:6.1.3"))
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
