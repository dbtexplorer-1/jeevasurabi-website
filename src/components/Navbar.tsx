"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  ShoppingCart, User, Menu, X, Heart, LogOut, 
  Package, Settings, UserCircle, ChevronRight, LogIn 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenWishlist: () => void;
}

export default function Navbar({ cartCount, wishlistCount, onOpenCart, onOpenWishlist }: NavbarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { isLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeStyles = (path: string) => 
    pathname === path 
      ? "text-white border-b-2 border-white pb-1" 
      : "text-green-100 hover:text-white transition-colors pb-1";

  const mobileActiveStyles = (path: string) =>
    pathname === path ? "text-green-900 font-black" : "text-gray-700";

  // Helper function to get initials for the avatar fallback
  const getInitials = () => {
    const name = user?.fullName || user?.email || "MEMBER";
    return name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-green-900 shadow-sm sticky top-0 z-40 w-full transition-all">
      <div className="flex justify-between items-center px-6 md:px-12 py-4 md:py-6">
        
        <button 
          className="lg:hidden text-white hover:text-green-200 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className="flex items-center">
          <Link href="/">
            {/* UPDATED: Increased width, height, and Tailwind scaling classes (h-10 md:h-14) */}
            <Image 
              src="/icon.png" 
              alt="Jeevasurabi Logo" 
              width={160} 
              height={55} 
              className="object-contain h-10 md:h-14 w-auto" 
              priority 
            />
          </Link>
        </div>

        <div className="hidden lg:flex space-x-12 font-bold uppercase text-sm tracking-[0.2em]">
          <Link href="/" className={activeStyles('/')}>Home</Link>
          <Link href="/shop" className={activeStyles('/shop')}>Shop</Link>
          <Link href="/about" className={activeStyles('/about')}>About</Link>
          <Link href="/contact" className={activeStyles('/contact')}>Contact us</Link>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8 text-white relative">
          <button onClick={onOpenWishlist} className="relative hover:text-green-200 transition-transform hover:scale-110">
            <Heart className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 md:px-2 py-0.5 font-bold animate-bounce shadow-md">
                {wishlistCount}
              </span>
            )}
          </button>

          <button onClick={onOpenCart} className="relative hover:text-green-200 transition-transform hover:scale-110">
            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] rounded-full px-1.5 md:px-2 py-0.5 font-bold animate-bounce shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 p-1 rounded-full transition-all ${showProfileMenu ? 'bg-white text-green-900 scale-110' : 'hover:text-green-200 hover:scale-110'}`}
            >
              {isLoggedIn ? (
                user?.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt="Profile" 
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-white/50" 
                  />
                ) : (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white text-green-900 flex items-center justify-center font-black text-xs md:text-sm border-2 border-white/50">
                    {getInitials()}
                  </div>
                )
              ) : (
                <User className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-gray-900">
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                  {isLoggedIn ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Welcome Back</p>
                      <p className="text-sm font-black text-green-900 truncate uppercase">
                        {user?.fullName || user?.email || "MEMBER"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Member Access</p>
                      <p className="text-sm font-black text-green-900 uppercase">Join Jeevasurabi</p>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-1">
                  {isLoggedIn ? (
                    <>
                      <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center justify-between p-4 rounded-2xl hover:bg-green-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <UserCircle size={20} className="text-gray-400 group-hover:text-green-700" />
                          <span className="text-sm font-bold text-gray-700 uppercase">My Profile</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </Link>
                      <Link href="/orders" onClick={() => setShowProfileMenu(false)} className="flex items-center justify-between p-4 rounded-2xl hover:bg-green-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-gray-400 group-hover:text-green-700" />
                          <span className="text-sm font-bold text-gray-700 uppercase">My Orders</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </Link>
                      <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center justify-between p-4 rounded-2xl hover:bg-green-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <Settings size={20} className="text-gray-400 group-hover:text-green-700" />
                          <span className="text-sm font-bold text-gray-700 uppercase">Settings</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </Link>
                      <div className="h-px bg-gray-100 my-2 mx-2"></div>
                      <button 
                        onClick={() => { logout(); setShowProfileMenu(false); }} 
                        className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut size={20} />
                        <span className="text-sm font-bold uppercase">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <Link 
                      href="/login" 
                      onClick={() => setShowProfileMenu(false)} 
                      className="flex items-center justify-between p-4 bg-green-900 text-white rounded-2xl hover:bg-green-800 transition-all shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <LogIn size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Sign In / Join</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-8 flex flex-col space-y-8 font-bold text-gray-700 uppercase text-sm tracking-[0.25em] animate-in slide-in-from-top duration-300 shadow-xl">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/')}>Home</Link>
          <Link href="/shop" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/shop')}>Shop</Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/about')}>About</Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)} className={mobileActiveStyles('/contact')}>Contact Us</Link>
        </div>
      )}
    </nav>
  );
}