"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "customer" | "representative" | "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiClient.get("/users/profile");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        setError("An error occurred while loading user data");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
