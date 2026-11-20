package com.buildkite.examples.jvm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class CheckoutTest {
    @Test
    void sumsLinePrices() {
        assertEquals(42, IntStream.of(30, 12).sum());
    }
}
