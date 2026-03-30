"use client";
import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, 
  MessageSquare, BarChart3, Settings, LogOut, 
  Search, Bell, ArrowUpRight, ArrowDownRight, MoreVertical 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Mock data for the dashboard
  const stats = [
    { label: "Total Revenue", value: "₹1,24,500", trend: "+12.5%", positive: true },
    { label: "Total Orders", value: "142", trend: "+8.2%", positive: true },
    { label: "Active Customers", value: "892", trend: "-2.1%", positive: false },
    { label: "Pending Inquiries", value: "12", trend: "New", positive: true },
  ];

  const recentOrders = [
    { id: "#ORD-5542", customer: "Arun Kumar", product: "Coconut Oil (1L)", date: "Jan 9, 2026", status: "Delivered", amount: "₹500" },
    { id: "#ORD-5541", customer: "Priya Pillai", product: "Ghee (500ml)", date: "Jan 8, 2026", status: "Processing", amount: "₹420" },
    { id: "#ORD-5540", customer: "Senthil V.", product: "Gingelly Oil (500ml)", date: "Jan 8, 2026", status: "Shipped", amount: "₹240" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-green-950 text-white flex flex-col sticky top-0 h-screen">
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
                activeTab === item.name ? 'bg-white text-green-950 shadow-lg' : 'text-green-100/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center gap-4 px-4 py-3 text-red-400 font-bold text-sm hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search orders, customers..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-900/5 transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-green-900 transition-colors">
              <Bell size={24} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-50"></span>
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none">Admin Manager</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">JeevaSurabi Mill</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-900 font-bold">JS</div>
            </div>
          </div>
        </header>

        {/* PAGE TITLE */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-green-950 font-bold tracking-tight">{activeTab} Overview</h2>
          <p className="text-gray-400 text-sm mt-1">Welcome back, here is what is happening today.</p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{stat.label}</p>
              <div className="flex justify-between items-end">
                <h3 className="text-2xl font-black text-green-950">{stat.value}</h3>
                <span className={`text-xs font-bold flex items-center px-2 py-1 rounded-lg ${
                  stat.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                }`}>
                  {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* RECENT ORDERS TABLE */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-green-950">Recent Orders</h3>
            <button className="text-xs font-bold text-green-800 hover:underline uppercase tracking-widest">View All</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5 text-xs font-bold text-green-900">{order.id}</td>
                  <td className="px-6 py-5 text-sm font-medium">{order.customer}</td>
                  <td className="px-6 py-5 text-sm text-gray-500">{order.product}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'Processing' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-green-950">{order.amount}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-gray-300 group-hover:text-green-900 transition-colors"><MoreVertical size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}