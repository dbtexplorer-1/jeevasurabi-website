"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Camera,
  Lock,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Bell,
  Package,
  Heart,
  LogOut,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Tab = "profile" | "security" | "orders" | "preferences";

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function ProfilePage() {
  const { user, isLoggedIn, loading, logout, updateUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [offerNotif, setOfferNotif] = useState(true);

  // 1. FETCH LATEST DATA FROM BACKEND (Ensures name shows up)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Sync with context and local state
          const mappedUser = {
            fullName: data.full_name,
            email: data.email,
            phone: data.phone_number,
            profilePic: data.profile_pic,
          };
          updateUser(mappedUser);
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setPhone(data.phone_number || "");
          setAvatarPreview(data.profile_pic || null);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    if (!loading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchProfile();
    }
  }, [loading, isLoggedIn, router]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be smaller than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showToast("Full name is required", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.toUpperCase(), // Save in Caps
          email: email,
          phone_number: phone,
          profile_pic: avatarPreview,
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        updateUser({
          fullName: updatedData.full_name,
          email: updatedData.email,
          phone: updatedData.phone_number,
          profilePic: updatedData.profile_pic,
        });
        setEditingProfile(false);
        showToast("Profile updated successfully!", "success");
      } else {
        showToast("Failed to update profile", "error");
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 2. STRICT PASSWORD RULES (8-16 chars + complexity)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      showToast("Password must be 8-16 characters with at least one letter and one number", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.detail || "Failed to change password", "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully!", "success");
    } catch {
      showToast("Network error", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = () => {
    const name = fullName || user?.fullName || "USER";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <Loader2 className="animate-spin text-green-900" size={36} />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "My Profile", icon: <User size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
    { id: "orders", label: "Orders", icon: <Package size={18} /> },
    { id: "preferences", label: "Preferences", icon: <Bell size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${toast.type === "success" ? "bg-green-800" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="bg-green-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
            <ChevronLeft size={16} /> Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-xl bg-green-700 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{getInitials()}</span>
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={22} className="text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-white rounded-full p-1.5 shadow-lg transition-colors">
                <Camera size={12} />
              </button>
            </div>

            <div className="text-center sm:text-left pb-1">
              {/* 3. NAME DISPLAYED IN CAPS */}
              <h1 className="text-2xl font-serif font-bold uppercase tracking-wide">
                {fullName || user?.fullName || "MEMBER"}
              </h1>
              <p className="text-green-300 text-sm mt-0.5">
                {email || phone || "MEMBER"}
              </p>
            </div>

            <div className="sm:ml-auto">
              <button onClick={logout} className="flex items-center gap-2 text-green-300 hover:text-red-400 transition-colors text-sm font-bold">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id ? "bg-[#f5f4f0] text-green-900" : "text-green-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
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
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-green-800">{getInitials()}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Profile Photo</p>
                  <p className="text-gray-500 text-xs mb-3">JPG or PNG, max 2MB</p>
                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-lg text-xs font-bold hover:bg-green-800 transition-colors">
                      <Camera size={14} /> Upload Photo
                    </button>
                    {avatarPreview && (
                      <button onClick={() => setAvatarPreview(null)} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
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
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value.toUpperCase())} className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 uppercase transition-colors" placeholder="YOUR FULL NAME" />
                  </div>
                ) : (
                  <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800 uppercase">{fullName || "NOT SET"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                {editingProfile ? (
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="YOUR@EMAIL.COM" />
                  </div>
                ) : (
                  <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800">{email || "NOT SET"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                {editingProfile ? (
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="+91 00000 00000" />
                  </div>
                ) : (
                  <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800">{phone || "NOT SET"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Type</label>
                <p className="py-3.5 px-4 bg-gray-50 rounded-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {user?.profilePic ? "GOOGLE ACCOUNT" : "STANDARD ACCOUNT"}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
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
                    <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full pl-10 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password (8-16 characters)</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full pl-10 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
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
                    <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`w-full pl-10 pr-12 py-3.5 border-2 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 ${confirmPassword && confirmPassword !== newPassword ? "border-red-300 bg-red-50" : "border-gray-200"}`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <button type="submit" disabled={savingPassword} className="flex items-center gap-2 px-8 py-3.5 bg-green-900 text-white rounded-xl font-bold text-sm hover:bg-green-800 uppercase tracking-widest disabled:opacity-60">
                  {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} Update Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ... Orders and Preferences tabs stay exactly as you had them ... */}
        {activeTab === "orders" && (
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-100">
               <h2 className="text-xl font-bold text-gray-900 uppercase">My Orders</h2>
               <p className="text-gray-500 text-sm mt-0.5">Track and manage your purchases</p>
             </div>
             <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                 <Package size={32} className="text-gray-300" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase">No orders yet</h3>
               <p className="text-gray-500 text-sm mb-8 max-w-xs">When you place an order, it will appear here.</p>
               <Link href="/shop" className="bg-green-900 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-green-800 uppercase tracking-widest">Start Shopping</Link>
             </div>
           </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 uppercase">Notification Preferences</h2>
              <p className="text-gray-500 text-sm mt-0.5">Control how and when we reach you</p>
            </div>
            <div className="p-8 space-y-0 divide-y divide-gray-50">
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
                  <button onClick={() => { item.set(!item.value); showToast(`${item.label} ${!item.value ? "enabled" : "disabled"}`, "success"); }} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${item.value ? "bg-green-900" : "bg-gray-200"}`}>
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