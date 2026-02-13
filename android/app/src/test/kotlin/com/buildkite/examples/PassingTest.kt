package com.buildkite.examples

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PassingTest {

    @Test
    fun additionIsCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun stringConcatenation() {
        assertEquals("hello world", "hello" + " " + "world")
    }

    @Test
    fun listOperations() {
        val list = listOf(1, 2, 3)
        assertTrue(list.contains(2))
        assertEquals(3, list.size)
    }
}
