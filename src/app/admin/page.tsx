"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, 
  MessageSquare, BarChart3, LogOut, 
  Search, Bell, ArrowUpRight, ArrowDownRight, 
  Loader2, ShieldAlert, Plus, Edit3, Trash2, X, Save, MapPin, UploadCloud
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import type { Order as ApiOrder, Product as ApiProduct } from "@/types/api";

const API_BASE = API_BASE_URL;

// --- Types ---
interface Product extends ApiProduct {
  in_stock: boolean;
}

type Order = ApiOrder;

// NEW: Inquiry Interface
interface Inquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isLoggedIn, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [inquiryStatusUpdating, setInquiryStatusUpdating] = useState<number | null>(null);

  // --- Product Editing States ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Custom Back Button Interceptor ---
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      router.push('/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  // Fetch Admin Data
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
      return;
    }

    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        
        // 1. Fetch Orders
        const orderRes = await fetch(`${API_BASE}/admin/orders`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (orderRes.status === 403) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }
        if (!orderRes.ok) throw new Error("Failed to fetch orders");
        const orderData = await orderRes.json();
        setOrders(orderData);

        // 2. Fetch Products
        const prodRes = await fetch(`${API_BASE}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.map((product: Omit<Product, "in_stock">) => ({
            ...product,
            in_stock: product.stock_quantity > 0,
          })));
        }

        // 3. Fetch Inquiries
        const inqRes = await fetch(`${API_BASE}/admin/inquiries`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (inqRes.ok) {
          const inqData = await inqRes.json();
          setInquiries(inqData);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) fetchAdminData();
  }, [authLoading, isLoggedIn, router]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setStatusUpdating(orderId);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setStatusUpdating(null);
    }
  };

  const updateInquiryStatus = async (inquiryId: number, newStatus: string) => {
    setInquiryStatusUpdating(inquiryId);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/admin/inquiries/${inquiryId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setInquiries(inquiries.map(i => i.id === inquiryId ? { ...i, status: newStatus } : i));
      }
    } catch (error) {
      console.error("Failed to update inquiry status", error);
    } finally {
      setInquiryStatusUpdating(null);
    }
  };

  // --- Image Upload Handler ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
      alert("Image must be smaller than 2MB"); 
      return; 
    }

    setIsUploadingImage(true);
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEditingProduct(prev => prev ? { ...prev, img: data.image_url } : null);
      } else {
        alert("Failed to upload image");
      }
    } catch (err) {
      alert("Server error during image upload");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSavingProduct(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const isNewProduct = editingProduct.id === 0;
      
      const url = isNewProduct 
        ? `${API_BASE}/admin/products` 
        : `${API_BASE}/admin/products/${editingProduct.id}`;
      
      const method = isNewProduct ? "POST" : "PUT";

      const productPayload = {
        name: editingProduct.name,
        category: editingProduct.category,
        size: editingProduct.size,
        price: editingProduct.price,
        img: editingProduct.img,
        in_stock: editingProduct.in_stock,
        description: editingProduct.description,
      };

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(productPayload)
      });

      if (!res.ok) throw new Error("Failed to save product");
      
      const savedProduct = await res.json();
      const savedProductWithStatus = {
        ...savedProduct,
        in_stock: savedProduct.stock_quantity > 0,
      };
      
      if (isNewProduct) {
        setProducts([...products, savedProductWithStatus]);
      } else {
        setProducts(products.map(p => p.id === savedProductWithStatus.id ? savedProductWithStatus : p));
      }
      
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save product.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm("Are you sure you want to completely delete this product? This cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Helpers
  const extractName = (address: string) => address.split(',')[0] || "Customer";
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  // --- Dynamic Dashboard Calculations ---
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending').length;
  const unreadInquiries = inquiries.filter(i => i.status.toLowerCase() === 'unread').length;

  const uniqueCustomers = Array.from(
    new Map(
      orders.map((o) => [
        extractName(o.shipping_address), 
        { 
          name: extractName(o.shipping_address), 
          address: o.shipping_address, 
          lastOrder: o.created_at, 
          orderCount: orders.filter(ord => extractName(ord.shipping_address) === extractName(o.shipping_address)).length,
          totalSpent: orders.filter(ord => extractName(ord.shipping_address) === extractName(o.shipping_address)).reduce((acc, curr) => acc + curr.total_amount, 0)
        }
      ])
    ).values()
  );

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, trend: "Live", positive: true },
    { label: "Total Orders", value: totalOrders.toString(), trend: "Live", positive: true },
    { label: "Pending Orders", value: pendingOrders.toString(), trend: "Action Req", positive: pendingOrders === 0 },
    { label: "Total Customers", value: uniqueCustomers.length.toString(), trend: "Growing", positive: true },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-red-100 text-red-700 border-red-200";
      case "processing": return "bg-amber-100 text-amber-700 border-amber-200";
      case "shipped": return "bg-blue-100 text-blue-700 border-blue-200";
      case "delivered": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <Loader2 className="animate-spin text-green-900" size={48} />
      </div>
    );
  }

  // SECURITY BLOCK SCREEN
  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f4f0] p-6 text-center">
        <ShieldAlert size={80} className="text-red-500 mb-6" />
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Access Denied</h1>
        <p className="text-gray-500 font-bold max-w-md mb-8">
          You do not have administrative privileges, or you are trying to access this panel from an unauthorized external network.
        </p>
        <button onClick={() => router.push("/")} className="px-8 py-4 bg-green-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-green-800 transition-colors">
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f4f0] text-gray-900 font-sans relative">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-green-900 text-white flex flex-col sticky top-0 h-screen z-10">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-xl font-serif font-bold tracking-tighter uppercase">JS Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Orders', icon: ShoppingBag },
            { name: 'Products', icon: Package },
            { name: 'Customers', icon: Users },
            { name: 'Inquiries', icon: MessageSquare, badge: unreadInquiries },
            { name: 'Analytics', icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.name ? 'bg-white text-green-900 shadow-lg' : 'text-green-100/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} />
                {item.name}
              </div>
              {(item.badge ?? 0) > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === item.name ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 text-red-300 font-bold text-sm hover:bg-red-500/20 rounded-xl transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search orders, products..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-green-900 transition-all outline-none text-sm font-bold"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-green-900 transition-colors">
              <Bell size={24} />
              {pendingOrders > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f5f4f0]"></span>
              )}
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none uppercase">{user?.fullname || "Admin"}</p>
                <p className="text-[10px] text-green-700 font-bold uppercase mt-1">Secure Connection</p>
              </div>
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Admin" className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-900 font-black">
                  {user?.fullname ? user.fullname.charAt(0).toUpperCase() : "A"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE TITLE */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-green-900 font-bold tracking-tight">{activeTab} Overview</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Manage and monitor your business metrics.</p>
        </div>

        {/* --- TAB VIEW: DASHBOARD --- */}
        {activeTab === 'Dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{stat.label}</p>
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center px-2 py-1 rounded-lg ${
                      stat.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}>
                      {stat.positive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 uppercase">Recent Orders</h3>
                <button onClick={() => setActiveTab('Orders')} className="text-xs font-bold text-green-900 hover:underline uppercase tracking-widest">View All</button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-5 text-xs font-black text-green-900">#ORD-{order.id.toString().padStart(4, '0')}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-800">{extractName(order.shipping_address)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-gray-900">₹{order.total_amount}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB VIEW: ORDERS --- */}
        {activeTab === 'Orders' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Status Update</th>
                  <th className="px-6 py-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-green-900">#ORD-{order.id.toString().padStart(4, '0')}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <p key={item.id} className="text-xs font-bold text-gray-700">
                            {item.quantity}x {item.product.name}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <p className="text-xs font-medium text-gray-600 whitespace-pre-wrap">{order.shipping_address}</p>
                    </td>
                    <td className="px-6 py-5">
                      {statusUpdating === order.id ? (
                        <Loader2 className="animate-spin text-green-900" size={20} />
                      ) : (
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-black uppercase tracking-wider outline-none cursor-pointer px-3 py-1.5 rounded-xl border ${getStatusColor(order.status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-gray-900">₹{order.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB VIEW: PRODUCTS --- */}
        {activeTab === 'Products' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 uppercase">Inventory</h3>
              <button 
                onClick={() => setEditingProduct({ id: 0, name: "", category: "", size: "", price: 0, img: "", stock_quantity: 0, in_stock: true, description: "" })}
                className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-800 transition-colors"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => setEditingProduct(product)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                        {product.img ? (
                          <img 
                            src={product.img} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image" }}
                          />
                        ) : (
                          <Package className="text-gray-300" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-green-900 transition-colors">{product.name}</p>
                        <p className="text-[10px] font-bold text-amber-700 uppercase mt-0.5">{product.size}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-black text-green-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      {!product.in_stock ? (
                        <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Out of Stock
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }} 
                          className="text-gray-400 hover:text-blue-600 transition-colors p-2" 
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} 
                          className="text-gray-400 hover:text-red-600 transition-colors p-2" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                       No products in inventory
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB VIEW: CUSTOMERS --- */}
        {activeTab === 'Customers' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900 uppercase">Customer Database</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Automatically derived from completed orders.</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Shipping Location</th>
                  <th className="px-6 py-4">Total Orders</th>
                  <th className="px-6 py-4">Lifetime Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {uniqueCustomers.map((customer, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-gray-900">{customer.name}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-medium text-gray-600 max-w-xs truncate flex items-center gap-1">
                        <MapPin size={12} className="text-green-800" /> {customer.address}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-green-50 text-green-800 font-bold rounded-full text-xs">
                        {customer.orderCount} Order{customer.orderCount !== 1 && 's'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-gray-900">₹{customer.totalSpent}</td>
                  </tr>
                ))}
                {uniqueCustomers.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-10 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                       No customers yet
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB VIEW: INQUIRIES --- */}
        {activeTab === 'Inquiries' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 uppercase">Customer Inquiries</h3>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                {unreadInquiries} Unread
              </span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4 w-1/3">Message</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className={`hover:bg-gray-50 transition-colors group ${inquiry.status === 'Unread' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-gray-500">{formatDate(inquiry.created_at)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-gray-900">{inquiry.name}</p>
                      <a href={`mailto:${inquiry.email}`} className="text-[10px] font-bold text-amber-700 uppercase mt-1 hover:underline">{inquiry.email}</a>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-medium text-gray-600 line-clamp-3">{inquiry.message}</p>
                    </td>
                    <td className="px-6 py-5">
                      {inquiryStatusUpdating === inquiry.id ? (
                        <Loader2 className="animate-spin text-green-900" size={20} />
                      ) : (
                        <select 
                          value={inquiry.status}
                          onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                          className={`text-xs font-black uppercase tracking-wider outline-none cursor-pointer px-3 py-1.5 rounded-xl border ${
                            inquiry.status === 'Unread' ? 'bg-red-50 text-red-700 border-red-200' :
                            inquiry.status === 'Read' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          <option value="Unread">Unread</option>
                          <option value="Read">Read</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-10 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                       No inquiries found
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB VIEW: ANALYTICS --- */}
        {activeTab === 'Analytics' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
             <h3 className="text-lg font-bold text-gray-900 uppercase mb-6">Performance & Traffic</h3>
             
             <div className="h-72 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 border-dashed">
                  <BarChart3 className="text-green-900/20 mb-4" size={48}/>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Advanced Analytics Module</span>
                  <span className="text-gray-400 font-medium text-xs mt-2">Integration pending deployment</span>
             </div>
          </div>
        )}

      </main>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <form onSubmit={handleUpdateProduct} className="flex flex-col max-h-[90vh]">
              
              {/* MODAL HEADER */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 sticky top-0 z-10 shrink-0">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">
                  {editingProduct.id === 0 ? "Add New Product" : "Edit Product"}
                </h3>
                
                {/* TOP RIGHT ACTION BUTTONS */}
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={isSavingProduct || isUploadingImage} className="flex items-center gap-2 px-5 py-2.5 bg-green-900 text-white rounded-xl font-bold hover:bg-green-800 uppercase tracking-widest text-xs transition-colors shadow-sm disabled:opacity-70">
                    {isSavingProduct ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-red-600 bg-white p-2.5 rounded-full shadow-sm border border-gray-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {/* MODAL BODY */}
              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                    <input required type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} 
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="e.g. Wood Pressed Groundnut Oil" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                    <input required type="text" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} 
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="e.g. Oils" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Size / Weight</label>
                    <input required type="text" value={editingProduct.size} onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})} 
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="e.g. 1 Liter" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input required type="number" step="0.01" min="0" value={editingProduct.price || ""} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} 
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-black text-green-900" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock Status</label>
                    <select
                      value={editingProduct.in_stock ? "in_stock" : "out_of_stock"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.value === "in_stock" })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-green-900 outline-none font-bold ${editingProduct.in_stock ? 'border-green-200 text-green-800 bg-green-50' : 'border-red-300 text-red-600 bg-red-50'}`}
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  {/* CUSTOM IMAGE UPLOAD UI */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Image</label>
                    <div className="flex items-center gap-4">
                      
                      {/* Image Preview Box */}
                      <div className="w-16 h-16 rounded-xl border-2 border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                         {isUploadingImage ? (
                           <Loader2 size={20} className="animate-spin text-green-900" />
                         ) : editingProduct.img ? (
                           <img 
                             src={editingProduct.img} 
                             alt="preview" 
                             className="w-full h-full object-cover" 
                             onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image" }}
                           />
                         ) : (
                           <Package size={20} className="text-gray-300" />
                         )}
                      </div>
                      
                      <div className="flex-1">
                        {/* Hidden file input */}
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        
                        {/* Upload Button */}
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={isUploadingImage} 
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-900 font-bold text-xs uppercase tracking-widest rounded-lg border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 mb-2"
                        >
                          <UploadCloud size={14} /> Upload New Image
                        </button>
                        
                        {/* Read-Only URL Box */}
                        <input 
                          readOnly 
                          type="text" 
                          value={editingProduct.img} 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 outline-none font-medium text-gray-500 text-[10px]" 
                          placeholder="Image URL will appear here after upload..." 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea rows={3} value={editingProduct.description || ""} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} 
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-medium text-gray-700 text-sm resize-none" placeholder="Product details..." />
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
