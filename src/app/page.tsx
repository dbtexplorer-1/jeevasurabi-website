'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Star, ShieldCheck, Leaf, Droplets, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  price: number;
  img: string;
  description?: string;
}

// Using your specific product data
const PRODUCTS: Product[] = [
  { id: 5, name: "Cold Pressed Groundnut oil", category: "Cold Pressed Oils", size: "1 Litre", price: 320, img: "/groundnut.png", description: "Pure, unrefined groundnut oil pressed in a traditional Mara Chekku. Perfect for deep frying and everyday cooking, giving your food a rich, authentic flavor." },
  { id: 3, name: "Cold Pressed Gingelly oil", category: "Cold Pressed Oils", size: "1 Litre", price: 480, img: "/gingelly.png", description: "Made from carefully selected sesame seeds and palm jaggery. Cold-pressed to perfection, maintaining the authentic traditional taste and nutritional benefits." },
  { id: 1, name: "Cold Pressed Coconut oil", category: "Cold Pressed Oils", size: "1 Litre", price: 500, img: "/coconut.png", description: "Extracted from premium quality coconuts using traditional wooden ghanis. Free from chemical processing, our coconut oil retains all natural nutrients, aroma, and flavor." },
  { id: 13, name: "Karupatti Palm Jaggery", category: "Ghee & Natural Sweeteners", size: "500 grams", price: 190, img: "/karuppatti-jeevasurabi-food-products.jpg" },
  { id: 14, name: "Naatusarkarai", category: "Ghee & Natural Sweeteners", size: "500 grams", price: 50, img: "/naatusarkarai-jeevasurabi-food-products.jpg" },
];

export default function HomePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { addToCart } = useCart();
  const { toggleWishlist: contextToggleWishlist, isInWishlist } = useWishlist();

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); 
    contextToggleWishlist(product as any);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8; // Scroll 80% of the view width
      const scrollTo = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (selectedProduct) {
    const isProductInWishlist = isInWishlist(selectedProduct.id);

    return (
      <div className="min-h-screen bg-white text-gray-900 pb-20">
        {/* Breadcrumb / Back Navigation */}
        <div className="border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="flex items-center hover:text-green-900 transition-colors font-medium"
            >
              <ChevronLeft size={16} className="mr-1" /> Back to Home
            </button>
            <span>/</span>
            <span>{selectedProduct.category}</span>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate">{selectedProduct.name}</span>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
            
            {/* Left: Product Image Gallery */}
            <div className="md:w-1/2 flex-shrink-0">
              <div className="sticky top-24 rounded-3xl overflow-hidden bg-gray-50 aspect-square border border-gray-100 p-8 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image 
                    src={selectedProduct.img} 
                    alt={selectedProduct.name} 
                    fill 
                    className="object-contain hover:scale-105 transition-transform duration-500" 
                  />
                </div>
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="md:w-1/2 flex flex-col justify-start pt-4">
              <p className="text-green-800 font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
                <Leaf size={14} /> {selectedProduct.category}
              </p>
              <h1 className="text-3xl md:text-5xl font-serif text-gray-900 mb-4 leading-tight">
                {selectedProduct.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-amber-500">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                </div>
                <span className="text-sm text-gray-500 underline cursor-pointer">48 Reviews</span>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-black text-green-900">₹{selectedProduct.price}</span>
                <span className="text-gray-500 ml-2 text-sm">(Inclusive of all taxes)</span>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Select Size</h3>
                <div className="inline-block border-2 border-green-900 text-green-900 font-bold bg-green-50 px-6 py-3 rounded-xl cursor-default">
                  {selectedProduct.size}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => addToCart(selectedProduct)}
                  className="flex-1 bg-green-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-800 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>

                {/* Wishlist Button with Hover Tooltip */}
                <div className="relative group flex-shrink-0">
                  <button 
                    onClick={(e) => handleToggleWishlist(e, selectedProduct)}
                    className={`h-full px-6 flex items-center justify-center border-2 rounded-xl transition-all active:scale-[0.98] ${
                      isProductInWishlist 
                        ? 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100' 
                        : 'border-gray-200 text-gray-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart size={24} className={isProductInWishlist ? "fill-red-500 text-red-500" : ""} />
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
                    {isProductInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                    {/* Tooltip Arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-6 mb-8">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="bg-green-50 p-3 rounded-full text-green-800"><Droplets size={20} /></div>
                  <span className="text-xs font-bold text-gray-600">Cold Pressed</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="bg-amber-50 p-3 rounded-full text-amber-700"><ShieldCheck size={20} /></div>
                  <span className="text-xs font-bold text-gray-600">100% Pure</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="bg-green-50 p-3 rounded-full text-green-800"><Leaf size={20} /></div>
                  <span className="text-xs font-bold text-gray-600">No Preservatives</span>
                </div>
              </div>

              {/* Accordions (Description, Benefits, etc.) */}
              <div className="space-y-4">
                <details className="group border border-gray-200 rounded-2xl bg-white [&_summary::-webkit-details-marker]:hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-gray-900">
                    Product Description
                    <span className="transition duration-300 group-open:-rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {selectedProduct.description || "Authentic traditional product made with the highest quality ingredients, preserving natural nutrients and original flavor. Carefully crafted using time-honored methods to bring pure, unadulterated goodness to your home."}
                  </div>
                </details>

                <details className="group border border-gray-200 rounded-2xl bg-white [&_summary::-webkit-details-marker]:hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-gray-900">
                    Health Benefits
                    <span className="transition duration-300 group-open:-rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Rich in antioxidants and natural nutrients.</li>
                      <li>Supports healthy digestion and metabolism.</li>
                      <li>Maintains authentic flavor without any chemical refinement.</li>
                    </ul>
                  </div>
                </details>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf9]">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ 
            backgroundImage: `url('/bg1.png')`, // Replace with your actual hero image
          }}
        >
          {/* Gradient Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
          <span className="text-amber-400 font-bold tracking-[0.3em] uppercase text-sm md:text-base mb-6 block animate-in fade-in slide-in-from-bottom-4 duration-700">
            Authentic & Traditional
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Wood Pressed Oils <br/>
          </h1>
          <p className="text-gray-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Experience the purity of nature with our traditional cold-pressed oils, 
            made with care to preserve vital nutrients and authentic flavor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link 
              href="/shop" 
              className="bg-white text-green-900 px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-amber-50 transition-all flex items-center justify-center gap-2 group shadow-lg"
            >
              Shop now! <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Scroller Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-amber-700 font-bold uppercase tracking-wider text-sm mb-2">Our Bestsellers</p>
              <h2 className="text-3xl md:text-4xl font-serif text-green-900">Featured Products</h2>
            </div>
            
            {/* Desktop Navigation Buttons */}
            <div className="hidden md:flex gap-4">
              <button 
                onClick={() => scroll('left')}
                className="p-3 rounded-full border-2 border-green-900 text-green-900 hover:bg-green-900 hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="p-3 rounded-full border-2 border-green-900 text-green-900 hover:bg-green-900 hover:text-white transition-all active:scale-95"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Horizontal Scroller Container */}
          <div 
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto pb-10 snap-x snap-mandatory no-scrollbar"
            style={{ 
              msOverflowStyle: 'none', 
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {PRODUCTS.map((product) => (
              <div 
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="min-w-[280px] md:min-w-[350px] snap-start bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img 
                    src={product.img} 
                    alt={product.name}
                    className="object-contain w-full h-full p-8 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-green-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {product.category}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-serif text-xl text-gray-900 mb-1 group-hover:text-green-800 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">{product.size}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-900">₹{product.price}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="bg-amber-600 text-white p-3 rounded-xl hover:bg-amber-700 transition-colors shadow-md active:scale-90"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}