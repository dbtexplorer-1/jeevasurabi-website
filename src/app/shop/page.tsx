"use client";
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Filter, Search, ChevronLeft, Star, ShieldCheck, Leaf, Droplets, ShoppingCart, Heart, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  price: number;
  img: string;
  stock_quantity: number; // Added from Backend
  description?: string;
}

const categories = ["All", "Cold Pressed Oils", "Cosmetics", "Ghee & Natural Sweeteners", "Health Supplement", "Others"];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { addToCart } = useCart();
  const { toggleWishlist: contextToggleWishlist, isInWishlist } = useWishlist();

  // --- FETCH PRODUCTS FROM BACKEND ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError("Unable to load products. Please ensure the backend is running.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); 
    contextToggleWishlist(product as any);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9]">
        <Loader2 className="animate-spin text-green-900 mb-4" size={48} />
        <p className="text-gray-500 font-serif text-xl">Bringing you fresh products...</p>
      </div>
    );
  }

  // Error View
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] px-4">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-gray-800 font-bold text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-green-900 underline font-bold">Try Again</button>
      </div>
    );
  }

  // View: Product Detail Page
  if (selectedProduct) {
    const isProductInWishlist = isInWishlist(selectedProduct.id);
    const isOutOfStock = selectedProduct.stock_quantity <= 0;

    return (
      <div className="min-h-screen bg-white text-gray-900 pb-20">
        <div className="border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setSelectedProduct(null)} className="flex items-center hover:text-green-900 transition-colors font-medium">
              <ChevronLeft size={16} className="mr-1" /> Back to Shop
            </button>
            <span>/</span>
            <span>{selectedProduct.category}</span>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate">{selectedProduct.name}</span>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
            <div className="md:w-1/2 flex-shrink-0">
              <div className="sticky top-24 rounded-3xl overflow-hidden bg-gray-50 aspect-square border border-gray-100 p-8 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image src={selectedProduct.img} alt={selectedProduct.name} fill className="object-contain hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            </div>

            <div className="md:w-1/2 flex flex-col justify-start pt-4">
              <p className="text-green-800 font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
                <Leaf size={14} /> {selectedProduct.category}
              </p>
              <h1 className="text-3xl md:text-5xl font-serif text-gray-900 mb-4 leading-tight">{selectedProduct.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-amber-500"><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /></div>
                <span className="text-sm text-gray-500 underline">48 Reviews</span>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-black text-green-900">₹{selectedProduct.price}</span>
                {isOutOfStock && <span className="ml-4 text-red-600 font-bold uppercase tracking-widest text-xs bg-red-50 px-3 py-1 rounded-full border border-red-100">Out of Stock</span>}
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Select Size</h3>
                <div className="inline-block border-2 border-green-900 text-green-900 font-bold bg-green-50 px-6 py-3 rounded-xl cursor-default">{selectedProduct.size}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  disabled={isOutOfStock}
                  onClick={() => addToCart(selectedProduct)}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-900 text-white hover:bg-green-800'}`}
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>

                <button 
                  onClick={(e) => handleToggleWishlist(e, selectedProduct)}
                  className={`px-6 flex items-center justify-center border-2 rounded-xl transition-all active:scale-[0.98] ${isProductInWishlist ? 'border-red-100 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400'}`}
                >
                  <Heart size={24} className={isProductInWishlist ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-6 mb-8">
                <div className="flex flex-col items-center text-center gap-2"><div className="bg-green-50 p-3 rounded-full text-green-800"><Droplets size={20} /></div><span className="text-xs font-bold text-gray-600">Cold Pressed</span></div>
                <div className="flex flex-col items-center text-center gap-2"><div className="bg-amber-50 p-3 rounded-full text-amber-700"><ShieldCheck size={20} /></div><span className="text-xs font-bold text-gray-600">100% Pure</span></div>
                <div className="flex flex-col items-center text-center gap-2"><div className="bg-green-50 p-3 rounded-full text-green-800"><Leaf size={20} /></div><span className="text-xs font-bold text-gray-600">No Preservatives</span></div>
              </div>

              <div className="space-y-4">
                <details className="group border border-gray-200 rounded-2xl bg-white p-6 [&_summary::-webkit-details-marker]:hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-gray-900">Product Description<span className="transition duration-300 group-open:-rotate-180"><ChevronLeft className="-rotate-90" /></span></summary>
                  <div className="mt-4 text-gray-600 leading-relaxed">{selectedProduct.description || "Authentic traditional product preserved naturally."}</div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View: Marketplace Grid
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-serif text-green-900 mb-4">Our Marketplace</h1>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-800" size={20} />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-16 pr-8 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-10 items-start">
        <aside className="w-full md:w-72 flex-shrink-0 md:sticky md:top-40 z-20">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-bold text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center"><Filter size={14} className="mr-3" /> Filter Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left font-bold text-sm uppercase tracking-wider py-4 px-5 rounded-2xl transition-all ${selectedCategory === cat ? 'bg-green-900 text-white' : 'text-gray-500 hover:bg-green-50'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => {
              const isProductInWishlist = isInWishlist(product.id);
              const isOutOfStock = product.stock_quantity <= 0;
              
              return (
                <div key={product.id} onClick={() => setSelectedProduct(product)} className="group bg-white rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col">
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <Image src={product.img} alt={product.name} fill className="object-cover group-hover:scale-105 transition duration-1000" />
                    <button onClick={(e) => handleToggleWishlist(e, product)} className="absolute top-3 right-3 p-2.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 z-20"><Heart size={18} className={isProductInWishlist ? "fill-red-500 text-red-500" : ""} /></button>
                    {!isOutOfStock && (
                      <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md text-green-900 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all z-10 hover:bg-green-900 hover:text-white">Quick Add</button>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg rotate-[-10deg] shadow-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-serif text-sm md:text-lg text-gray-800 leading-tight mb-2">{product.name}</h3>
                      <p className="text-xs md:text-sm font-bold text-amber-700 bg-amber-50 inline-block px-3 py-1 rounded-lg uppercase tracking-wider mb-4">{product.size}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50"><span className="text-lg md:text-2xl font-black text-green-900">₹{product.price}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}