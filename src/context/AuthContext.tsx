"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type AuthMethod = "google" | "phone" | null;

interface User {
  email: string;
  fullname?: string;
  phone?: string;
  profilePic?: string;
  authMethod?: AuthMethod;
  is_admin?: boolean; // NEW: Added admin flag
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  authMethod: AuthMethod;
  isGoogleUser: boolean;
  isPhoneUser: boolean;
  // NEW: Signature updated to accept the full data object from your backend
  login: (token: string, data: any, method?: AuthMethod) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedData = localStorage.getItem("userData");
    if (token && savedData) {
      try {
        setUser(JSON.parse(savedData));
      } catch {
        setUser({ email: savedData });
      }
    }
    setLoading(false);
  }, []);

  // NEW: Extract exactly what the backend gives us instead of guessing
  const login = (token: string, data: any, method: AuthMethod = "phone") => {
    const userData: User = {
      email: data.email || "",
      fullname: data.fullname || data.full_name || "",
      phone: data.phone || data.phone_number || "",
      profilePic: data.profile_pic || data.profilePic || "", 
      authMethod: method,
      is_admin: data.is_admin || false, // Save the admin status!
    };

    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setUser(userData);

    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin'); 
        router.push(redirectUrl);
    } else {
        // Auto-redirect admins to their dashboard, otherwise to the shop
        router.push(userData.is_admin ? "/admin" : "/shop"); 
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("userEmail"); // Kept to clear old legacy data
    setUser(null);
    router.push("/login");
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("userData", JSON.stringify(updated));
      return updated;
    });
  };

  const authMethod: AuthMethod = user?.authMethod ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        authMethod,
        isGoogleUser: authMethod === "google",
        isPhoneUser: authMethod === "phone",
        login,
        logout,
        updateUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};