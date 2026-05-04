"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  ChevronRight, ArrowLeft, MapPin, CreditCard,
  CheckCircle2, ShoppingBag, ShieldCheck, Loader2, Truck, Package, ClipboardList, Check
} from "lucide-react";

// Dynamically determine the API base URL
const API_BASE = typeof window !== "undefined" 
  ? `http://${window.location.hostname}:8000` 
  : "http://localhost:8000";

type CheckoutStep = "shipping" | "summary" | "payment";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const { cart, totalPrice, cartCount, clearCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false); 
  const [countdown, setCountdown] = useState(10);
  const [error, setError] = useState("");

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  // ==========================================
  // COURIER CHARGE LOGIC
  // ==========================================

  const totalWeightGrams = cart.reduce((total, item) => {
    let itemWeight = 0;
    const sizeStr = (item.size || "").toLowerCase();
    const numericValue = parseFloat(sizeStr.replace(/[^\d.]/g, '')) || 0;

    if (sizeStr.includes('ml') || sizeStr.includes('g')) {
      itemWeight = numericValue;
    } else if (sizeStr.includes('l') || sizeStr.includes('kg')) {
      itemWeight = numericValue * 1000;
    } else {
      itemWeight = 1000; 
    }

    const packagingBuffer = 150; 
    return total + ((itemWeight + packagingBuffer) * item.quantity);
  }, 0);

  const getShippingFee = (state: string, weightGrams: number) => {
    if (!state || weightGrams <= 0) return 0;
    const southIndia = ["Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Puducherry"];
    if (state === "Tamil Nadu") return Math.ceil(weightGrams / 1000) * 25;
    if (southIndia.includes(state)) return Math.ceil(weightGrams / 1000) * 50;
    if (weightGrams <= 5000) return 320; 
    const extraWeight = weightGrams - 5000;
    return 320 + (Math.ceil(extraWeight / 1000) * 60);
  };

  const shippingFee = getShippingFee(shippingInfo.state, totalWeightGrams);
  const finalTotal = totalPrice + shippingFee;

  // ==========================================

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (user?.phone && !shippingInfo.phone) {
      setShippingInfo(prev => ({ ...prev, phone: user.phone! }));
    }
  }, [user]);

  // 10-Second Auto Redirect Effect
  useEffect(() => {
    if (orderPlaced && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (orderPlaced && countdown === 0) {
      router.push("/shop");
    }
  }, [orderPlaced, countdown, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <Loader2 className="animate-spin text-green-900" size={36} />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  if (cart.length === 0 && step !== "payment" && !orderPlaced) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-green-900 uppercase mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">Looks like you haven't added any wood-pressed oils to your cart yet.</p>
        <Link href="/shop" className="bg-green-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-green-800 uppercase tracking-widest transition-colors shadow-lg">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("summary");
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication error. Please log in again.");

      const fullAddress = `${shippingInfo.firstName} ${shippingInfo.lastName}, ${shippingInfo.address}, ${shippingInfo.apartment ? shippingInfo.apartment + ', ' : ''}${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}. Phone: ${shippingInfo.phone}`;

      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          shipping_address: fullAddress,
          items: orderItems
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to place order");
      }

      // Success! Trigger the animation, countdown handles redirect
      setOrderPlaced(true);
      clearCart();

    } catch (err: any) {
      setError(err.message || "An error occurred while placing the order.");
      setIsProcessing(false);
    }
  };

  const Stepper = () => (
    <div className="flex items-center justify-center mb-10">
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={() => setStep("shipping")} className={`flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider ${step === "shipping" ? "text-green-900" : "text-green-900/50"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === "shipping" ? "bg-green-900 text-white" : "bg-green-900/10"}`}>1</span>
          Shipping
        </button>
        <div className="w-8 md:w-12 h-px bg-gray-200"></div>
        <button onClick={() => { if(step === "payment") setStep("summary"); }} disabled={step === "shipping"} className={`flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider ${step === "summary" || step === "payment" ? "text-green-900" : "text-gray-300"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === "summary" || step === "payment" ? "bg-green-900 text-white" : "bg-gray-100 text-gray-400"}`}>2</span>
          Summary
        </button>
        <div className="w-8 md:w-12 h-px bg-gray-200"></div>
        <div className={`flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider ${step === "payment" ? "text-green-900" : "text-gray-300"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === "payment" ? "bg-green-900 text-white" : "bg-gray-100 text-gray-400"}`}>3</span>
          Payment
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-8 md:py-12 px-4 relative overflow-hidden">
      
      {/* ========================================== */}
      {/* SUCCESS ANIMATION OVERLAY */}
      {/* ========================================== */}
      {orderPlaced && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-green-900 transition-all duration-500">
          <style>{`
            @keyframes popIn {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes checkBounce {
              0% { transform: scale(0); }
              50% { transform: scale(1.4); }
              100% { transform: scale(1); }
            }
            @keyframes fadeInUp {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes popperLeft {
              0% { transform: translate(0, 0) scale(0); opacity: 1; }
              100% { transform: translate(-100px, -100px) scale(1.5) rotate(-45deg); opacity: 0; }
            }
            @keyframes popperRight {
              0% { transform: translate(0, 0) scale(0); opacity: 1; }
              100% { transform: translate(100px, -100px) scale(1.5) rotate(45deg); opacity: 0; }
            }
            @keyframes popperTop {
              0% { transform: translate(0, 0) scale(0); opacity: 1; }
              100% { transform: translate(0, -120px) scale(1.5); opacity: 0; }
            }
          `}</style>
          
          <div className="relative flex items-center justify-center" style={{ animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            {/* Confetti / Poppers */}
            <div className="absolute w-4 h-4 bg-yellow-400 rounded-full" style={{ animation: 'popperLeft 1s ease-out forwards 0.2s', opacity: 0 }}></div>
            <div className="absolute w-4 h-4 bg-white rounded-full" style={{ animation: 'popperRight 1s ease-out forwards 0.2s', opacity: 0 }}></div>
            <div className="absolute w-4 h-4 bg-green-400 rounded-full" style={{ animation: 'popperTop 1s ease-out forwards 0.2s', opacity: 0 }}></div>
            <div className="absolute w-3 h-3 bg-white rounded-sm" style={{ animation: 'popperLeft 1.2s ease-out forwards 0.3s', opacity: 0 }}></div>
            <div className="absolute w-3 h-3 bg-yellow-500 rounded-sm" style={{ animation: 'popperRight 1.2s ease-out forwards 0.3s', opacity: 0 }}></div>
            
            {/* Main Tick Circle */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-2xl z-10">
              <Check 
                size={80} 
                strokeWidth={4} 
                className="text-green-900" 
                style={{ animation: 'checkBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.3s', transform: 'scale(0)' }} 
              />
            </div>
          </div>
          
          <h2 
            className="text-white text-3xl md:text-4xl font-black mt-8 text-center uppercase tracking-widest"
            style={{ animation: 'fadeInUp 0.6s ease-out forwards 0.5s', opacity: 0 }}
          >
            Order Placed!
          </h2>

          <div 
            className="flex flex-col sm:flex-row gap-4 mt-8 px-6 w-full max-w-md"
            style={{ animation: 'fadeInUp 0.6s ease-out forwards 0.7s', opacity: 0 }}
          >
             <button 
                onClick={() => router.push("/shop")} 
                className="flex-1 bg-white text-green-900 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg text-center"
             >
               Continue Shopping
             </button>
             {/* FIXED: Now routes directly to the orders tab */}
             <button 
                onClick={() => router.push("/profile?tab=orders")} 
                className="flex-1 bg-transparent border-2 border-white/30 text-white px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors text-center"
             >
               View My Orders
             </button>
          </div>
          
          <p 
            className="text-green-200/80 mt-8 text-xs font-bold uppercase tracking-wider"
            style={{ animation: 'fadeInUp 0.6s ease-out forwards 0.9s', opacity: 0 }}
          >
            Redirecting to shop in {countdown} seconds...
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/shop" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-green-900 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Shop
          </Link>
          <div className="flex items-center gap-2 text-green-900">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Checkout</span>
          </div>
        </div>

        <Stepper />

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          {step === "shipping" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-900 shadow-sm">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-green-900 uppercase">Shipping Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Where should we deliver your order?</p>
                </div>
              </div>
              
              <form onSubmit={handleShippingSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Name *</label>
                    <input required type="text" value={shippingInfo.firstName} onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="First Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Name *</label>
                    <input required type="text" value={shippingInfo.lastName} onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="Last Name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Street Address *</label>
                    <input required type="text" value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="House number and street name" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Apartment, suite, etc. (optional)</label>
                    <input type="text" value={shippingInfo.apartment} onChange={(e) => setShippingInfo({...shippingInfo, apartment: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="Apartment, suite, unit, etc." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City / District *</label>
                    <input required type="text" value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="e.g. Nagercoil" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State *</label>
                    <select required value={shippingInfo.state} onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors bg-white">
                      <option value="" disabled>Select State</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Puducherry">Puducherry</option>
                      <option value="Other">Other (Rest of India)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PIN Code *</label>
                    <input required type="text" maxLength={6} pattern="[0-9]{6}" value={shippingInfo.pincode} onChange={(e) => setShippingInfo({...shippingInfo, pincode: e.target.value.replace(/\D/g, '')})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="6 digit PIN" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number *</label>
                    <input required type="tel" value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-green-900 outline-none font-bold text-gray-900 transition-colors" placeholder="+91" />
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col items-end">
                  <button type="submit" className="w-full sm:w-auto bg-green-900 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg flex items-center justify-center gap-2">
                    Continue to Summary <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "summary" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row">
              <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-900 shadow-sm">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-green-900 uppercase">Order Summary</h2>
                    <p className="text-gray-500 text-sm mt-1">Review your items and shipping info</p>
                  </div>
                </div>

                <div className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-gray-900 uppercase tracking-wider text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-green-900" /> Delivering To
                    </p>
                    <button onClick={() => setStep("shipping")} className="text-xs font-bold text-amber-600 hover:underline">Change</button>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-600 leading-relaxed border border-gray-100">
                    <p className="font-bold text-gray-900 text-base mb-1">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                    <p>{shippingInfo.address} {shippingInfo.apartment && `, ${shippingInfo.apartment}`}</p>
                    <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.pincode}</p>
                    <p className="mt-2 pt-2 border-t border-gray-200 font-bold text-gray-900">📞 {shippingInfo.phone}</p>
                  </div>
                </div>

                <div className="p-8 pt-4 space-y-6">
                  <p className="font-bold text-gray-900 uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
                    <Package size={16} className="text-green-900" /> Order Items ({cartCount})
                  </p>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-6 border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                        <Image src={item.img} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-base text-green-900 font-bold">{item.name}</h4>
                        <p className="text-xs text-amber-700 font-bold uppercase mt-1">{item.size}</p>
                        <p className="text-gray-500 text-sm mt-1">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-900">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-96 bg-gray-50 p-8 flex flex-col">
                <h3 className="font-bold text-gray-900 uppercase tracking-widest mb-6">Price Details</h3>
                
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({cartCount} items)</span>
                    <span className="font-bold text-gray-900">₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 flex items-center gap-2"><Truck size={14}/> Shipping fee</span>
                    <span className="font-bold text-gray-900">₹{shippingFee}</span>
                  </div>
                  
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 text-right italic">
                    Est. Package Weight: {(totalWeightGrams/1000).toFixed(1)}kg
                  </p>

                  <div className="h-px bg-gray-200 my-4"></div>
                  
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-900 uppercase tracking-widest">Total Amount</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-green-900">₹{finalTotal}</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setStep("payment")} className="w-full bg-green-900 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg flex items-center justify-center gap-2">
                  Proceed to Payment <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-900 shadow-sm">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-green-900 uppercase">Payment</h2>
                  <p className="text-gray-500 text-sm mt-1">Complete your purchase securely</p>
                </div>
              </div>

              <div className="p-8 max-w-md mx-auto text-center py-16">
                <div className="mb-8">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Amount to Pay</p>
                  <p className="text-5xl font-black text-green-900">₹{finalTotal}</p>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold text-left">
                    {error}
                  </div>
                )}

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full bg-green-900 text-white py-5 rounded-2xl font-bold text-lg uppercase tracking-widest hover:bg-green-800 transition-all shadow-xl disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <><Loader2 className="animate-spin" size={24} /> Processing...</>
                  ) : (
                    <>Place Order</>
                  )}
                </button>

                <div className="mt-8">
                  <button onClick={() => setStep("summary")} disabled={isProcessing} className="text-xs font-bold text-gray-400 hover:text-green-900 uppercase tracking-widest transition-colors disabled:opacity-50">
                    Back to Summary
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}