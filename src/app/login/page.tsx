"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Lock, ArrowLeft, Phone, User, CheckCircle2, Loader2,
  KeyRound, MessageSquare, ChevronRight, X, RotateCcw,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:8000";

type View =
  | "landing"
  | "signin-choose"
  | "signin-password"
  | "signin-otp-send"
  | "signin-otp-verify"
  | "signup-details"
  | "signup-otp"
  | "signup-password"
  | "forgot-phone"
  | "forgot-otp"
  | "forgot-newpassword"
  | "forgot-done";

export default function LoginPage() {
  const { login: authLogin } = useAuth();
  const [view, setView] = useState<View>("landing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const clearError = () => setError("");
  const goTo = (v: View) => { setError(""); setView(v); };

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) authLogin(data.access_token, data.full_name || "Member", "google");
      else setError(data.detail || "Google sign-in failed");
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  // ── Sign in: password ─────────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearError();
    try {
      const form = new URLSearchParams();
      form.append("username", phone);
      form.append("password", password);
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const data = await res.json();
      if (res.ok) authLogin(data.access_token, data.full_name || phone, "phone");
      else setError(data.detail || "Incorrect phone or password");
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  // ── Sign in: OTP ─────────────────────────────────────────────────────────
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json();
      if (res.ok) goTo("signin-otp-verify");
      else setError(data.detail || "Failed to send OTP");
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, otp_code: otp }),
      });
      const data = await res.json();
      if (res.ok) authLogin(data.access_token, data.full_name || phone, "phone");
      else setError(data.detail || "Invalid OTP");
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  // ── Sign up ───────────────────────────────────────────────────────────────
  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your full name"); return; }
    setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json();
      if (res.ok) goTo("signup-otp");
      else setError(data.detail || "Failed to send OTP");
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  const handleVerifySignupOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    clearError(); goTo("signup-password");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/verify-otp-and-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, otp_code: otp, full_name: name, password }),
      });
      const data = await res.json();
      if (res.ok) authLogin(data.access_token, data.full_name || name, "phone");
      else {
        setError(data.detail || "Verification failed");
        if (data.detail?.toLowerCase().includes("otp")) goTo("signup-otp");
      }
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json();
      if (res.ok) goTo("forgot-otp");
      else setError(data.detail || "Failed to send OTP");
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  const handleForgotVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    clearError(); goTo("forgot-newpassword");
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); clearError();
    try {
      const res = await fetch(`${API_BASE}/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, otp_code: otp, new_password: password }),
      });
      const data = await res.json();
      if (res.ok) { setPassword(""); setOtp(""); goTo("forgot-done"); }
      else {
        setError(data.detail || "Reset failed");
        if (data.detail?.toLowerCase().includes("otp")) goTo("forgot-otp");
      }
    } catch { setError("Could not reach server. Try again."); }
    finally { setLoading(false); }
  };

  // ── Shared UI ─────────────────────────────────────────────────────────────
  const GoogleButton = () => (
    <div className="w-full flex justify-center">
      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in failed")} useOneTap theme="outline" shape="pill" width="320" />
    </div>
  );

  const Divider = ({ label = "or" }: { label?: string }) => (
    <div className="relative my-6 text-center">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
      <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );

  const ErrorBox = () => error ? (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">
      <X size={14} className="shrink-0 mt-0.5" />{error}
    </div>
  ) : null;

  const BackButton = ({ to, label = "Back" }: { to: View; label?: string }) => (
    <button type="button" onClick={() => goTo(to)} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-green-900 transition-colors flex items-center gap-1">
      <ArrowLeft size={12} /> {label}
    </button>
  );

  const SubmitBtn = ({ label }: { label: string }) => (
    <button disabled={loading} className="w-full bg-green-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-green-800 transition flex items-center justify-center gap-2 disabled:opacity-60">
      {loading ? <Loader2 className="animate-spin" size={18} /> : label}
    </button>
  );

  const OtpInput = () => (
    <input
      required type="text" inputMode="numeric" maxLength={6}
      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
      placeholder="000000"
      className="w-full py-5 border border-gray-200 rounded-2xl outline-none focus:border-green-900 text-center text-3xl font-black tracking-[0.5em] text-green-900 bg-gray-50 transition-all"
    />
  );

  const PasswordStrengthBar = () => !password ? null : (
    <div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${
          password.length < 8 ? "w-1/5 bg-red-400"
          : password.length < 10 ? "w-2/5 bg-amber-400"
          : /[A-Z]/.test(password) && /[0-9]/.test(password) ? "w-full bg-green-600"
          : "w-3/5 bg-blue-500"
        }`} />
      </div>
      <p className="text-xs text-gray-400 mt-1">Use 10+ characters with uppercase and numbers for a strong password</p>
    </div>
  );

  const MethodCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded-2xl hover:border-green-900 hover:bg-green-50/40 transition-all group text-left">
      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-800 group-hover:bg-green-900 group-hover:text-white transition-all shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-green-900 transition-colors" />
    </button>
  );

  const PhoneInput = () => (
    <div className="relative">
      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
      <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number (+91...)"
        className="w-full pl-14 pr-5 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/10 font-medium text-gray-900 transition-all" />
    </div>
  );

  const PasswordInput = ({ placeholder = "Create a strong password" }: { placeholder?: string }) => (
    <div className="relative">
      <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={placeholder}
        className="w-full pl-14 pr-5 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/10 font-medium text-gray-900 transition-all" />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">

      {/* LEFT: Branding */}
      <div className="hidden md:flex md:w-1/2 bg-green-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30"><img src="/loginbg.jpg" alt="" className="w-full h-full object-cover" /></div>
        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-6xl font-serif mb-6 leading-tight">JEEVASURABI</h2>
          <p className="text-xl text-green-100 font-light mb-10">Reviving traditional wellness through wood-pressed purity.</p>
          <div className="space-y-4">
            {["Fast Home Delivery", "100% Pure Oils", "Traditional Extraction"].map((t) => (
              <div key={t} className="flex items-center space-x-3">
                <CheckCircle2 size={20} className="text-yellow-500" />
                <span className="font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Forms */}
      <div className="flex-1 flex flex-col px-8 md:px-20 py-16 justify-center bg-white relative">
        <Link href="/" className="absolute top-10 left-8 md:left-20 flex items-center space-x-2 text-gray-400 hover:text-green-900 transition-colors font-bold uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> <span>Home</span>
        </Link>

        <div className="max-w-md w-full mx-auto space-y-6">

          {/* LANDING */}
          {view === "landing" && (<>
            <div>
              <h1 className="text-4xl font-serif text-green-900 mb-1">Welcome</h1>
              <p className="text-gray-500 text-sm">Sign in to your account or create a new one</p>
            </div>
            <GoogleButton />
            <Divider />
            <div className="space-y-3">
              <MethodCard icon={<User size={20} />} title="Sign In" desc="Already have an account? Sign in here"
                onClick={() => { clearError(); setPhone(""); setPassword(""); setOtp(""); goTo("signin-choose"); }} />
              <MethodCard icon={<Phone size={20} />} title="Create Account" desc="New here? Register with your phone number"
                onClick={() => { clearError(); setPhone(""); setName(""); setOtp(""); setPassword(""); goTo("signup-details"); }} />
            </div>
            <ErrorBox />
          </>)}

          {/* SIGN IN: choose method */}
          {view === "signin-choose" && (<>
            <div>
              <BackButton to="landing" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Sign In</h1>
              <p className="text-gray-500 text-sm">Choose how you'd like to sign in</p>
            </div>
            <GoogleButton />
            <Divider label="or sign in with phone" />
            <div className="space-y-3">
              <MethodCard icon={<Lock size={20} />} title="Sign in with Password" desc="Use your phone number and password" onClick={() => goTo("signin-password")} />
              <MethodCard icon={<MessageSquare size={20} />} title="Sign in with OTP" desc="We'll send a one-time code to your phone" onClick={() => goTo("signin-otp-send")} />
            </div>
            <p className="text-center text-gray-500 text-xs pt-2">
              Don't have an account?{" "}
              <button onClick={() => goTo("signup-details")} className="text-green-900 font-bold hover:underline">Create one</button>
            </p>
            <ErrorBox />
          </>)}

          {/* SIGN IN: password */}
          {view === "signin-password" && (<>
            <div>
              <BackButton to="signin-choose" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Sign In</h1>
              <p className="text-gray-500 text-sm">Enter your phone number and password</p>
            </div>
            <form className="space-y-4" onSubmit={handlePasswordLogin}>
              <PhoneInput />
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                  className="w-full pl-14 pr-5 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/10 font-medium text-gray-900 transition-all" />
              </div>
              <ErrorBox />
              <SubmitBtn label="Sign In" />
            </form>
            <div className="flex justify-between text-xs">
              <button onClick={() => { clearError(); setOtp(""); goTo("signin-otp-send"); }} className="text-green-900 font-bold hover:underline">
                Sign in with OTP instead
              </button>
              <button onClick={() => { clearError(); setPhone(""); setOtp(""); setPassword(""); goTo("forgot-phone"); }} className="text-amber-700 font-bold hover:underline flex items-center gap-1">
                <RotateCcw size={12} /> Forgot password?
              </button>
            </div>
          </>)}

          {/* SIGN IN: OTP — enter phone */}
          {view === "signin-otp-send" && (<>
            <div>
              <BackButton to="signin-choose" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Sign In with OTP</h1>
              <p className="text-gray-500 text-sm">Enter your registered phone number</p>
            </div>
            <form className="space-y-4" onSubmit={handleSendLoginOtp}>
              <PhoneInput />
              <ErrorBox />
              <SubmitBtn label="Send OTP" />
            </form>
          </>)}

          {/* SIGN IN: OTP — verify */}
          {view === "signin-otp-verify" && (<>
            <div>
              <BackButton to="signin-otp-send" label="Change number" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Enter OTP</h1>
              <p className="text-gray-500 text-sm">Code sent to <span className="font-bold text-gray-700">{phone}</span></p>
            </div>
            <form className="space-y-4" onSubmit={handleVerifyLoginOtp}>
              <OtpInput />
              <ErrorBox />
              <SubmitBtn label="Verify & Sign In" />
            </form>
            <p className="text-center text-xs text-gray-400">
              Didn't receive it?{" "}
              <button onClick={() => { setOtp(""); goTo("signin-otp-send"); }} className="text-green-900 font-bold hover:underline">Resend OTP</button>
            </p>
          </>)}

          {/* SIGN UP: name + phone */}
          {view === "signup-details" && (<>
            <div>
              <BackButton to="landing" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Create Account</h1>
              <p className="text-gray-500 text-sm">Enter your name and phone number to get started</p>
            </div>
            <GoogleButton />
            <Divider label="or sign up with phone" />
            <form className="space-y-4" onSubmit={handleSendSignupOtp}>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
                  className="w-full pl-14 pr-5 py-4 border border-gray-100 rounded-2xl bg-gray-50/50 outline-none focus:ring-2 focus:ring-green-900/10 font-medium text-gray-900 transition-all" />
              </div>
              <PhoneInput />
              <ErrorBox />
              <SubmitBtn label="Send OTP" />
            </form>
            <p className="text-center text-gray-500 text-xs">
              Already have an account?{" "}
              <button onClick={() => goTo("signin-choose")} className="text-green-900 font-bold hover:underline">Sign in</button>
            </p>
          </>)}

          {/* SIGN UP: enter OTP */}
          {view === "signup-otp" && (<>
            <div>
              <BackButton to="signup-details" label="Change number" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Verify Phone</h1>
              <p className="text-gray-500 text-sm">Enter the 6-digit code sent to <span className="font-bold text-gray-700">{phone}</span></p>
            </div>
            <form className="space-y-4" onSubmit={handleVerifySignupOtp}>
              <OtpInput />
              <ErrorBox />
              <SubmitBtn label="Continue" />
            </form>
            <p className="text-center text-xs text-gray-400">
              Didn't receive it?{" "}
              <button onClick={() => { setOtp(""); goTo("signup-details"); }} className="text-green-900 font-bold hover:underline">Resend OTP</button>
            </p>
          </>)}

          {/* SIGN UP: set password */}
          {view === "signup-password" && (<>
            <div>
              <BackButton to="signup-otp" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Create Password</h1>
              <p className="text-gray-500 text-sm">Set a password for <span className="font-bold text-gray-700">{name}</span></p>
            </div>
            <form className="space-y-4" onSubmit={handleCreateAccount}>
              <PasswordInput />
              <PasswordStrengthBar />
              <ErrorBox />
              <SubmitBtn label="Create Account" />
            </form>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-xs text-green-900 space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px] text-green-700 mb-2">Account Summary</p>
              <p><span className="font-bold">Name:</span> {name}</p>
              <p><span className="font-bold">Phone:</span> {phone}</p>
            </div>
          </>)}

          {/* FORGOT: enter phone */}
          {view === "forgot-phone" && (<>
            <div>
              <BackButton to="signin-password" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Reset Password</h1>
              <p className="text-gray-500 text-sm">Enter your registered phone number and we'll send a verification code</p>
            </div>
            <form className="space-y-4" onSubmit={handleForgotSendOtp}>
              <PhoneInput />
              <ErrorBox />
              <SubmitBtn label="Send OTP" />
            </form>
            <p className="text-center text-xs text-gray-400">
              Remembered it?{" "}
              <button onClick={() => goTo("signin-password")} className="text-green-900 font-bold hover:underline">Back to Sign In</button>
            </p>
          </>)}

          {/* FORGOT: verify OTP */}
          {view === "forgot-otp" && (<>
            <div>
              <BackButton to="forgot-phone" label="Change number" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">Verify Identity</h1>
              <p className="text-gray-500 text-sm">Enter the code sent to <span className="font-bold text-gray-700">{phone}</span></p>
            </div>
            <form className="space-y-4" onSubmit={handleForgotVerifyOtp}>
              <OtpInput />
              <ErrorBox />
              <SubmitBtn label="Verify Code" />
            </form>
            <p className="text-center text-xs text-gray-400">
              Didn't receive it?{" "}
              <button onClick={() => { setOtp(""); goTo("forgot-phone"); }} className="text-green-900 font-bold hover:underline">Resend OTP</button>
            </p>
          </>)}

          {/* FORGOT: set new password */}
          {view === "forgot-newpassword" && (<>
            <div>
              <BackButton to="forgot-otp" />
              <h1 className="text-3xl font-serif text-green-900 mt-3 mb-1">New Password</h1>
              <p className="text-gray-500 text-sm">Create a new password for <span className="font-bold text-gray-700">{phone}</span></p>
            </div>
            <form className="space-y-4" onSubmit={handleForgotReset}>
              <PasswordInput placeholder="Enter new password" />
              <PasswordStrengthBar />
              <ErrorBox />
              <SubmitBtn label="Reset Password" />
            </form>
          </>)}

          {/* FORGOT: success */}
          {view === "forgot-done" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-green-700" />
              </div>
              <div>
                <h1 className="text-2xl font-serif text-green-900 mb-2">Password Reset!</h1>
                <p className="text-gray-500 text-sm">Your password has been updated. You can now sign in with your new password.</p>
              </div>
              <button
                onClick={() => { setPhone(""); setOtp(""); setPassword(""); goTo("signin-password"); }}
                className="w-full bg-green-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-green-800 transition"
              >
                Sign In Now
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}