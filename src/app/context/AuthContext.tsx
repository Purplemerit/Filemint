"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  subscriptionPlan?: "basic" | "premium";
  subscriptionStatus?: "active" | "inactive" | "cancelled" | "expired";
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    termsAccepted: boolean
  ) => Promise<void>;
  oauthLogin: (provider: "google" | "github") => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
  isPremium: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();

  // Load user session from cookie/localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      // Try reading from cookie (non-HttpOnly)
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (cookieToken) {
        localStorage.setItem("token", cookieToken);
        setToken(cookieToken);
        fetchUserProfile(cookieToken);
      } else {
        setIsLoading(false);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const provider = urlParams.get("provider") as "google" | "github" | null;
    if (code && provider) handleOAuthCallback(code, provider);
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: "include", // important for cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsPremium(
          data.user.subscriptionPlan === "premium" &&
          data.user.subscriptionStatus === "active"
        );
      } else {
        console.warn("Failed to fetch user profile (keeping token for now)");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data (useful after subscription changes)
  const refreshUserData = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 👈 ensures cookie is stored
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }

      await fetchUserProfile(data.token);
      router.push("/");
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  // Signup
  const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    termsAccepted: boolean
  ) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, termsAccepted }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Signup failed");

      await login(email, password);
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    }
  };

  // OAuth login redirect
  const oauthLogin = (provider: "google" | "github") => {
    window.location.href = `/api/auth/${provider}-login`;
  };

  // OAuth callback
  const handleOAuthCallback = async (code: string, provider: "google" | "github") => {
    try {
      const res = await fetch(`/api/auth/oauth-callback?code=${code}&provider=${provider}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        await fetchUserProfile(data.token);
        router.replace("/");
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }); // 👈 clear server cookie
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) setUser({ ...user, ...userData });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, oauthLogin, logout, updateUser, isLoading, isPremium, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
