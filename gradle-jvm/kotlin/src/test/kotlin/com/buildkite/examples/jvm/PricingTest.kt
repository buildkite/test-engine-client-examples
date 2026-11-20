package com.buildkite.examples.jvm

import kotlin.test.Test
import kotlin.test.assertEquals

class PricingTest {
    @Test
    fun `rounds to the nearest cent`() {
        assertEquals(1.25, Math.round(1.249 * 100) / 100.0)
    }

    @Test
    fun addsTax() {
        assertEquals(110, 100 + 10)
    }
}
