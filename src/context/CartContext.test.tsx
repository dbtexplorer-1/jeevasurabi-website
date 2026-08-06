import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "./CartContext";

const product = {
  id: 1,
  name: "Cold Pressed Coconut Oil",
  price: 500,
  img: "/coconut.png",
  size: "1 Litre",
  stock_quantity: 2,
};

function CartHarness() {
  const { addToCart, cart, updateQuantity } = useCart();
  return (
    <>
      <button onClick={() => addToCart(product)}>Add product</button>
      <button onClick={() => updateQuantity(product.id, 1)}>Increase quantity</button>
      <output data-testid="quantity">{cart[0]?.quantity ?? 0}</output>
    </>
  );
}

describe("CartProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a product and prevents quantity from exceeding available stock", async () => {
    render(<CartProvider><CartHarness /></CartProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Add product" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(screen.getByTestId("quantity")).toHaveTextContent("2");
    await waitFor(() => expect(localStorage.getItem("cartData")).toContain('"quantity":2'));
  });

  it("does not add an out-of-stock product", () => {
    const toastListener = vi.fn();
    window.addEventListener("show-toast", toastListener);
    const unavailableProduct = { ...product, stock_quantity: 0 };

    function UnavailableCartHarness() {
      const { addToCart, cart } = useCart();
      return <button onClick={() => addToCart(unavailableProduct)}>{cart.length}</button>;
    }

    render(<CartProvider><UnavailableCartHarness /></CartProvider>);
    act(() => fireEvent.click(screen.getByRole("button", { name: "0" })));

    expect(screen.getByRole("button", { name: "0" })).toBeInTheDocument();
    expect(toastListener).toHaveBeenCalledOnce();
    window.removeEventListener("show-toast", toastListener);
  });
});
