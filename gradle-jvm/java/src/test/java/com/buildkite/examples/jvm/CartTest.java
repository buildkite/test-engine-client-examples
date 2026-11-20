package com.buildkite.examples.jvm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CartTest {
    @Test
    void addsItems() {
        assertEquals(3, List.of("kite", "string", "tail").size());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 5})
    void acceptsPositiveQuantities(int quantity) {
        assertTrue(quantity > 0);
    }

    @Nested
    class Discounts {
        @Test
        void appliesPercentageCoupon() {
            assertEquals(90, 100 - 100 * 10 / 100);
        }
    }
}
