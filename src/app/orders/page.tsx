"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Package, ChevronLeft, Loader2, AlertCircle, 
  MapPin, Calendar, ReceiptText, ExternalLink
} from "lucide-react";

// Dynamically determine the API base URL
const API_BASE = typeof window !== "undefined" 
  ? `http://${window.location.hostname}:8000` 
  : "http://localhost:8000";

// --- Types matching the backend schema ---
interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  img: string;
}

interface OrderItem {
  id: int;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product: Product;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!token) throw new Error("No authentication token found");

        const res = await fetch(`${API_BASE}/my-orders`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch orders");
        
        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong while fetching your orders.");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchOrders();
    }
  }, [authLoading, isLoggedIn, router]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped": return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <Loader2 className="animate-spin text-green-900" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f4f0] px-4">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-gray-800 font-bold text-center mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-green-900 underline font-bold uppercase tracking-widest text-xs">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/profile" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-green-900 transition-colors flex items-center gap-1">
            <ChevronLeft size={14} /> Back to Profile
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-900 shadow-sm border border-gray-100">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-green-900 uppercase">My Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Track and review your previous purchases</p>
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ReceiptText size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-widest">No Orders Yet</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">You haven't placed any orders with us. Start exploring our traditional wood-pressed oils!</p>
            <Link href="/shop" className="bg-green-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-green-800 uppercase tracking-widest transition-colors shadow-lg">
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Order List */
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                
                {/* Order Header */}
                <div className="bg-gray-50 p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 md:flex md:gap-12 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1 flex items-center gap-1"><ReceiptText size={12}/> Order ID</p>
                      <p className="font-black text-gray-900">#ORD-{order.id.toString().padStart(4, '0')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1 flex items-center gap-1"><Calendar size={12}/> Date Placed</p>
                      <p className="font-bold text-gray-900">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Total Amount</p>
                      <p className="font-black text-green-900 text-lg">₹{order.total_amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-gray-200 md:border-0">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 md:p-8 space-y-6">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 md:gap-6 border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                        <Image src={item.product.img} alt={item.product.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-sm md:text-base text-gray-900 font-bold">{item.product.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                          <p className="text-[10px] md:text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase">{item.product.size}</p>
                          <p className="text-gray-500 text-xs">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">₹{item.price_at_purchase * item.quantity}</p>
                        <p className="text-[10px] text-gray-400 mt-1">₹{item.price_at_purchase} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer / Shipping Details */}
                <div className="bg-gray-50/50 p-6 md:p-8 border-t border-gray-100 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2 flex items-center gap-1">
                      <MapPin size={12} className="text-green-900" /> Shipping Address
                    </p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-lg">
                      {order.shipping_address}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-end">
                    <Link href={`/shop`} className="text-xs font-bold text-green-900 uppercase tracking-widest hover:text-green-700 flex items-center gap-1 transition-colors">
                      Buy Again <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}