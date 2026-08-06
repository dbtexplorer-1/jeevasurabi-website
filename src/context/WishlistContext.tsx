"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '@/types/api';

export type { Product } from '@/types/api';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: number) => boolean;
  wishlistCount: number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // NEW: Load wishlist from local storage when the app starts
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlistData");
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to parse wishlist data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // NEW: Save wishlist to local storage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("wishlistData", JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: exists ? 'Removed from wishlist' : 'Added to wishlist' }));
    }

    setWishlist((prev) => {
      const itemExists = prev.some((item) => item.id === product.id);
      if (itemExists) {
        return prev.filter((item) => item.id !== product.id); // Remove if already there
      }
      return [...prev, product]; // Add if not there
    });
  };

  const isInWishlist = (id: number) => wishlist.some((item) => item.id === id);
  const wishlistCount = wishlist.length;
  
  // Extra helper function just in case you ever want a "Clear Wishlist" button
  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, wishlistCount, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};
