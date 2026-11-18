package com.buildkite.examples

import org.junit.Assert.assertEquals
import org.junit.Test

class SlowTest {
    @Test
    fun slowOperation() {
        // Give timing-based splitting one slow class.
        Thread.sleep(15000)
        assertEquals(4, 2 + 2)
    }
}
