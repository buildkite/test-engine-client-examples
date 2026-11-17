package com.buildkite.examples

import org.junit.Assert.assertEquals
import org.junit.Test

class SlowTest {
    @Test
    fun slowOperation() {
        // Deliberately dominate the suite so timing-based splitting is visible:
        // a warm plan should put this class alone, not split by class count.
        Thread.sleep(15000)
        assertEquals(4, 2 + 2)
    }
}
