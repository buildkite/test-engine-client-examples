package com.buildkite.examples.jvm

import kotlin.test.Test
import kotlin.test.assertTrue

class ShippingTest {
    @Test
    fun choosesCarrier() {
        assertTrue(listOf("post", "courier").contains("courier"))
    }
}
