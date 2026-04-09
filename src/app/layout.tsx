import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import LayoutContent from "@/components/LayoutContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JeevaSurabi | Wood-Pressed Oils",
    template: "%s | JeevaSurabi",
  },
  description: "Authentic and traditional wood-pressed oils from Nagercoil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-medium`}>
        {/* AuthProvider must be the outermost provider so others can access auth state if needed */}
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <LayoutContent>{children}</LayoutContent>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}