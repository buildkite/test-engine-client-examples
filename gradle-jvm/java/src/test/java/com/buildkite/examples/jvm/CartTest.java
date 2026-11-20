package com.buildkite.examples.jvm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CartTest {
    private final List<String> cart = new ArrayList<>();

    @Test
    void keepsItemsInOrder() {
        cart.add("kite");
        cart.add("string");
        assertEquals(List.of("kite", "string"), cart);
    }

    @ParameterizedTest
    @ValueSource(strings = {"kite", "string", "tail"})
    void containsAddedItem(String item) {
        cart.add(item);
        assertTrue(cart.contains(item));
    }

    @Nested
    class WhenNew {
        @Test
        void isEmpty() {
            assertTrue(cart.isEmpty());
        }
    }
}
