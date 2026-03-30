"use client";
import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { User, X, LogIn, Package, Settings, ShoppingCart, Trash2, Plus, Minus, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { cart, cartCount, totalPrice, updateQuantity, removeFromCart, addToCart } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pathname = usePathname();

  const shouldHideHeaderFooter = pathname.startsWith('/admin') || pathname === '/login';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setToast(customEvent.detail);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => {
      window.removeEventListener('show-toast', handleToast);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {!shouldHideHeaderFooter && (
        <Navbar 
          cartCount={cartCount} 
          wishlistCount={wishlistCount}
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenProfile={() => setIsProfileOpen(true)} 
          onOpenWishlist={() => setIsWishlistOpen(true)}
        />
      )}

      <main>{children}</main>

      {!shouldHideHeaderFooter && <Footer />}

      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-[85%] md:w-full md:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl md:text-2xl font-bold text-green-900 uppercase">Your Cart ({cartCount})</h2>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="text-black hover:text-red-600 transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-sm text-center">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border">
                      <Image src={item.img} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-base text-green-900 font-bold">{item.name}</h4>
                      <p className="text-xs text-amber-700 font-bold uppercase">{item.size}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={14}/></button>
                          <span className="px-3 font-bold text-base">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={14}/></button>
                        </div>
                        <span className="font-bold text-lg text-green-900">₹{item.price * item.quantity}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between mb-4 font-bold text-xl">
                  <span>Total</span>
                  <span className="text-green-900">₹{totalPrice}</span>
                </div>
                <button className="w-full bg-green-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-800 transition-all">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- WISHLIST DRAWER --- */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsWishlistOpen(false)} />
          <div className="relative w-[85%] md:w-full md:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl md:text-2xl font-bold text-green-900 uppercase">Your Wishlist ({wishlist.length})</h2>
              <button 
                onClick={() => setIsWishlistOpen(false)} 
                className="text-black hover:text-red-600 transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Heart size={48} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-sm text-center">Your wishlist is empty</p>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border">
                      <Image src={item.img} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-base text-green-900 font-bold">{item.name}</h4>
                      <p className="text-xs text-amber-700 font-bold uppercase">{item.size}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-lg text-green-900">₹{item.price}</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => addToCart(item)}
                            className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-xs font-bold uppercase tracking-wider"
                          >
                            Add to Cart
                          </button>
                          <button onClick={() => toggleWishlist(item)} className="text-gray-300 hover:text-red-600"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PROFILE MODAL --- */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-green-900 p-8 text-white text-center relative">
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
              <User size={40} className="mx-auto mb-4 opacity-50" />
              <h3 className="font-bold text-xl uppercase tracking-widest">Account</h3>
            </div>
            <div className="p-4 space-y-2 text-sm font-bold">
              <Link href="/login" onClick={() => setIsProfileOpen(false)} className="flex items-center space-x-4 w-full p-4 hover:bg-green-50 rounded-lg transition text-gray-700">
                <LogIn size={20} className="text-green-800" /> <span>Sign In / Sign Up</span>
              </Link>
              <button className="flex items-center space-x-4 w-full p-4 hover:bg-green-50 rounded-lg transition text-gray-700">
                <Package size={20} className="text-green-800" /> <span>My Orders</span>
              </button>
              <button className="flex items-center space-x-4 w-full p-4 hover:bg-green-50 rounded-lg transition text-gray-700">
                <Settings size={20} className="text-green-800" /> <span>Settings</span>
              </button>
            </div>
            <button 
              onClick={() => setIsProfileOpen(false)} 
              className="w-full py-4 text-[10px] font-bold text-gray-400 border-t uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold tracking-wider text-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          {toast}
        </div>
      )}
    </>
  );
}