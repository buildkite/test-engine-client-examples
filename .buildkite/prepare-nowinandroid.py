#!/usr/bin/env python3
"""Verification branch only: apply the README to an unchanged public project."""
from pathlib import Path
import shutil
import subprocess

subprocess.run(['git', 'clone', 'https://github.com/android/nowinandroid.git', '.nowinandroid'], check=True)
subprocess.run(['git', '-C', '.nowinandroid', 'checkout', '815b347e39c9081f33c7acd892d1b5e41e1c9344'], check=True)
root = Path('.nowinandroid')
settings = root/'settings.gradle.kts'
settings.write_text(settings.read_text().replace('pluginManagement {', '''pluginManagement {
    includeBuild(System.getenv("ANDROID_COLLECTOR_SOURCE"))''', 1))
build = root/'build.gradle.kts'
build.write_text(build.read_text().replace('plugins {', '''plugins {
    id("com.buildkite.test-collector-android.unit-test-collector-plugin") version "0.4.1" apply false''', 1) + '''
// README setup: collector in each module and splitting script applied once.
subprojects { apply(plugin = "com.buildkite.test-collector-android.unit-test-collector-plugin") }
apply(from = "test-splitting.gradle")
// Proof only: list exactly the native Test tasks selected by this group.
tasks.register("proofNativeTaskPaths") {
    doLast {
        allprojects.forEach { p ->
            p.tasks.withType<org.gradle.api.tasks.testing.Test>().filter {
                it.name == providers.gradleProperty("splitTestTask").get()
            }.forEach { println("NATIVE_TASK=" + it.path) }
        }
    }
}
''')
shutil.copyfile('android/test-splitting.gradle', root/'test-splitting.gradle')
print('Only collector setup, discovery script, and task inventory added; test sources unchanged.')
subprocess.run(['git', '-C', str(root), 'diff', '--stat'], check=True)
