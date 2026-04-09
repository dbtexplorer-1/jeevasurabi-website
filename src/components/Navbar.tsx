"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, User, Menu, X, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import our new hook

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenWishlist: () => void;
}

export default function Navbar({ cartCount, wishlistCount, onOpenCart, onOpenProfile, onOpenWishlist }: NavbarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get auth state from our Context
  const { isLoggedIn, user, logout } = useAuth();

  // Helper function to apply active styles for desktop
  const activeStyles = (path: string) => 
    pathname === path 
      ? "text-white border-b-2 border-white pb-1" 
      : "text-green-100 hover:text-white transition-colors pb-1";

  // Helper for mobile active styles
  const mobileActiveStyles = (path: string) =>
    pathname === path ? "text-green-900 font-black" : "text-gray-700";

  return (
    <nav className="bg-green-900 shadow-sm sticky top-0 z-40 w-full transition-all">
      <div className="flex justify-between items-center px-6 md:px-12 py-4 md:py-6">
        
        {/* MOBILE MENU TOGGLE */}
        <button 
          className="lg:hidden text-white hover:text-green-200 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* BRAND LOGO */}
        <div className="flex items-center">
          <Link href="/">
            <Image src="/icon.png" alt="Jeevasurabi Logo" width={120} height={40} className="object-contain h-8 md:h-10 w-auto" priority />
          </Link>
        </div>

        {/* DESKTOP NAV LINKS */}
        <div className="hidden lg:flex space-x-12 font-bold uppercase text-sm tracking-[0.2em]">
          <Link href="/" className={activeStyles('/')}>Home</Link>
          <Link href="/shop" className={activeStyles('/shop')}>Shop</Link>
          <Link href="/about" className={activeStyles('/about')}>About</Link>
          <Link href="/contact" className={activeStyles('/contact')}>Contact us</Link>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center space-x-4 md:space-x-8 text-white">
          <button 
            onClick={onOpenWishlist} 
            className="relative hover:text-green-200 transition-transform hover:scale-110"
          >
            <Heart className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 md:px-2 py-0.5 font-bold animate-bounce shadow-md">
                {wishlistCount}
              </span>
            )}
          </button>

          <button 
            onClick={onOpenCart} 
            className="relative hover:text-green-200 transition-transform hover:scale-110"
          >
            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] rounded-full px-1.5 md:px-2 py-0.5 font-bold animate-bounce shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* AUTHENTICATION SECTION */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-4 border-l border-green-800 pl-4 md:pl-8">
              <div className="hidden md:block text-right">
                <p className="text-[10px] uppercase tracking-widest text-green-300 font-bold">Logged in as</p>
                <p className="text-xs font-bold truncate max-w-[120px]">{user?.email}</p>
              </div>
              <button 
                onClick={logout}
                className="hover:text-red-400 transition-all hover:scale-110 flex items-center gap-2 bg-green-950/50 p-2 md:p-3 rounded-xl border border-green-800"
                title="Logout"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="hover:text-green-200 transition-transform hover:scale-110"
            >
              <User className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-8 flex flex-col space-y-8 font-bold text-gray-700 uppercase text-sm tracking-[0.25em] animate-in slide-in-from-top duration-300 shadow-xl">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/')}>Home</Link>
          <Link href="/shop" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/shop')}>Shop</Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/about')}>About</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/contact')}>Contact Us</Link>
          
          {/* Mobile Auth Button */}
          <div className="pt-4 border-t border-gray-100">
            {isLoggedIn ? (
              <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-red-600 flex items-center gap-4">
                <LogOut size={20} /> Logout
              </button>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-green-900 flex items-center gap-4">
                <User size={20} /> Login / Signup
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}