"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Linkedin, MapPin, Phone, Mail, Clock } from 'lucide-react';

// Standard X/Twitter icon
const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="text-gray-800">

      {/* ── ROW 1: Image Left | Logo + Tagline + Social Right ── */}
      <div className="flex flex-col md:flex-row h-auto md:h-80">

        {/* Left: panoramic image left half */}
        <div
          className="w-full md:w-1/2 h-64 md:h-full"
          style={{
            backgroundImage: "url('/footer.png')",
            backgroundSize: '200% 100%',
            backgroundPosition: 'left center',
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />

        {/* Right: Centered content on green background */}
        <div className="w-full md:w-1/2 bg-green-900 flex flex-col items-center justify-center p-10 py-14 text-center">

          {/* Logo Section — Removed the invert classes so your actual logo shows */}
          <div className="mb-6 flex items-center justify-center">
            <Image
              src="/icon.png"
              alt="Jeevasurabi Logo"
              width={200} 
              height={70} 
              className="object-contain" 
            />
          </div>

          <p className="max-w-sm text-sm font-medium leading-relaxed text-green-100 opacity-90 italic mb-8">
            Traditional wood-pressed oils for a healthier lifestyle.
            Retaining 100% natural soul through ancient extraction methods.
          </p>

          {/* Social icons — perfectly centered flex row */}
          <div className="flex items-center justify-center space-x-4">
            {[
              { icon: <Instagram size={18} />, href: '#' },
              { icon: <Facebook size={18} />, href: '#' },
              { icon: <XIcon size={18} />, href: '#' },
              { icon: <Linkedin size={18} />, href: '#' },
            ].map((s, i) => (
              <Link
                key={i}
                href={s.href}
                className="w-10 h-10 rounded-full border border-green-700 flex items-center justify-center text-green-200 hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all duration-200"
              >
                {s.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Contact + Navigation Left | Image Right ── */}
      <div className="flex flex-col md:flex-row h-auto md:h-80">

        {/* Left: Contact + Navigation */}
        <div className="w-full md:w-1/2 bg-[#fafaf9] border-t border-gray-100 px-10 py-10 grid grid-cols-1 sm:grid-cols-2 gap-10 content-center">

          {/* Contact Us */}
          <div className="space-y-5">
            <p className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs">
              Contact Us
            </p>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-green-800 shrink-0 mt-0.5" />
                <span>#318, Arunachalam Colony, Vadasery,<br />Nagercoil – 629001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-green-800 shrink-0" />
                <a href="tel:+919443608203" className="hover:text-green-900 font-semibold transition">
                  +91 94436 08203
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-green-800 shrink-0" />
                <a
                  href="mailto:jeevasurabifoodproducts7@gmail.com"
                  className="hover:text-green-900 font-semibold transition break-all"
                >
                  jeevasurabifoodproducts7@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={15} className="text-green-800 shrink-0" />
                <span>Mon – Sat: 9:00 AM – 6:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="space-y-5">
            <p className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs">
              Navigation
            </p>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Home', href: '/' },
                { label: 'Shop Marketplace', href: '/shop' },
                { label: 'About Our Purity', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-green-900 font-medium transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-amber-500 transition-all duration-200 inline-block" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: panoramic image right half */}
        <div
          className="w-full md:w-1/2 h-64 md:h-full border-t md:border-t-0 border-gray-100"
          style={{
            backgroundImage: "url('/footer.png')",
            backgroundSize: '200% 100%',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── COPYRIGHT ── */}
      <div className="bg-green-900 text-center py-5 text-[10px] font-bold tracking-[0.3em] uppercase text-green-300 border-t border-green-800/20">
        © 2026 JEEVASURABI FOOD PRODUCTS. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}