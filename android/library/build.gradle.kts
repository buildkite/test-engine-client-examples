plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1"
}

android {
    namespace = "com.buildkite.examples.library"
    compileSdk = 34
    defaultConfig { minSdk = 23 }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

buildkiteTestAnalytics {
    tags["test.framework.name"] = "junit"
    tags["language.name"] = "kotlin"
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
