"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, Phone, X, User, CheckCircle2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignInPage() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');

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
          <p className="text-gray-500 mb-8">Access your member account</p>

          {/* GOOGLE SIGN IN - UNTOUCHABLE */}
          <button className="w-full flex items-center justify-center space-x-4 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition shadow-sm mb-8 group">
            <GoogleIcon />
            <span className="font-bold text-gray-700 group-hover:text-green-900">Continue with Google</span>
          </button>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or login with email</span>
          </div>
          
          <form className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-14 pr-6 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/5 transition-all text-gray-900 placeholder-gray-400 font-medium" 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full pl-14 pr-6 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/5 transition-all text-gray-900 placeholder-gray-400 font-medium" 
              />
            </div>
            <button className="w-full bg-green-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-green-800 transition">
              Sign In
            </button>
          </form>

          <p className="mt-12 text-center text-gray-500 font-medium">
            New to Jeevesurabi? 
            <button onClick={() => setIsSignupModalOpen(true)} className="ml-2 text-green-900 font-bold hover:underline">
              Create an Account
            </button>
          </p>
        </div>
      </div>

      {/* --- CREATE ACCOUNT MODAL --- */}
      {isSignupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSignupModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-2xl font-serif text-green-900 tracking-tight">Create Account</h2>
              <button onClick={() => setIsSignupModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="p-8">
              <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                <button onClick={() => setSignupMethod('email')} className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${signupMethod === 'email' ? 'bg-white text-green-900 shadow-sm' : 'text-gray-500'}`}>Email</button>
                <button onClick={() => setSignupMethod('phone')} className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${signupMethod === 'phone' ? 'bg-white text-green-900 shadow-sm' : 'text-gray-500'}`}>Phone</button>
              </div>

              <form className="space-y-5">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:border-green-900 outline-none text-gray-900 placeholder-gray-400 font-medium" />
                </div>

                {signupMethod === 'email' ? (
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:border-green-900 outline-none text-gray-900 placeholder-gray-400 font-medium" />
                  </div>
                ) : (
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="tel" placeholder="+91 00000 00000" className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:border-green-900 outline-none text-gray-900 placeholder-gray-400 font-medium" />
                  </div>
                )}

                <button className="w-full bg-green-900 text-white py-5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-green-800 transition-all mt-4">
                  Send OTP to Verify
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}