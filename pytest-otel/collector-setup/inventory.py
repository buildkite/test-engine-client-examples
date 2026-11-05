"""A small inventory service backed by a local SQLite database."""

import sqlite3

from opentelemetry import trace

tracer = trace.get_tracer("example.inventory")


class Inventory:
    def __init__(self, stock):
        with tracer.start_as_current_span("inventory.open"):
            self.connection = sqlite3.connect(":memory:")
            self.cursor = self.connection.cursor()
            with self.connection:
                self.cursor.execute("CREATE TABLE stock (sku TEXT PRIMARY KEY, quantity INTEGER)")
                self.cursor.executemany("INSERT INTO stock VALUES (?, ?)", stock.items())

    def available(self, sku):
        with tracer.start_as_current_span("inventory.lookup") as span:
            span.set_attribute("inventory.sku", sku)
            row = self.cursor.execute("SELECT quantity FROM stock WHERE sku = ?", (sku,)).fetchone()
            if row is None:
                raise LookupError(f"Unknown product: {sku}")
            return row[0]

    def reserve(self, sku, quantity):
        with tracer.start_as_current_span("inventory.reserve") as span:
            span.set_attribute("inventory.sku", sku)
            span.set_attribute("inventory.quantity", quantity)
            with self.connection:
                available = self.available(sku)
                if quantity <= 0 or quantity > available:
                    raise ValueError(f"Cannot reserve {quantity} of {sku}; available: {available}")
                self.cursor.execute(
                    "UPDATE stock SET quantity = quantity - ? WHERE sku = ?", (quantity, sku)
                )
                return self.available(sku)

    def close(self):
        with tracer.start_as_current_span("inventory.close"):
            self.cursor.close()
            self.connection.close()
