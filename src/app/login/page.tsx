"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, Phone, X, User, CheckCircle2, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

export default function SignInPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Login State (Phone + Password)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup State (Phone + OTP)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [signupPhone, setSignupPhone] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const API_BASE = "http://localhost:8000";

  // --- HANDLER: GOOGLE LOGIN ---
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        // Fix: Uses the full_name returned from Google via backend
        authLogin(data.access_token, data.full_name || "Member");
      } else {
        alert("Google Login Failed: " + data.detail);
      }
    } catch (err) {
      alert("Could not connect to server for Google Login");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: PHONE LOGIN ---
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginPhone); 
      formData.append('password', loginPassword);

      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        authLogin(data.access_token, loginPhone);
      } else {
        alert(data.detail || "Incorrect phone or password");
      }
    } catch (err) {
      alert("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: SEND OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: signupPhone }),
      });
      if (res.ok) {
        setIsVerifyingOtp(true);
        alert("OTP sent! Please check your backend terminal.");
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to send OTP");
      }
    } catch (err) {
      alert("Server error while sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: VERIFY & SIGNUP (Auto-Login Enabled) ---
  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp-and-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: signupPhone,
          otp_code: otpCode,
          full_name: signupName,
          password: signupPassword
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Fix: Automatically log in the user using the token returned by backend
        authLogin(data.access_token, signupName);
        setIsSignupModalOpen(false);
        setIsVerifyingOtp(false);
      } else {
        alert(data.detail || "Verification failed");
      }
    } catch (err) {
      alert("Server error during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden md:flex md:w-1/2 bg-green-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30">
           <img src="/loginbg.jpg" alt="BG" className="w-full h-full object-cover"/>
        </div>
        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-6xl font-serif mb-6 leading-tight">JEEVASURABI</h2>
          <p className="text-xl text-green-100 font-light mb-10">Reviving traditional wellness through wood-pressed purity.</p>
          <div className="space-y-4">
             {['Fast Home Delivery', '100% Pure Oils'].map((t, i) => (
               <div key={i} className="flex items-center space-x-3">
                 <CheckCircle2 size={20} className="text-yellow-500" />
                 <span className="font-medium">{t}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="flex-1 flex flex-col px-8 md:px-24 py-16 justify-center relative bg-white">
        <Link href="/" className="absolute top-10 left-8 md:left-24 flex items-center space-x-2 text-gray-400 hover:text-green-900 transition-colors font-bold uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> <span>Back to Home</span>
        </Link>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-4xl font-serif text-green-900 mb-2">Sign In</h1>
          <p className="text-gray-500 mb-8">Access your account via Phone or Google</p>

          <div className="w-full mb-8 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google Login Failed")}
              useOneTap
              theme="outline"
              shape="pill"
              width="320"
            />
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or login with phone</span>
          </div>
          
          <form className="space-y-6" onSubmit={handlePhoneLogin}>
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                required
                type="tel" 
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="Phone Number (+91...)" 
                className="w-full pl-14 pr-6 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/5 transition-all text-gray-900 font-medium" 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                required
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password" 
                className="w-full pl-14 pr-6 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/5 transition-all text-gray-900 font-medium" 
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-green-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-green-800 transition flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
            </button>
          </form>

          <p className="mt-12 text-center text-gray-500 font-medium">
            New to Jeevasurabi? 
            <button onClick={() => setIsSignupModalOpen(true)} className="ml-2 text-green-900 font-bold hover:underline">
              Register with Phone OTP
            </button>
          </p>
        </div>
      </div>

      {/* --- PHONE SIGNUP MODAL (Enhanced Contrast & Logic) --- */}
      {isSignupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setIsSignupModalOpen(false); setIsVerifyingOtp(false); }} />
          
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-2xl font-serif text-green-900 tracking-tight">
                {isVerifyingOtp ? "Verify Phone" : "Create Account"}
              </h2>
              <button onClick={() => setIsSignupModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="p-8">
              <form className="space-y-5" onSubmit={isVerifyingOtp ? handleVerifySignup : handleSendOtp}>
                {!isVerifyingOtp ? (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required 
                        type="text" 
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Full Name" 
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl outline-none focus:border-green-900 transition-all font-bold text-gray-900 placeholder-gray-400 bg-white" 
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required 
                        type="tel" 
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="Phone Number (+91...)" 
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl outline-none focus:border-green-900 transition-all font-bold text-gray-900 placeholder-gray-400 bg-white" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4 font-medium">Enter the code sent to your terminal for <b>{signupPhone}</b></p>
                    <div className="relative text-center">
                      <input 
                        required 
                        type="text" 
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000" 
                        className="w-full py-4 border border-gray-200 rounded-xl outline-none focus:border-green-900 text-center text-2xl font-black tracking-[0.5em] text-green-900 bg-gray-50" 
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required 
                        type="password" 
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create Password" 
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl outline-none focus:border-green-900 transition-all font-bold text-gray-900 placeholder-gray-400 bg-white" 
                      />
                    </div>
                  </>
                )}

                <button 
                  disabled={loading}
                  className="w-full bg-green-900 text-white py-5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-green-800 transition-all flex items-center justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (isVerifyingOtp ? "Verify & Register" : "Send OTP")}
                </button>
                
                {isVerifyingOtp && (
                  <button 
                    type="button"
                    onClick={() => setIsVerifyingOtp(false)}
                    className="w-full text-center text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-green-900 transition-colors"
                  >
                    Back to Edit Number
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}