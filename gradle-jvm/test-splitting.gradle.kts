import org.gradle.api.tasks.testing.Test
import org.gradle.api.tasks.testing.TestDescriptor
import org.gradle.api.tasks.testing.TestListener
import org.gradle.api.tasks.testing.TestResult
import org.gradle.api.tasks.testing.junitplatform.JUnitPlatformOptions

val testTaskName = providers.gradleProperty("splitTestTask").getOrElse("testDebugUnitTest")
val discovering = providers.gradleProperty("discoverTests").isPresent
val assignments = if (discovering) null else providers.gradleProperty("testClasses").orNull
    ?.split(Regex("\\s+"))?.filter(String::isNotEmpty)
val selectedTasks = allprojects.map { project ->
    project.tasks.withType<Test>().matching { it.name == testTaskName }
}
val combinedSelectors = layout.buildDirectory.file("test-selectors/all.txt")

fun Test.selectorFile() = project.layout.buildDirectory.file("test-selectors/$name.txt").get().asFile

check(assignments == null || assignments.isNotEmpty()) { "testClasses must contain at least one class" }

tasks.register("splitTests") {
    dependsOn(selectedTasks)
    doLast {
        val owners = sortedMapOf<String, Test>()
        selectedTasks.flatMap { it.toList() }.forEach { task ->
            val manifest = task.selectorFile()
            if (discovering && task.state.skipped) {
                manifest.delete()
            } else if (manifest.isFile) {
                manifest.readLines().filter(String::isNotEmpty).forEach { selector ->
                    val previous = owners.put(selector, task)
                    check(previous == null) { "Duplicate selector '$selector' in ${previous?.path} and ${task.path}" }
                }
            } else if (discovering) {
                error("Discovery task ${task.path} did not write its selector manifest")
            }
        }
        if (discovering) {
            combinedSelectors.get().asFile.apply {
                parentFile.mkdirs()
                writeText(owners.keys.joinToString("\n", postfix = "\n"))
            }
        } else {
            assignments.orEmpty().forEach { selector ->
                val owner = owners[selector]
                check(owner != null) { "No owning Test task for '$selector'; check selector manifests and splitTestTask" }
                check(!owner.state.skipped) { "Assigned test task ${owner.path} was skipped: $selector" }
            }
        }
    }
}

allprojects {
    tasks.withType<Test>().matching { it.name == testTaskName }.configureEach {
        val manifest = selectorFile()
        if (discovering || assignments != null) {
            doNotTrackState("Discovery and shard assignments must execute")
        }
        if (discovering) {
            dryRun.set(true)
            reports.junitXml.required.set(false)
            reports.html.required.set(false)
            doFirst {
                manifest.parentFile.mkdirs()
                manifest.delete()
            }
            addTestListener(object : TestListener {
                private val classes = sortedSetOf<String>()

                private fun discover(descriptor: TestDescriptor) {
                    val selector = generateSequence(descriptor) { it.parent }
                        .mapNotNull { it.className }.lastOrNull() ?: return
                    check(!selector.contains(Regex("[\\s'*]"))) {
                        "Cannot split '$selector': class names must not contain whitespace, apostrophes or '*'"
                    }
                    classes.add(selector)
                }

                override fun beforeTest(testDescriptor: TestDescriptor) = discover(testDescriptor)

                override fun beforeSuite(suite: TestDescriptor) {
                    // Some JUnit Platform classes report no tests in a dry run, such as
                    // parameterized templates, factories and Kotest specs.
                    if (options is JUnitPlatformOptions && suite.className != null && suite.parent?.className == null) {
                        discover(suite)
                    }
                }

                override fun afterTest(testDescriptor: TestDescriptor, result: TestResult) {}

                override fun afterSuite(suite: TestDescriptor, result: TestResult) {
                    if (suite.parent == null) {
                        manifest.writeText(classes.joinToString("\n", postfix = "\n"))
                    }
                }
            })
        } else if (assignments != null) {
            val owned = if (manifest.isFile) manifest.readLines() else emptyList()
            val classes = assignments.filter { it in owned }
            onlyIf("this task owns assigned classes") { classes.isNotEmpty() }
            setTestNameIncludePatterns(classes)
        }
    }
}
