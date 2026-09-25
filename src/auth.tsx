import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Account } from "./lib/api";

interface AuthState {
  user: Account | null;
  ready: boolean;
  setUser: (user: Account | null) => void;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false, setUser: () => undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.me().then((result) => setUser(result.user)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);

  return <AuthContext.Provider value={{ user, ready, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
