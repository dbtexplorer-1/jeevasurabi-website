"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Linkedin, MapPin, Phone, Mail, Clock } from 'lucide-react';

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

export default function Footer() {
  return (
    <footer 
      className="relative bg-neutral-700 text-gray-200 pt-24 pb-16 px-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/footer.png')" }}
    >
      {/* Dark overlay to ensure light text remains readable over the image */}
      <div className="absolute inset-0 bg-neutral-900/40 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 border-b border-white/5 pb-16">
        
        {/* COLUMN 1: BRAND & MISSION */}
        <div className="sm:col-span-2 space-y-6">
          <div className="mb-2">
            <Image src="/icon.png" alt="Jeevasurabi Logo" width={180} height={60} className="object-contain" />
          </div>
          <p className="max-w-sm text-base font-medium leading-relaxed">
            Traditional wood-pressed oils for a healthier lifestyle. 
            Retaining 100% natural soul through ancient extraction methods.
          </p>
          <div className="flex space-x-6 pt-4">
            <Link href="#" className="hover:text-white transition-colors"><Instagram size={22} /></Link>
            <Link href="#" className="hover:text-white transition-colors"><Facebook size={22} /></Link>
            <Link href="#" className="hover:text-white transition-colors">
              <XIcon size={22} />
            </Link>
            <Link href="#" className="hover:text-white transition-colors"><Linkedin size={22} /></Link>
          </div>
        </div>

        {/* COLUMN 2: CONTACT INFORMATION */}
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest text-yellow-600">Contact Us</h4>
          <ul className="space-y-4 text-sm font-semibold">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-yellow-600 shrink-0" />
              <span>#318, Arunachalam Colony, Vadasery, <br /> Nagercoil – 629001</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-yellow-600 shrink-0" />
              <a href="tel:+919443608203" className="hover:text-white transition">+91 94436 08203</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-yellow-600 shrink-0" />
              <a href="mailto:jeevasurabifoodproducts7@gmail.com" className="hover:text-white transition break-all">
                jeevasurabifoodproducts7@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Clock size={16} className="text-yellow-600 shrink-0" />
              <span>Mon – Sat: 9:00 AM – 6:00 PM</span>
            </li>
          </ul>
        </div>

        {/* COLUMN 3: QUICK LINKS */}
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest text-yellow-600">Navigation</h4>
          <ul className="space-y-4 text-sm font-semibold">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/shop" className="hover:text-white transition">Shop Marketplace</Link></li>
            <li><Link href="/about" className="hover:text-white transition">About Our Purity</Link></li>
            <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="relative z-10 text-center mt-12 text-xs font-bold tracking-[0.4em] uppercase text-gray-400">
        © 2026 JEEVASURABI FOOD PRODUCTS. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}