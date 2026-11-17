package com.buildkite.examples

import org.junit.Ignore
import org.junit.Test

class SkippedTest {

    @Test
    @Ignore("Demonstrating a skipped test")
    fun skippedTest() {
    }

    @Test
    @Ignore("Another skipped test for demonstration")
    fun anotherSkippedTest() {
    }
}
