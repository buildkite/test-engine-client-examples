package com.buildkite.examples.jvm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class CheckoutTest {
    @Test
    void totalsOrder() {
        assertEquals(42, 30 + 12);
    }

    @Test
    @Disabled("Demonstrating a skipped test")
    void sendsReceipt() {
    }
}
