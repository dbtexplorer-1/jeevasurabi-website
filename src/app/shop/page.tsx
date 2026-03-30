"use client";
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Filter, Search, ChevronLeft, Star, ShieldCheck, Leaf, Droplets, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  price: number;
  img: string;
  quantity?: number;
  description?: string;
}

const allProducts: Product[] = [
  { id: 1, name: "Cold Pressed Coconut oil", category: "Cold Pressed Oils", size: "1 Litre", price: 500, img: "/coconut.png", description: "Extracted from premium quality coconuts using traditional wooden ghanis. Free from chemical processing, our coconut oil retains all natural nutrients, aroma, and flavor." },
  { id: 2, name: "Cold Pressed Coconut oil", category: "Cold Pressed Oils", size: "500 ml", price: 250, img: "/coconut.png" },
  { id: 3, name: "Cold Pressed Gingelly oil", category: "Cold Pressed Oils", size: "1 Litre", price: 480, img: "/gingelly.png", description: "Made from carefully selected sesame seeds and palm jaggery. Cold-pressed to perfection, maintaining the authentic traditional taste and nutritional benefits." },
  { id: 4, name: "Cold Pressed Gingelly oil", category: "Cold Pressed Oils", size: "500 ml", price: 240, img: "/gingelly.png" },
  { id: 5, name: "Cold Pressed Groundnut oil", category: "Cold Pressed Oils", size: "1 Litre", price: 320, img: "/groundnut.png", description: "Pure, unrefined groundnut oil pressed in a traditional Mara Chekku. Perfect for deep frying and everyday cooking, giving your food a rich, authentic flavor." },
  { id: 6, name: "Cold Pressed Groundnut oil", category: "Cold Pressed Oils", size: "500 ml", price: 160, img: "/groundnut.png" },
  { id: 7, name: "Hand Made Soap", category: "Cosmetics", size: "100g", price: 50, img: "/handmade-soap.jpg" },
  { id: 8, name: "Ghee", category: "Ghee & Natural Sweeteners", size: "500 ml", price: 420, img: "/jeevasurabi-ghee.jpg", description: "A2 Desi Cow Ghee made using the traditional Bilona method. Cultured from A2 milk curd, slowly churned to extract makkhan, and gently heated to create golden, aromatic ghee." },
  { id: 9, name: "Ghee", category: "Ghee & Natural Sweeteners", size: "200 ml", price: 180, img: "/jeevasurabi-ghee.jpg" },
  { id: 10, name: "Honey", category: "Ghee & Natural Sweeteners", size: "1kg bottle", price: 440, img: "/honey-jeevasurabi-food-products.jpg", description: "100% pure, raw, and unfiltered honey sourced directly from deep forest bee keepers. Rich in antioxidants and natural enzymes." },
  { id: 11, name: "Honey", category: "Ghee & Natural Sweeteners", size: "500g", price: 230, img: "/honey-jeevasurabi-food-products.jpg" },
  { id: 12, name: "Honey", category: "Ghee & Natural Sweeteners", size: "250g", price: 120, img: "/honey-jeevasurabi-food-products.jpg" },
  { id: 13, name: "Karupatti Palm Jaggery", category: "Ghee & Natural Sweeteners", size: "500 grams", price: 190, img: "/karuppatti-jeevasurabi-food-products.jpg" },
  { id: 14, name: "Naatusarkarai", category: "Ghee & Natural Sweeteners", size: "500 grams", price: 50, img: "/naatusarkarai-jeevasurabi-food-products.jpg" },
  { id: 15, name: "Panangarkandu Palm Sugar 1st grade", category: "Ghee & Natural Sweeteners", size: "200 grams", price: 160, img: "/panangarkandu.jpg" },
  { id: 16, name: "Panangarkandu Palm Sugar 2nd grade", category: "Ghee & Natural Sweeteners", size: "200 grams", price: 120, img: "/panangarkandu.jpg" },
  { id: 17, name: "Biozen", category: "Health Supplement", size: "400 ml", price: 650, img: "/biozen.jpg" },
  { id: 18, name: "Health Mix", category: "Health Supplement", size: "250 grams", price: 120, img: "/healthmix.jpg" },
  { id: 19, name: "Rock salt", category: "Others", size: "500 grams", price: 50, img: "/rock-salt.jpg" }
];

const categories = ["All", "Cold Pressed Oils", "Cosmetics", "Ghee & Natural Sweeteners", "Health Supplement", "Others"];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { addToCart } = useCart();
  const { toggleWishlist: contextToggleWishlist, isInWishlist } = useWishlist();

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); 
    // Cast to any to match WishlistContext's expected structure if needed
    contextToggleWishlist(product as any);
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // View: Product Detail Page
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

  // View: Marketplace Grid (Original View)
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-serif text-green-900 mb-4">Our Marketplace</h1>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-800 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-900/5 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-10 items-start">
        {/* Sticky Sidebar */}
        <aside className="w-full md:w-72 flex-shrink-0 md:sticky md:top-40 z-20">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar">
            <h3 className="font-bold text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center">
              <Filter size={14} className="mr-3" /> Filter Categories
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left font-bold text-sm uppercase tracking-wider py-4 px-5 rounded-2xl transition-all ${
                    selectedCategory === cat ? 'bg-green-900 text-white' : 'text-gray-500 hover:bg-green-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => {
              const isProductInWishlist = isInWishlist(product.id);
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  className="group bg-white rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-500 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image src={product.img} alt={product.name} fill className="object-cover group-hover:scale-105 transition duration-1000" />
                    
                    {/* Floating Wishlist Button on Image */}
                    <button 
                      onClick={(e) => handleToggleWishlist(e, product)}
                      title={isProductInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      className="absolute top-3 right-3 p-2.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all z-20 active:scale-90"
                    >
                      <Heart size={18} className={isProductInWishlist ? "fill-red-500 text-red-500" : ""} />
                    </button>

                    {/* Quick Add Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        addToCart(product);
                      }}
                      className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 bg-white/95 backdrop-blur-md text-green-900 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 active:scale-95 z-10 hover:bg-green-900 hover:text-white"
                    >
                      Quick Add
                    </button>
                  </div>
                  <div className="p-4 md:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-serif text-sm md:text-lg text-gray-800 leading-tight mb-2 group-hover:text-green-800 transition-colors">{product.name}</h3>
                      <p className="text-xs md:text-sm font-bold text-amber-700 bg-amber-50 inline-block px-2 md:px-3 py-1 rounded-md md:rounded-lg uppercase tracking-wider mb-3 md:mb-4">
                        {product.size}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                      <span className="text-lg md:text-2xl font-black text-green-900">₹{product.price}</span>
                    </div>
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