import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "../lib/api";
import type { AuthResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
    async login(email, password) { saveAuth(await api.login({ email, password }), setUser); },
    async register(name, email, password) { saveAuth(await api.register({ name, email, password }), setUser); },
    async logout() { try { await api.logout(); } finally { tokenStore.clear(); setUser(null); } },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
