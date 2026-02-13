plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.3.0"
}

android {
    compileSdk = 34
    namespace = "com.buildkite.examples"

    defaultConfig {
        applicationId = "com.buildkite.examples"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
