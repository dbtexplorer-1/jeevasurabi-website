"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  email: string;
  fullName?: string;
  phone?: string;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, identifier: string) => void;
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

  const login = (token: string, identifier: string) => {
    const userData: User = {
      email: identifier.includes("@") ? identifier : "",
      fullName: identifier.includes("@") ? "" : identifier,
      phone: identifier.includes("@") ? "" : identifier,
    };
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userEmail", identifier); // backward compat
    setUser(userData);
    router.push("/shop");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("userEmail");
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

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, login, logout, updateUser, loading }}
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
