import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../api/client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  goal: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, goal?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const applySession = (token: string, user: User) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; user: User }>("/auth/login", { email, password });
    applySession(res.data.token, res.data.user);
  };

  const register = async (email: string, password: string, name: string, goal?: string) => {
    const res = await apiClient.post<{ token: string; user: User }>("/auth/register", {
      email,
      password,
      name,
      goal,
    });
    applySession(res.data.token, res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
