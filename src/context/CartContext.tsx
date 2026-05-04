"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// Updated interface to include stock_quantity for validation
interface Product {
  id: number;
  name: string;
  price: number;
  img: string;
  size: string;
  quantity: number;
  stock_quantity: number; 
}

interface CartContextType {
  cart: Product[];
  addToCart: (product: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  totalPrice: number;
  cartCount: number;
  // NEW: Global UI state for the cart drawer
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // NEW: Global state to control if the cart drawer is visible
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Load cart from local storage on startup
  useEffect(() => {
    const savedCart = localStorage.getItem("cartData");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // 2. Save cart to local storage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("cartData", JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = (product: any) => {
    // SECURITY CHECK 1: Block adding if out of stock
    if (product.stock_quantity <= 0) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Sorry, ${product.name} is out of stock!` 
        }));
      }
      return;
    }

    // SECURITY CHECK 2: Check if already in cart and at max stock limit
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem && existingItem.quantity >= product.stock_quantity) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: `Only ${product.stock_quantity} units available in stock.` 
        }));
      }
      return; // Stop here, do not update state
    }

    // If we pass checks:
    // 1. Show Toast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Added to cart' }));
    }

    // 2. AUTO-OPEN: Set global cart state to true
    setIsCartOpen(true);

    // 3. Update State (Pure Function)
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((item) => item.id !== id));

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          // Check stock limit when increasing quantity via [+] button
          if (delta > 0 && newQty > item.stock_quantity) {
            return item; 
          }
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cartData");
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalPrice, 
      cartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};