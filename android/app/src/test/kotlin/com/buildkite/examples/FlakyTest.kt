package com.buildkite.examples

import org.junit.Assert.assertTrue
import org.junit.Test

class FlakyTest {

    @Test
    fun flakyRandomTest() {
        val shouldPass = Math.random() > 0.3
        assertTrue("Flaky test failed this time", shouldPass)
    }

    @Test
    fun flakyTimingTest() {
        val value = Math.random()
        assertTrue("Random value was below threshold", value > 0.4)
    }
}
