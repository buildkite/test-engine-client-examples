plugins {
    id("com.android.application") version "8.7.3" apply false
    id("com.android.library") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}

// One entry point discovers and assigns JVM unit tests across all modules.
apply(from = "test-splitting.gradle")
