"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, 
  MessageSquare, BarChart3, Settings, LogOut, 
  Search, Bell, ArrowUpRight, ArrowDownRight, MoreVertical, 
  Loader2, ShieldAlert, Plus, Edit3, Trash2, X, Save
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";

const API_BASE = typeof window !== "undefined" 
  ? `http://${window.location.hostname}:8000` 
  : "http://localhost:8000";

// --- Types ---
interface OrderItem {
  id: number;
  quantity: number;
  price_at_purchase: number;
  product: { name: string };
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}

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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isLoggedIn, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  // --- NEW: Product Editing States ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

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
          setProducts(prodData);
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

  // --- NEW: Handle Product Update Submission ---
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSavingProduct(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      
      // Send the updated product data to the backend
      const res = await fetch(`${API_BASE}/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(editingProduct)
      });

      if (!res.ok) {
        throw new Error("Failed to update product");
      }
      
      const updatedProduct = await res.json();
      
      // Instantly update the UI table
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      
      // Close the modal
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save product. Make sure you added the backend route!");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // --- Dynamic Dashboard Calculations ---
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending').length;

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, trend: "Live", positive: true },
    { label: "Total Orders", value: totalOrders.toString(), trend: "Live", positive: true },
    { label: "Pending Orders", value: pendingOrders.toString(), trend: "Action Req", positive: pendingOrders === 0 },
    { label: "Active Customers", value: "Protected", trend: "Secure", positive: true },
  ];

  // Helpers
  const extractName = (address: string) => address.split(',')[0] || "Customer";
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

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
            { name: 'Inquiries', icon: MessageSquare },
            { name: 'Analytics', icon: BarChart3 },
            { name: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.name ? 'bg-white text-green-900 shadow-lg' : 'text-green-100/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.name}
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
                <p className="text-sm font-bold text-gray-900 leading-none uppercase">{user?.fullName || "Admin"}</p>
                <p className="text-[10px] text-green-700 font-bold uppercase mt-1">Secure Connection</p>
              </div>
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Admin" className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-900 font-black">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
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
                      <p className="text-xs font-medium text-gray-600 truncate">{order.shipping_address}</p>
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

        {/* --- TAB VIEW: PRODUCTS (Inventory Management) --- */}
        {activeTab === 'Products' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 uppercase">Inventory</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-800 transition-colors">
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
                      <div className="w-12 h-12 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                        <Image src={product.img} alt={product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-green-900 transition-colors">{product.name}</p>
                        <p className="text-[10px] font-bold text-amber-700 uppercase mt-0.5">{product.size}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-black text-green-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      {product.stock_quantity <= 0 ? (
                        <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Out of Stock
                        </span>
                      ) : product.stock_quantity < 10 ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Low Stock ({product.stock_quantity})
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> In Stock ({product.stock_quantity})
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
                          onClick={(e) => { e.stopPropagation(); /* Delete logic later */ }} 
                          className="text-gray-400 hover:text-red-600 transition-colors p-2" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* --- EDIT PRODUCT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                  <input required type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <input required type="text" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Size / Weight</label>
                  <input required type="text" value={editingProduct.size} onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-black text-green-900" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    Stock Quantity
                    {editingProduct.stock_quantity <= 0 && <span className="text-red-500 text-[10px]">Out of Stock</span>}
                  </label>
                  <input required type="number" value={editingProduct.stock_quantity} onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value)})} 
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:border-green-900 outline-none font-black ${editingProduct.stock_quantity <= 0 ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-100 text-gray-900'}`} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image URL</label>
                  <input required type="text" value={editingProduct.img} onChange={(e) => setEditingProduct({...editingProduct, img: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-medium text-gray-700 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea rows={3} value={editingProduct.description || ""} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-medium text-gray-700 text-sm resize-none" />
                </div>

              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 uppercase tracking-widest text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingProduct} className="flex items-center gap-2 px-8 py-3 bg-green-900 text-white rounded-xl font-bold hover:bg-green-800 uppercase tracking-widest text-sm transition-colors disabled:opacity-70 shadow-lg">
                  {isSavingProduct ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}