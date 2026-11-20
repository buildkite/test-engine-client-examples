plugins {
    java
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
}

buildkiteTestAnalytics {
    tags["test.framework.name"] = "junit"
    tags["language.name"] = "java"
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:5.11.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
}
