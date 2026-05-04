"use client";
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  Filter, Search, ChevronLeft, Star, ShieldCheck, 
  Leaf, Droplets, ShoppingCart, Heart, Loader2, 
  AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

// Dynamically determine the API base URL to prevent Network/CORS errors
const API_BASE = typeof window !== "undefined" 
  ? `http://${window.location.hostname}:8000` 
  : "http://localhost:8000";

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  price: number;
  img: string;
  stock_quantity: number;
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
  
  // Mobile Filter Toggle State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { toggleWishlist: contextToggleWishlist, isInWishlist } = useWishlist();

  // Scroll to top when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      window.scrollTo(0, 0);
    }
  }, [selectedProduct]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Using the dynamic API_BASE instead of the hardcoded IP
        const res = await fetch(`${API_BASE}/products`);
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
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9]">
        <Loader2 className="animate-spin text-green-900 mb-4" size={48} />
        <p className="text-gray-500 font-serif text-xl">Bringing you fresh products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] px-4">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-gray-800 font-bold text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-green-900 underline font-bold">Try Again</button>
      </div>
    );
  }

  // --- View: Product Detail Page ---
  if (selectedProduct) {
    const isProductInWishlist = isInWishlist(selectedProduct.id);
    const isOutOfStock = selectedProduct.stock_quantity <= 0;

    return (
      <div className="min-h-screen bg-white text-gray-900 pb-10">
        <div className="border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setSelectedProduct(null)} className="flex items-center hover:text-green-900 transition-colors font-bold">
              <ChevronLeft size={16} className="mr-1" /> Back
            </button>
            <span>/</span>
            <span className="text-gray-900 font-semibold truncate">{selectedProduct.name}</span>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 py-6 md:py-10">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            
            {/* Left: Product Image - Sized to fit screen better */}
            <div className="w-full md:w-[45%] flex-shrink-0">
              <div className="rounded-3xl overflow-hidden bg-gray-50 aspect-square border border-gray-100 p-6 flex items-center justify-center max-h-[400px] md:max-h-[500px]">
                <div className="relative w-full h-full">
                  <Image src={selectedProduct.img} alt={selectedProduct.name} fill className="object-contain" />
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="w-full md:w-[55%] pt-2">
              <p className="text-green-800 font-black tracking-widest uppercase text-[10px] mb-2 flex items-center gap-2">
                <Leaf size={12} /> {selectedProduct.category}
              </p>
              <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2 leading-tight">{selectedProduct.name}</h1>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex text-amber-500"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Verified Product</span>
              </div>

              <div className="mb-6 flex items-baseline gap-3">
                <span className="text-4xl font-black text-green-900">₹{selectedProduct.price}</span>
                {isOutOfStock && <span className="text-red-600 font-bold uppercase text-[10px] bg-red-50 px-2 py-1 rounded">Out of Stock</span>}
              </div>

              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Size</h3>
                <div className="inline-block border-2 border-green-900 text-green-900 font-bold bg-green-50 px-5 py-2 rounded-xl">{selectedProduct.size}</div>
              </div>

              <div className="flex gap-3 mb-8">
                <button 
                  disabled={isOutOfStock}
                  onClick={() => addToCart(selectedProduct)}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-green-900 text-white hover:bg-green-800'}`}
                >
                  <ShoppingCart size={18} /> {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                </button>

                <button 
                  onClick={(e) => handleToggleWishlist(e, selectedProduct)}
                  className={`px-5 flex items-center justify-center border-2 rounded-xl transition-all ${isProductInWishlist ? 'border-red-100 bg-red-50 text-red-500' : 'border-gray-100 text-gray-300'}`}
                >
                  <Heart size={20} className={isProductInWishlist ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 border-y border-gray-100 py-5 mb-6">
                <div className="flex flex-col items-center text-center gap-1"><div className="text-green-800"><Droplets size={18} /></div><span className="text-[10px] font-bold text-gray-500 uppercase">Pure</span></div>
                <div className="flex flex-col items-center text-center gap-1"><div className="text-amber-700"><ShieldCheck size={18} /></div><span className="text-[10px] font-bold text-gray-500 uppercase">Safe</span></div>
                <div className="flex flex-col items-center text-center gap-1"><div className="text-green-800"><Leaf size={18} /></div><span className="text-[10px] font-bold text-gray-500 uppercase">Organic</span></div>
              </div>

              <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl">
                <h4 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-widest">Description</h4>
                {selectedProduct.description || "Authentic traditional product preserved naturally. Extracted using wood-pressed methods to ensure maximum nutrition and taste."}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- View: Marketplace Grid ---
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-100 py-6 px-6 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-serif text-green-900 mb-4">Our Marketplace</h1>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search wood-pressed oils..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-green-900/30 transition-all" 
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8 items-start w-full flex-1">
        
        {/* MOBILE CATEGORY DROPDOWN */}
        <div className="md:hidden w-full">
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl font-bold text-green-900 uppercase tracking-widest text-xs"
          >
            <div className="flex items-center gap-2">
              <Filter size={16} /> Filter: {selectedCategory}
            </div>
            {isMobileFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {isMobileFilterOpen && (
            <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
              {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => { setSelectedCategory(cat); setIsMobileFilterOpen(false); }} 
                  className={`w-full text-left py-3 px-4 rounded-xl text-xs font-bold uppercase transition-colors ${selectedCategory === cat ? 'bg-green-900 text-white' : 'text-gray-500 hover:bg-green-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block w-72 flex-shrink-0 sticky top-32">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-bold text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center"><Filter size={14} className="mr-3" /> Categories</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`w-full text-left font-bold text-xs uppercase tracking-wider py-4 px-5 rounded-2xl transition-all ${selectedCategory === cat ? 'bg-green-900 text-white shadow-lg shadow-green-900/20' : 'text-gray-500 hover:bg-green-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID */}
        <main className="flex-1 w-full">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => {
                const isProductInWishlist = isInWishlist(product.id);
                const isOutOfStock = product.stock_quantity <= 0;
                
                return (
                  <div 
                    key={product.id} 
                    onClick={() => setSelectedProduct(product)} 
                    className="group bg-white rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <Image src={product.img} alt={product.name} fill className="object-cover group-hover:scale-105 transition duration-1000" />
                      <button 
                        onClick={(e) => handleToggleWishlist(e, product)} 
                        className="absolute top-2 right-2 md:top-3 md:right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-300 hover:text-red-500 z-20"
                      >
                        <Heart size={16} className={isProductInWishlist ? "fill-red-500 text-red-500" : ""} />
                      </button>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[8px] md:text-[10px] font-black uppercase px-3 py-1.5 rounded shadow-lg">Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 md:p-6 flex flex-col flex-1">
                      <h3 className="font-serif text-sm md:text-base text-gray-800 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className="text-base md:text-xl font-black text-green-900">₹{product.price}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">{product.size}</span>
                      </div>
                      
                      {/* NEW: QUICK ADD BUTTON */}
                      <button 
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(product);
                        }}
                        className={`mt-4 w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                          isOutOfStock 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md active:scale-95'
                        }`}
                      >
                        <ShoppingCart size={16} /> {isOutOfStock ? 'Sold Out' : 'Quick Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}