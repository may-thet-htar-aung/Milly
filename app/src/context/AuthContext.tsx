import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "../lib/api";
import type { AuthResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (body: { phone?: string | null; location?: string | null; email?: string; currentPassword?: string; newPassword?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const saveAuth = (result: AuthResponse, setUser: (user: User) => void) => {
  tokenStore.set(result);
  setUser(result.user);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.access && !tokenStore.refresh) {
      setLoading(false);
      return;
    }
    api.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => { tokenStore.clear(); setUser(null); }).finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) { const result = await api.login({ email, password }); saveAuth(result, setUser); return result.user; },
    async register(name, email, password) { saveAuth(await api.register({ name, email, password }), setUser); },
    async logout() { try { await api.logout(); } finally { tokenStore.clear(); setUser(null); } },
    async updateProfile(body) { const result = await api.updateProfile(body); setUser(result.data); return result.data; },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
