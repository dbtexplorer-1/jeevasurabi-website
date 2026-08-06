"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle, ChevronDown, ChevronLeft, ChevronUp, Filter, Heart,
  Leaf, Loader2, Search, ShoppingCart, Star,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { apiJson } from "@/lib/api";
import type { Product } from "@/types/api";

const categories = ["All", "Cold Pressed Oils", "Cosmetics", "Ghee & Natural Sweeteners", "Health Supplement", "Others"];

interface ProductFamily extends Product {
  variants: Product[];
}

function groupProducts(products: Product[]): ProductFamily[] {
  const families = new Map<string, Product[]>();
  for (const product of products) {
    const key = `${product.category.toLowerCase()}-${product.name.trim().toLowerCase()}`;
    families.set(key, [...(families.get(key) ?? []), product]);
  }

  return Array.from(families.values()).map((variants) => ({
    ...variants[0],
    variants,
  }));
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductFamily | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<ProductFamily | null>(null);
  const [quickAddVariantId, setQuickAddVariantId] = useState<number | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    apiJson<Product[]>("/products")
      .then(setProducts)
      .catch((fetchError) => {
        console.error(fetchError);
        setError("Unable to load products. Please ensure the backend is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProduct) window.scrollTo(0, 0);
  }, [selectedProduct]);

  const productFamilies = useMemo(() => groupProducts(products), [products]);
  const filteredProducts = useMemo(() => productFamilies.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [productFamilies, selectedCategory, searchQuery]);

  const openProduct = (product: ProductFamily) => {
    setSelectedProduct(product);
    setSelectedVariantId(product.variants[0]?.id ?? null);
  };

  const openQuickAdd = (event: React.MouseEvent, product: ProductFamily) => {
    event.stopPropagation();
    const availableVariant = product.variants.find((variant) => variant.stock_quantity > 0);
    if (!availableVariant) return;
    if (product.variants.length === 1) {
      addToCart(availableVariant);
      return;
    }
    setQuickAddProduct(product);
    setQuickAddVariantId(availableVariant.id);
  };

  if (loading) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9]"><Loader2 className="animate-spin text-green-900 mb-4" size={48} /><p className="text-gray-500 font-serif text-xl">Bringing you fresh products...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] px-4"><AlertCircle className="text-red-500 mb-4" size={48} /><p className="text-gray-800 font-bold text-center">{error}</p><button onClick={() => window.location.reload()} className="mt-4 text-green-900 underline font-bold">Try Again</button></div>;
  }

  if (selectedProduct) {
    const selectedVariant = selectedProduct.variants.find((variant) => variant.id === selectedVariantId) ?? selectedProduct.variants[0];
    const isOutOfStock = selectedVariant.stock_quantity <= 0;
    const isProductInWishlist = isInWishlist(selectedVariant.id);

    return (
      <div className="min-h-screen bg-white text-gray-900 pb-10">
        <div className="border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30 backdrop-blur-md"><div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500"><button onClick={() => setSelectedProduct(null)} className="flex items-center hover:text-green-900 transition-colors font-bold"><ChevronLeft size={16} className="mr-1" /> Back</button><span>/</span><span className="text-gray-900 font-semibold truncate">{selectedProduct.name}</span></div></div>

        <div className="max-w-[1100px] mx-auto px-4 py-6 md:py-10"><div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          <div className="w-full md:w-[45%] flex-shrink-0"><div className="rounded-3xl overflow-hidden bg-gray-50 aspect-square border border-gray-100 p-6 flex items-center justify-center max-h-[400px] md:max-h-[500px]"><div className="relative w-full h-full"><Image src={selectedVariant.img} alt={selectedProduct.name} fill className="object-contain" /></div></div></div>
          <div className="w-full md:w-[55%] pt-2">
            <p className="text-green-800 font-black tracking-widest uppercase text-[10px] mb-2 flex items-center gap-2"><Leaf size={12} /> {selectedProduct.category}</p>
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2 leading-tight">{selectedProduct.name}</h1>
            <div className="flex items-center gap-3 mb-4"><div className="flex text-amber-500"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div><span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Verified Product</span></div>
            <div className="mb-6 flex items-baseline gap-3"><span className="text-4xl font-black text-green-900">₹{selectedVariant.price}</span>{isOutOfStock && <span className="text-red-600 font-bold uppercase text-[10px] bg-red-50 px-2 py-1 rounded">Out of Stock</span>}</div>
            <div className="mb-6"><h3 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Size</h3><div className="flex flex-wrap gap-2">{selectedProduct.variants.map((variant) => <button key={variant.id} onClick={() => setSelectedVariantId(variant.id)} className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-colors ${selectedVariant.id === variant.id ? "border-green-900 bg-green-900 text-white" : variant.stock_quantity <= 0 ? "border-gray-100 bg-gray-50 text-gray-400" : "border-green-200 text-green-900 hover:border-green-900"}`}>{variant.size}</button>)}</div></div>
            <div className="flex gap-3 mb-8"><button disabled={isOutOfStock} onClick={() => addToCart(selectedVariant)} className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${isOutOfStock ? "bg-gray-200 text-gray-400" : "bg-green-900 text-white hover:bg-green-800"}`}><ShoppingCart size={18} /> {isOutOfStock ? "Sold Out" : "Add to Cart"}</button><button onClick={() => toggleWishlist(selectedVariant)} aria-label="Add selected size to wishlist" className={`px-5 flex items-center justify-center border-2 rounded-xl transition-all ${isProductInWishlist ? "border-red-500 bg-red-500 text-white" : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"}`}><Heart size={20} className={isProductInWishlist ? "fill-current" : ""} /></button></div>
            <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl"><h4 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-widest">Description</h4>{selectedVariant.description || selectedProduct.description || "Authentic traditional product preserved naturally. Extracted using wood-pressed methods to ensure maximum nutrition and taste."}</div>
          </div>
        </div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-100 py-6 px-6 shadow-sm sticky top-0 z-30"><div className="max-w-4xl mx-auto flex flex-col items-center"><h1 className="text-2xl font-serif text-green-900 mb-4">Our Marketplace</h1><div className="relative w-full max-w-xl"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search wood-pressed oils..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-green-900/30 transition-all" /></div></div></div>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8 items-start w-full flex-1">
        <div className="md:hidden w-full"><button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl font-bold text-green-900 uppercase tracking-widest text-xs"><span className="flex items-center gap-2"><Filter size={16} /> Filter: {selectedCategory}</span>{isMobileFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{isMobileFilterOpen && <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-2 shadow-xl">{categories.map((category) => <button key={category} onClick={() => { setSelectedCategory(category); setIsMobileFilterOpen(false); }} className={`w-full text-left py-3 px-4 rounded-xl text-xs font-bold uppercase ${selectedCategory === category ? "bg-green-900 text-white" : "text-gray-500 hover:bg-green-50"}`}>{category}</button>)}</div>}</div>
        <aside className="hidden md:block w-72 flex-shrink-0 sticky top-32"><div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100"><h3 className="font-bold text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center"><Filter size={14} className="mr-3" /> Categories</h3><div className="space-y-1">{categories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={`w-full text-left font-bold text-xs uppercase tracking-wider py-4 px-5 rounded-2xl transition-all ${selectedCategory === category ? "bg-green-900 text-white shadow-lg shadow-green-900/20" : "text-gray-500 hover:bg-green-50"}`}>{category}</button>)}</div></div></aside>
        <main className="flex-1 w-full">{filteredProducts.length === 0 ? <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Search size={48} className="mb-4 opacity-20" /><p className="font-bold uppercase tracking-widest text-sm">No products found</p></div> : <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">{filteredProducts.map((product) => {
          const defaultVariant = product.variants[0];
          const hasAvailableVariant = product.variants.some((variant) => variant.stock_quantity > 0);
          const isProductInWishlist = isInWishlist(defaultVariant.id);
          return <div key={product.id} onClick={() => openProduct(product)} className="group bg-white rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"><div className="relative aspect-square overflow-hidden bg-gray-50"><Image src={product.img} alt={product.name} fill className="object-cover group-hover:scale-105 transition duration-1000" /><button onClick={(event) => { event.stopPropagation(); toggleWishlist(defaultVariant); }} aria-label={`Add ${product.name} to wishlist`} className={`absolute top-2 right-2 md:top-3 md:right-3 p-2 bg-white rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors z-20 ${isProductInWishlist ? "bg-red-500 text-white" : ""}`}><Heart size={16} className={isProductInWishlist ? "fill-current" : ""} /></button>{!hasAvailableVariant && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center"><span className="bg-red-600 text-white text-[8px] md:text-[10px] font-black uppercase px-3 py-1.5 rounded shadow-lg">Sold Out</span></div>}</div><div className="p-4 md:p-6 flex flex-col flex-1"><h3 className="font-serif text-sm md:text-base text-gray-800 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">{product.name}</h3><div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50"><span className="text-base md:text-xl font-black text-green-900">₹{defaultVariant.price}</span><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">{product.variants.length > 1 ? `${product.variants.length} sizes` : defaultVariant.size}</span></div><button disabled={!hasAvailableVariant} onClick={(event) => openQuickAdd(event, product)} className={`mt-4 w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${hasAvailableVariant ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}><ShoppingCart size={16} /> {hasAvailableVariant ? "Quick Add" : "Sold Out"}</button></div></div>;
        })}</div>}</main>
      </div>
      {quickAddProduct && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button aria-label="Close size selector" onClick={() => setQuickAddProduct(null)} className="absolute inset-0 bg-black/50" /><div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="font-serif text-2xl text-green-900">Choose a size</h2><p className="mt-1 text-sm text-gray-500">{quickAddProduct.name}</p><div className="mt-6 grid gap-3">{quickAddProduct.variants.map((variant) => <button key={variant.id} disabled={variant.stock_quantity <= 0} onClick={() => setQuickAddVariantId(variant.id)} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-bold transition-colors ${quickAddVariantId === variant.id ? "border-green-900 bg-green-50 text-green-900" : "border-gray-100 text-gray-700"} disabled:cursor-not-allowed disabled:opacity-40`}><span>{variant.size}</span><span>₹{variant.price}</span></button>)}</div><button onClick={() => { const variant = quickAddProduct.variants.find((item) => item.id === quickAddVariantId); if (variant) addToCart(variant); setQuickAddProduct(null); }} className="mt-6 w-full rounded-xl bg-green-900 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-green-800">Add selected size</button></div></div>}
    </div>
  );
}
