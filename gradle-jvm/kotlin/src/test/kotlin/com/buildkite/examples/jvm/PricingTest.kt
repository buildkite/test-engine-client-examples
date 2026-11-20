package com.buildkite.examples.jvm

import kotlin.math.roundToLong
import kotlin.test.Test
import kotlin.test.assertEquals

class PricingTest {
    @Test
    fun `rounds to the nearest cent`() {
        assertEquals(125L, (1.249 * 100).roundToLong())
    }

    @Test
    fun `adds ten percent tax`() {
        assertEquals(110, 100 + 100 / 10)
    }
}
