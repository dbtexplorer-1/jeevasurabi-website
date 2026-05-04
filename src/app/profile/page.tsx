"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User, Camera, Lock, Phone, Mail, Edit3, Save, X,
  Eye, EyeOff, ChevronLeft, CheckCircle2, AlertCircle,
  Loader2, Shield, Bell, Package, Heart, LogOut, Trash2,
  RotateCcw, KeyRound, ArrowLeft, Calendar, ReceiptText, ExternalLink, MapPin
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Tab = "profile" | "security" | "orders" | "preferences";
type SecurityView = "main" | "forgot-phone" | "forgot-otp" | "forgot-newpassword" | "forgot-done";

interface Toast { message: string; type: "success" | "error"; }

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  img: string;
}

interface OrderItem {
  id: number;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function ProfileContent() {
  const { user, isLoggedIn, loading, logout, updateUser, isGoogleUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile States
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Forgot Password States
  const [secView, setSecView] = useState<SecurityView>("main");
  const [fpPhone, setFpPhone] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersFetched, setOrdersFetched] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null); // NEW: Cancel Order State

  // Preferences States
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [offerNotif, setOfferNotif] = useState(true);

  // Auto-switch tabs if directed from Navbar or Checkout
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "orders") {
      setActiveTab("orders");
    }
  }, [searchParams]);

  // Watch for context updates
  useEffect(() => {
    if (user) {
      setFullname(prev => prev || user.fullname || "");
      setEmail(prev => prev || user.email || "");
      setPhone(prev => prev || user.phone || "");
      setAvatarPreview(prev => prev || user.profilePic || null);
    }
  }, [user]);

  // Fetch Profile Info
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const fetchedName = data.full_name || data.fullname || "";
          setFullname(fetchedName);
          setEmail(data.email || "");
          setPhone(data.phone_number || "");
          setAvatarPreview(data.profile_pic || null);
          if (data.phone_number) setFpPhone(data.phone_number);
          
          updateUser({ fullname: fetchedName, email: data.email, phone: data.phone_number, profilePic: data.profile_pic });
        }
      } catch (err) { console.error("Failed to fetch profile", err); }
    };

    if (!loading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchProfile();
    }
  }, [loading, isLoggedIn, router]);

  // Lazy Load Orders
  useEffect(() => {
    if (activeTab === "orders" && !ordersFetched && isLoggedIn) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const token = localStorage.getItem("token") || localStorage.getItem("access_token");
          const res = await fetch(`${API_BASE}/my-orders`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to fetch orders");
          const data = await res.json();
          setOrders(data);
          setOrdersFetched(true);
        } catch (err: any) {
          setOrdersError(err.message || "Failed to load orders");
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, ordersFetched, isLoggedIn]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
      showToast("Image must be smaller than 2MB", "error"); 
      return; 
    }

    setIsUploading(true);
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/upload-profile-pic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarPreview(data.profile_pic);
        updateUser({ profilePic: data.profile_pic }); 
        showToast("Profile picture updated!", "success");
      } else {
        showToast("Failed to upload image", "error");
      }
    } catch (err) {
      showToast("Server unreachable", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullname.trim()) { showToast("Full name is required", "error"); return; }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          full_name: fullname.toUpperCase(), 
          email, 
          phone_number: phone, 
          profile_pic: avatarPreview 
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const fetchedName = d.full_name || d.fullname || "";
        updateUser({ fullname: fetchedName, email: d.email, phone: d.phone_number, profilePic: d.profile_pic });
        setAvatarPreview(d.profile_pic); 
        setEditingProfile(false);
        showToast("Profile updated successfully!", "success");
      } else showToast("Failed to update profile", "error");
    } catch { showToast("Server error", "error"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,16}$/;
    if (!passwordRegex.test(newPassword)) { showToast("Password must be 8-16 chars with a letter and a number", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    setSavingPassword(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.detail || "Failed to change password", "error"); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Password changed successfully!", "success");
    } catch { showToast("Network error", "error"); }
    finally { setSavingPassword(false); }
  };

  // --- NEW: Cancel Order Action ---
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrder(orderId);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Order cancelled successfully", "success");
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
      } else {
        const data = await res.json();
        showToast(data.detail || "Failed to cancel order", "error");
      }
    } catch (err) {
      showToast("Network error. Try again.", "error");
    } finally {
      setCancellingOrder(null);
    }
  };

  // Forgot Password Actions
  const fpGoTo = (v: SecurityView) => { setFpError(""); setSecView(v); };
  const handleFpSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setFpLoading(true); setFpError("");
    try {
      const res = await fetch(`${API_BASE}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: fpPhone }),
      });
      const data = await res.json();
      if (res.ok) fpGoTo("forgot-otp");
      else setFpError(data.detail || "Failed to send OTP");
    } catch { setFpError("Could not reach server. Try again."); }
    finally { setFpLoading(false); }
  };
  const handleFpVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fpOtp.length !== 6) { setFpError("Enter the 6-digit code"); return; }
    setFpLoading(true); setFpError("");
    try {
      const res = await fetch(`${API_BASE}/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: fpPhone, otp_code: fpOtp }),
      });
      const data = await res.json();
      if (res.ok) { setFpError(""); fpGoTo("forgot-newpassword"); }
      else setFpError(data.detail || "Invalid OTP");
    } catch { setFpError("Could not reach server. Try again."); }
    finally { setFpLoading(false); }
  };
  const handleFpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,16}$/;
    if (!passwordRegex.test(fpPassword)) { setFpError("Password must be 8-16 chars with a letter and a number"); return; }
    setFpLoading(true); setFpError("");
    try {
      const res = await fetch(`${API_BASE}/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: fpPhone, otp_code: fpOtp, new_password: fpPassword }),
      });
      const data = await res.json();
      if (res.ok) { setFpOtp(""); setFpPassword(""); fpGoTo("forgot-done"); }
      else {
        setFpError(data.detail || "Reset failed");
        if (data.detail?.toLowerCase().includes("otp")) fpGoTo("forgot-otp");
      }
    } catch { setFpError("Could not reach server. Try again."); }
    finally { setFpLoading(false); }
  };

  // Helper Functions
  const getInitials = () => {
    const n = fullname || user?.fullname || user?.email || "USER";
    return n.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', month: 'short', day: 'numeric', 
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

  const passwordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
    if (score <= 2) return { label: "Fair", color: "bg-amber-400", width: "50%" };
    if (score <= 3) return { label: "Good", color: "bg-blue-500", width: "70%" };
    return { label: "Strong", color: "bg-green-600", width: "100%" };
  };
  const pwStrength = passwordStrength(newPassword);
  const fpPwStrength = passwordStrength(fpPassword);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <Loader2 className="animate-spin text-green-900" size={36} />
    </div>
  );
  if (!isLoggedIn) return null;

  const tabs = [
    { id: "profile" as Tab, label: "My Profile", icon: <User size={18} /> },
    ...(!isGoogleUser ? [{ id: "security" as Tab, label: "Security", icon: <Shield size={18} /> }] : []),
    { id: "orders" as Tab, label: "Orders", icon: <Package size={18} /> },
    { id: "preferences" as Tab, label: "Preferences", icon: <Bell size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {toast && (
        <div className={`fixed top-24 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${toast.type === "success" ? "bg-green-800" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-green-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
            <ChevronLeft size={16} /> Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-xl bg-green-700 flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="animate-spin text-white" size={32} />
                ) : (
                  avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-3xl font-black text-white">{getInitials()}</span>
                  )
                )}
              </div>
              <button 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()} 
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                <Camera size={22} className="text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()} 
                className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-white rounded-full p-1.5 shadow-lg transition-colors"
              >
                <Camera size={12} />
              </button>
            </div>
            <div className="text-center sm:text-left pb-1">
              <h1 className="text-2xl font-serif font-bold uppercase tracking-wide">{fullname || user?.fullname || "MEMBER"}</h1>
              <p className="text-green-300 text-sm mt-0.5">{email || phone || user?.email || user?.phone || "MEMBER"}</p>
              {isGoogleUser && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-widest bg-white/10 text-green-200 px-2 py-1 rounded-full">
                  Google Account
                </span>
              )}
            </div>
            <div className="sm:ml-auto">
              <button onClick={logout} className="flex items-center gap-2 text-green-300 hover:text-red-400 transition-colors text-sm font-bold">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
          <div className="flex gap-1 mt-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSecView("main"); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-[#f5f4f0] text-green-900" : "text-green-300 hover:text-white hover:bg-white/10"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900 uppercase">Personal Information</h2>
                <p className="text-gray-500 text-sm mt-0.5">Manage your name, contact details, and photo</p>
              </div>
              {!editingProfile ? (
                <button onClick={() => setEditingProfile(true)} className="flex items-center gap-2 px-5 py-2.5 border-2 border-green-900 text-green-900 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors">
                  <Edit3 size={16} /> Edit
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setEditingProfile(false)} className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                    <X size={16} /> Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="flex items-center gap-2 px-5 py-2.5 bg-green-900 text-white rounded-xl font-bold text-sm hover:bg-green-800 transition-colors disabled:opacity-60">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                  </button>
                </div>
              )}
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center gap-6 p-6 bg-gray-50 rounded-2xl">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-green-100 flex items-center justify-center flex-shrink-0">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-green-900" size={24} />
                  ) : (
                    avatarPreview ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-2xl font-black text-green-800">{getInitials()}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Profile Photo</p>
                  <p className="text-gray-500 text-xs mb-3">JPG or PNG, max 2MB</p>
                  <div className="flex gap-3">
                    <button 
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-lg text-xs font-bold hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} 
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </button>
                    {avatarPreview && !isUploading && (
                      <button onClick={() => { setAvatarPreview(null); updateUser({ profilePic: "" }); }} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                {editingProfile ? (
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 uppercase transition-colors" placeholder="YOUR FULL NAME" />
                  </div>
                ) : <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800 uppercase">{fullname || user?.fullname || "NOT SET"}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                {editingProfile ? (
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="YOUR@EMAIL.COM" />
                  </div>
                ) : <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800">{email || user?.email || "NOT SET"}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                {editingProfile ? (
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="+91 00000 00000" />
                  </div>
                ) : <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800">{phone || user?.phone || "NOT SET"}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Type</label>
                <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isGoogleUser ? "bg-blue-500" : "bg-green-500"}`}></span>
                  {isGoogleUser ? "GOOGLE ACCOUNT" : "STANDARD ACCOUNT"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && !isGoogleUser && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 uppercase">Change Password</h2>
                <p className="text-gray-500 text-sm mt-0.5">Use a strong password (8-16 characters)</p>
              </div>
              <form onSubmit={handleChangePassword} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                      className="w-full pl-10 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password (8-16 characters)</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                      className="w-full pl-10 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                      </div>
                      <p className={`text-xs font-bold mt-1 uppercase ${pwStrength.label === "Strong" ? "text-green-600" : pwStrength.label === "Good" ? "text-blue-500" : "text-red-500"}`}>{pwStrength.label} PASSWORD</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      className={`w-full pl-10 pr-12 py-3.5 border-2 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 ${confirmPassword && confirmPassword !== newPassword ? "border-red-300 bg-red-50" : "border-gray-200"}`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-500 text-xs font-bold mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={savingPassword} className="flex items-center gap-2 px-8 py-3.5 bg-green-900 text-white rounded-xl font-bold text-sm hover:bg-green-800 uppercase tracking-widest disabled:opacity-60 transition-colors">
                  {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} Update Password
                </button>
              </form>
            </div>

            {/* FORGOT PASSWORD SECTION */}
            {secView === "main" && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Forgot Password?</p>
                    <p className="text-gray-500 text-xs mt-0.5">Reset via your phone number and OTP</p>
                  </div>
                </div>
                <button onClick={() => { setFpOtp(""); setFpPassword(""); setFpError(""); fpGoTo("forgot-phone"); }}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-amber-300 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors whitespace-nowrap">
                  <RotateCcw size={16} /> Reset Password
                </button>
              </div>
            )}

            {secView === "forgot-phone" && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-amber-100 flex items-center gap-3">
                  <button type="button" onClick={() => fpGoTo("main")} className="text-amber-700 hover:text-amber-900 transition-colors"><ArrowLeft size={18} /></button>
                  <div>
                    <h3 className="font-bold text-gray-900">Reset Password</h3>
                    <p className="text-gray-500 text-xs mt-0.5">We'll send a code to verify your identity</p>
                  </div>
                </div>
                <form onSubmit={handleFpSendOtp} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" value={fpPhone} onChange={(e) => setFpPhone(e.target.value)} required
                        className="w-full pl-10 pr-4 py-3.5 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none font-bold text-gray-900 bg-white" placeholder="+91 00000 00000" />
                    </div>
                  </div>
                  {fpError && <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-4 py-3 rounded-xl"><X size={14} className="shrink-0 mt-0.5" />{fpError}</div>}
                  <button type="submit" disabled={fpLoading} className="flex items-center gap-2 px-8 py-3.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 uppercase tracking-widest disabled:opacity-60 transition-colors">
                    {fpLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Send OTP
                  </button>
                </form>
              </div>
            )}

            {secView === "forgot-otp" && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-amber-100 flex items-center gap-3">
                  <button type="button" onClick={() => fpGoTo("forgot-phone")} className="text-amber-700 hover:text-amber-900 transition-colors"><ArrowLeft size={18} /></button>
                  <div>
                    <h3 className="font-bold text-gray-900">Verify Identity</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Code sent to <span className="font-bold">{fpPhone}</span></p>
                  </div>
                </div>
                <form onSubmit={handleFpVerifyOtp} className="p-6 space-y-4">
                  <input required type="text" inputMode="numeric" maxLength={6}
                    value={fpOtp} onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000"
                    className="w-full py-4 border-2 border-amber-200 rounded-xl outline-none focus:border-amber-500 text-center text-2xl font-black tracking-[0.5em] text-amber-700 bg-white" />
                  {fpError && <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-4 py-3 rounded-xl"><X size={14} className="shrink-0 mt-0.5" />{fpError}</div>}
                  <button type="submit" disabled={fpLoading} className="flex items-center gap-2 px-8 py-3.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 uppercase tracking-widest disabled:opacity-60 transition-colors">
                      {fpLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} Verify Code
                  </button>
                </form>
              </div>
            )}

            {secView === "forgot-newpassword" && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-amber-100 flex items-center gap-3">
                  <button type="button" onClick={() => fpGoTo("forgot-otp")} className="text-amber-700 hover:text-amber-900 transition-colors"><ArrowLeft size={18} /></button>
                  <div>
                    <h3 className="font-bold text-gray-900">Set New Password</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Must be 8-16 characters with letters and numbers</p>
                  </div>
                </div>
                <form onSubmit={handleFpReset} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="password" value={fpPassword} onChange={(e) => setFpPassword(e.target.value)} required
                        className="w-full pl-10 pr-4 py-3.5 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none font-bold text-gray-900 bg-white" placeholder="••••••••" />
                    </div>
                    {fpPassword && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${fpPwStrength.color}`} style={{ width: fpPwStrength.width }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{fpPwStrength.label} password</p>
                      </div>
                    )}
                  </div>
                  {fpError && <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-4 py-3 rounded-xl"><X size={14} className="shrink-0 mt-0.5" />{fpError}</div>}
                  <button type="submit" disabled={fpLoading} className="flex items-center gap-2 px-8 py-3.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 uppercase tracking-widest disabled:opacity-60 transition-colors">
                    {fpLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Reset Password
                  </button>
                </form>
              </div>
            )}

            {secView === "forgot-done" && (
              <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Password Reset!</h3>
                  <p className="text-gray-500 text-sm mt-1">Your password has been updated successfully.</p>
                </div>
                <button type="button" onClick={() => setSecView("main")} className="px-6 py-2.5 bg-green-900 text-white rounded-xl font-bold text-sm hover:bg-green-800 transition-colors uppercase tracking-widest">
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB INTEGRATION */}
        {activeTab === "orders" && (
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-100">
               <h2 className="text-xl font-bold text-gray-900 uppercase">My Orders</h2>
               <p className="text-gray-500 text-sm mt-0.5">Track and review your previous purchases</p>
             </div>

             <div className="p-6 md:p-8 bg-gray-50/30">
               {ordersLoading ? (
                 <div className="flex flex-col items-center justify-center py-16">
                   <Loader2 className="animate-spin text-green-900 mb-4" size={32} />
                   <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Loading Orders...</p>
                 </div>
               ) : ordersError ? (
                 <div className="flex flex-col items-center justify-center py-16 text-center">
                   <AlertCircle className="text-red-500 mb-4" size={32} />
                   <p className="text-gray-800 font-bold mb-2">{ordersError}</p>
                   <button onClick={() => setOrdersFetched(false)} className="text-green-900 underline text-xs font-bold uppercase">Try Again</button>
                 </div>
               ) : orders.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-16 text-center">
                   <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-6">
                     <ReceiptText size={32} className="text-gray-300" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase">No orders yet</h3>
                   <p className="text-gray-500 text-sm mb-8 max-w-xs">When you place an order, it will securely appear right here.</p>
                   <Link href="/shop" className="bg-green-900 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-green-800 uppercase tracking-widest">Start Shopping</Link>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {orders.map((order) => (
                     <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:border-green-900/30 transition-colors">
                       
                       {/* Order Header */}
                       <div className="bg-gray-50 p-5 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="grid grid-cols-2 md:flex md:gap-10 gap-y-4 text-sm">
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
                           {/* NEW: Cancel Order Button (Only for Pending or Processing orders) */}
                           {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing') && (
                              <button 
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingOrder === order.id}
                                className="text-[10px] font-bold text-red-600 uppercase hover:text-red-800 transition-colors flex items-center gap-1"
                              >
                                {cancellingOrder === order.id ? <Loader2 size={12} className="animate-spin"/> : <X size={12}/>}
                                Cancel Order
                              </button>
                           )}
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                             {order.status}
                           </span>
                         </div>
                       </div>

                       {/* Order Items */}
                       <div className="p-5 md:p-6 space-y-4">
                         {order.items.map((item, index) => (
                           <div key={index} className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                             <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                               <Image src={item.product.img} alt={item.product.name} fill className="object-cover" />
                             </div>
                             <div className="flex-1">
                               <h4 className="font-serif text-sm md:text-base text-gray-900 font-bold">{item.product.name}</h4>
                               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                 <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase">{item.product.size}</p>
                                 <p className="text-gray-500 text-xs">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></p>
                               </div>
                               {/* NEW: Product-specific "Buy Again" link */}
                               <Link href={`/shop/${item.product_id}`} className="text-[10px] text-green-900 font-bold uppercase hover:underline mt-2 inline-flex items-center gap-1">
                                 Buy Again <ExternalLink size={10} />
                               </Link>
                             </div>
                             <div className="text-right shrink-0">
                               <p className="font-bold text-gray-900">₹{item.price_at_purchase * item.quantity}</p>
                               <p className="text-[10px] text-gray-400 mt-1">₹{item.price_at_purchase} each</p>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Shipping Footer */}
                       <div className="bg-gray-50/50 p-5 border-t border-gray-100">
                         <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1 flex items-center gap-1">
                           <MapPin size={12} className="text-green-900" /> Shipping Address
                         </p>
                         <p className="text-xs font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                           {order.shipping_address}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === "preferences" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 uppercase">Notification Preferences</h2>
              <p className="text-gray-500 text-sm mt-0.5">Control how and when we reach you</p>
            </div>
            <div className="p-8 divide-y divide-gray-50">
              {[
                { label: "Email Notifications", desc: "Order confirmations and shipping updates", icon: <Mail size={20} />, value: emailNotif, set: setEmailNotif },
                { label: "SMS Alerts", desc: "OTP codes and urgent order updates", icon: <Phone size={20} />, value: smsNotif, set: setSmsNotif },
                { label: "Offers & Promotions", desc: "Deals, seasonal discounts, and new arrivals", icon: <Heart size={20} />, value: offerNotif, set: setOfferNotif },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-800">{item.icon}</div>
                    <div>
                      <p className="font-bold text-gray-900 uppercase">{item.label}</p>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => { item.set(!item.value); showToast(`${item.label} ${!item.value ? "enabled" : "disabled"}`, "success"); }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${item.value ? "bg-green-900" : "bg-gray-200"}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${item.value ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Wrapper to satisfy Next.js Suspense boundaries when using useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <Loader2 className="animate-spin text-green-900" size={36} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}