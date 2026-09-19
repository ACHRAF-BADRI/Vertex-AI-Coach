import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "../api/client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status?: "active" | "suspended";
  goal: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  gym_saved_plan_limit?: number | null;
  created_at?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, goal?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (input: { name?: string; goal?: string; weight_kg?: number; height_cm?: number }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem("token");
      setUser(null);
      navigate("/suspended");
    };
    window.addEventListener("auth:suspended", handler);
    return () => window.removeEventListener("auth:suspended", handler);
  }, [navigate]);

  useEffect(() => {
    const handler = () => {
      const hadToken = Boolean(localStorage.getItem("token"));
      localStorage.removeItem("token");
      setUser(null);
      if (hadToken) {
        toast.error(t("login.sessionExpiredToast"));
      }
      navigate("/login");
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [navigate, t]);

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

  const updateProfile = async (input: { name?: string; goal?: string; weight_kg?: number; height_cm?: number }) => {
    const res = await apiClient.patch<User>("/auth/me", input);
    setUser(res.data);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiClient.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
