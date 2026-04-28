"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from "@/config/site";
import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';

// Standard X/Twitter icon
const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

// Custom WhatsApp icon
const WhatsAppIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.022-.967-.264-.099-.456-.149-.648.149-.192.297-.764.967-.938 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.648-1.56-.888-2.136-.235-.558-.475-.482-.648-.491-.168-.008-.36-.008-.552-.008-.192 0-.505.074-.769.372-.264.297-1.005.982-1.005 2.394s1.029 2.775 1.173 2.973c.144.198 2.029 3.111 4.915 4.356.686.296 1.222.473 1.639.605.688.218 1.314.187 1.808.113.555-.083 1.705-.697 1.944-1.37.239-.673.239-1.25.168-1.37-.07-.12-.262-.194-.559-.343zM12.015 20.301h-.004c-1.644 0-3.255-.442-4.667-1.278l-.334-.198-3.468.91 .928-3.38-.218-.346a8.274 8.274 0 0 1-1.266-4.385c0-4.582 3.73-8.312 8.318-8.312 2.22 0 4.307.865 5.877 2.435 1.569 1.57 2.433 3.657 2.433 5.877 0 4.582-3.73 8.312-8.315 8.312zM12.015 3.673a8.33 8.33 0 0 0-5.888 2.441 8.33 8.33 0 0 0-2.44 5.889c0 1.645.428 3.253 1.242 4.67l-1.09 3.971 4.062-1.07a8.336 8.336 0 0 0 4.114 1.074h.004c4.582 0 8.312-3.73 8.312-8.312 0-2.221-.865-4.308-2.435-5.878a8.329 8.329 0 0 0-5.881-2.435z" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

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

          {/* Logo Section */}
          <div className="mb-6 flex items-center justify-center">
            <Image
              src="/icon.png"
              alt="Jeevasurabi Logo"
              width={200} 
              height={70} 
              className="object-contain" 
            />
          </div>

          <p className="max-w-sm text-sm font-medium leading-relaxed text-green-100 opacity-90 italic mb-4">
            Traditional wood-pressed oils for a healthier lifestyle.
            Retaining 100% natural soul through ancient extraction methods.
          </p>

          {/* Social icons — perfectly centered flex row, slightly lifted */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <a
              href={siteConfig.links.instagram}
              target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full border border-green-700 flex items-center justify-center text-green-200 hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all duration-200"
            >
              <Instagram size={18} />
            </a>
            <a
              href={siteConfig.links.facebook}
              target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full border border-green-700 flex items-center justify-center text-green-200 hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all duration-200"
            >
              <Facebook size={18} />
            </a>
            <a
              href={siteConfig.links.twitter}
              target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full border border-green-700 flex items-center justify-center text-green-200 hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all duration-200"
            >
              <XIcon size={18} />
            </a>
            <a
              href={siteConfig.links.whatsapp}
              target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full border border-green-700 flex items-center justify-center text-green-200 hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all duration-200"
            >
              <WhatsAppIcon size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Contact + Navigation Left | Image Right ── */}
      <div className="flex flex-col md:flex-row h-auto md:h-80">

        {/* Left: Contact + Navigation */}
        <div className="w-full md:w-1/2 bg-[#fafaf9] border-t border-gray-100 px-10 py-10 grid grid-cols-1 sm:grid-cols-2 gap-10 content-center">

          {/* Contact Us - Now using siteConfig */}
          <div className="space-y-5">
            <p className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs">
              Contact Us
            </p>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-green-800 shrink-0 mt-0.5" />
                <span>{siteConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-green-800 shrink-0" />
                <a href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`} className="hover:text-green-900 font-semibold transition">
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-green-800 shrink-0" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-green-900 font-semibold transition break-all"
                >
                  {siteConfig.contact.email}
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
        © {currentYear} {siteConfig.name.toUpperCase()} FOOD PRODUCTS. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}