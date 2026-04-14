"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type AuthMethod = "google" | "phone" | null;

interface User {
  email: string;
  fullName?: string;
  phone?: string;
  profilePic?: string;
  authMethod?: AuthMethod;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  authMethod: AuthMethod;
  isGoogleUser: boolean;
  isPhoneUser: boolean;
  // ADDED: profilePic to the login function signature
  login: (token: string, identifier: string, method?: AuthMethod, profilePic?: string) => void;
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

  // ADDED: Accept profilePic here
  const login = (token: string, identifier: string, method: AuthMethod = "phone", profilePic?: string) => {
    const userData: User = {
      email: identifier.includes("@") ? identifier : "",
      fullName: identifier.includes("@") ? "" : identifier,
      phone: identifier.includes("@") ? "" : identifier,
      profilePic: profilePic || "", // ADDED: Store it immediately
      authMethod: method,
    };
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userEmail", identifier); // backward compat
    setUser(userData);

    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin'); 
        router.push(redirectUrl);
    } else {
        router.push("/shop"); 
    }
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