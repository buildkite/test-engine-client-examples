package com.buildkite.examples.jvm

import kotlin.test.Test
import kotlin.test.assertEquals

class ShippingTest {
    @Test
    fun `sorts carriers by name`() {
        assertEquals(listOf("courier", "post"), listOf("post", "courier").sorted())
    }
}
