import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import LayoutContent from "@/components/LayoutContent";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
        <GoogleOAuthProvider clientId={googleClientId ?? ""}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <LayoutContent>{children}</LayoutContent>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
