"use client";
import React, { useState } from 'react';
import Image from 'next/image'; // Import Image component
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Thank you! Your message has been sent to JeevaSurabi.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 overflow-x-hidden font-medium">
      
      {/* --- HERO SECTION WITH BACKGROUND IMAGE --- */}
      <section className="relative py-24 md:py-32 bg-green-950 text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image 
            src="/contactbg.png" // Make sure to add this image to your public folder
            alt="Contact Jeevasurabi" 
            fill 
            className="object-cover opacity-30" // Adjust opacity as needed
            priority
          />
          <div className="absolute inset-0 bg-green-950/40 mix-blend-multiply" /> {/* Adds a green tint for better text contrast */}
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-7xl font-serif mb-6 tracking-tight drop-shadow-sm">Get in Touch</h1>
          <p className="text-lg md:text-xl text-green-100 font-light italic drop-shadow-sm">
            Have questions about our wood-pressed oils? We are here to help.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-20 -mt-10 relative z-20">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* --- LEFT SIDE: CONTACT INFO & MAP --- */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-green-900 mb-8">Our Location</h2>
              <div className="space-y-6 text-gray-700">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-900 shrink-0"><MapPin size={24} /></div>
                  <p className="text-lg">
                    <strong>Jeevasurabi Food Products</strong><br />
                    #318, Arunachalam Colony, Vadasery,<br />
                    Nagercoil – 629001
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-900 shrink-0"><Phone size={24} /></div>
                  <p className="text-lg">+91 94436 08203</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-900 shrink-0"><Mail size={24} /></div>
                  <p className="text-lg break-all">jeevasurabifoodproducts7@gmail.com</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-900 shrink-0"><Clock size={24} /></div>
                  <p className="text-lg">Mon – Sat: 9:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>

            {/* --- GOOGLE MAPS SECTION --- */}
            <div className="w-full h-80 md:h-[450px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.063964226807!2d77.4285856736029!3d8.196311601470018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b04f12b4fffffff%3A0xb0c126406068ab1c!2sjeevasurabi!5e0!3m2!1sen!2sus!4v1767871514515!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* --- RIGHT SIDE: CONTACT FORM --- */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-green-900/5 border border-gray-100">
            <h2 className="text-3xl font-serif text-green-900 mb-8">Send an Inquiry</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ... Form inputs remain the same ... */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Name</label>
                  <input required id="name" type="text" placeholder="Your Name" onChange={handleChange} className="bg-gray-50 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-green-900/20 transition-all outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Email ID</label>
                  <input required id="email" type="email" placeholder="example@mail.com" onChange={handleChange} className="bg-gray-50 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-green-900/20 transition-all outline-none" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                  <input required id="phone" type="tel" placeholder="+91" onChange={handleChange} className="bg-gray-50 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-green-900/20 transition-all outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-gray-400">Subject</label>
                  <input required id="subject" type="text" placeholder="Inquiry Subject" onChange={handleChange} className="bg-gray-50 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-green-900/20 transition-all outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Message</label>
                <textarea required id="message" rows={5} placeholder="Write your message here..." onChange={handleChange} className="bg-gray-50 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-green-900/20 transition-all outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-green-900 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-[0.98]">
                Submit Message <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}