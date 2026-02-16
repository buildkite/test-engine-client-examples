package com.buildkite.examples

import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test

class FailingTest {

    @Test
    fun deliberateFailure() {
        fail("This test is expected to fail")
    }

    @Test
    fun incorrectAssertion() {
        assertEquals("Expected 5 but got 4", 5, 2 + 2)
    }
}
