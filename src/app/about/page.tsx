"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingCart, User, X, Package, Settings, 
  LogIn, Heart, ShieldCheck, Leaf, Sparkles 
} from 'lucide-react';

export default function AboutPage() {
  const [cart, setCart] = useState<any[]>([]);

  // Modal/Drawer helper functions
  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = (item.quantity || 1) + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };
  const removeFromCart = (id: number) => setCart(cart.filter(item => item.id !== id));

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 overflow-x-hidden text-lg md:text-xl font-medium">
      
      {/* --- ABOUT HERO --- */}
      <section className="relative py-24 md:py-40 bg-green-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image src="/aboutbg.png" alt="Background" fill className="object-cover" priority />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto text-center px-6">
          <h1 className="text-5xl md:text-8xl font-serif mb-8 leading-tight tracking-tight">Pure Intentions.<br/>Traditional Roots.</h1>
          <p className="text-xl md:text-3xl text-green-100 font-light italic max-w-3xl mx-auto">Manufacturing 100% raw and natural wood pressed edible oils.</p>
        </div>
      </section>

      {/* --- SECTION 1: GROUNDNUT OIL --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-amber-700 font-bold uppercase tracking-[0.3em] text-xs mb-6 block font-sans">Traditional Extraction</span>
            <h2 className="text-4xl md:text-6xl font-serif text-green-900 mb-10 leading-tight">Serving the society through Wood Pressed Oils.</h2>
            <div className="space-y-8 text-gray-700 leading-relaxed font-medium text-xl">
              <p>We, the <strong>‘Jeeva Surabi Food Products’</strong>, are happy to bring to your notice that we have attained our first milestone to serve the society by manufacturing pure wood pressed edible oils.</p>
              <p>Using the traditional extraction method with <strong>‘Waagai wood’</strong>, we produce oils like Coconut Oil, Gingely Oil and Groundnut Oil. No chemicals or preservatives are added to enhance taste, odour, or longevity.</p>
            </div>
          </div>
          <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
             <Image src="/groundnut.png" alt="Wood Pressed Groundnut Oil" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* --- SECTION 2: GHEE --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto bg-white rounded-[5rem] shadow-sm">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="order-2 md:order-1 relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-gray-50">
             <Image src="/jeevasurabi-ghee.jpg" alt="Pure Cow Ghee" fill className="object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-amber-700 font-bold uppercase tracking-[0.3em] text-xs mb-6 block font-sans">Pure Cow Ghee</span>
            <h2 className="text-4xl md:text-6xl font-serif text-green-900 mb-10 leading-tight">Traditional Ghee for Pure Wellness.</h2>
            <div className="space-y-8 text-gray-700 leading-relaxed font-medium text-xl">
              <p>Our Ghee is prepared using traditional methods to ensure that the natural aroma and health benefits are locked into every drop.</p>
              <p>We believe in raw purity. Unlike refined market oils, our products are 100% natural and produced without hazardous additives or preservatives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: HONEY --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-amber-700 font-bold uppercase tracking-[0.3em] text-xs mb-6 block font-sans">Natural Sweeteners</span>
            <h2 className="text-4xl md:text-6xl font-serif text-green-900 mb-10 leading-tight">Raw Wild Honey for Natural Vitality.</h2>
            <div className="space-y-8 text-gray-700 leading-relaxed font-medium text-xl">
              <p>Sourced from the heart of nature, our Wild Honey is unprocessed and chemical-free, keeping its medicinal properties intact.</p>
              <p>We expect your support by rendering us an opportunity to serve you. Your mission for the well-being of the society helps us in bringing 100% natural awareness.</p>
            </div>
          </div>
          <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
             <Image src="/honey-jeevasurabi-food-products.jpg" alt="Raw Wild Honey" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* --- MISSION STATEMENT --- */}
      <section className="py-32 px-6 text-center max-w-5xl mx-auto">
        <Heart className="mx-auto mb-10 text-amber-600" size={80} strokeWidth={1} />
        <h3 className="text-4xl md:text-6xl font-serif text-green-900 mb-12 leading-tight italic tracking-tight">
          "Our motto is to serve the society through our quality food products."
        </h3>
        <p className="text-gray-400 uppercase tracking-[0.5em] font-black text-sm md:text-lg">Serving Health, Rendering Quality</p>
        <Link href="/shop" className="mt-20 inline-block">
          <button className="bg-green-900 text-white px-16 py-7 rounded-[2rem] font-bold uppercase tracking-widest text-sm md:text-lg shadow-2xl hover:bg-green-800 transition active:scale-95 shadow-green-900/40">
            Support Our Mission
          </button>
        </Link>
      </section>

    </div>
  );
}