import pytest

pytestmark = pytest.mark.execution_tag("component", "inventory")


@pytest.mark.execution_tag("custom.tag.from", "test decorator")
@pytest.mark.parametrize("sku,quantity,remaining", [("widget", 3, 4), ("bolt", 11, 0)])
def test_reserve_stock(inventory, sku, quantity, remaining):
    assert inventory.reserve(sku, quantity) == remaining
    assert inventory.available(sku) == remaining
    # Reserving one product must not change the other product's stock.
    other = "bolt" if sku == "widget" else "widget"
    assert inventory.available(other) == {"widget": 7, "bolt": 11}[other]


@pytest.mark.parametrize("quantity", [0, 8])
def test_invalid_reservation(inventory, quantity):
    with pytest.raises(ValueError, match=f"Cannot reserve {quantity} of widget; available: 7"):
        inventory.reserve("widget", quantity)
    assert inventory.available("widget") == 7
    assert inventory.available("bolt") == 11


def test_missing_product(inventory):
    # Deliberately uncaught: compare a real application failure in JSON and OTel.
    inventory.reserve("missing", 1)
