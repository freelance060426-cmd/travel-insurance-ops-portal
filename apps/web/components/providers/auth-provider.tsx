"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCurrentUser, login } from "@/lib/api";
import type { AuthUser } from "@/lib/api";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/auth-store";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialToken = null,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(initialToken ? false : true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = window.localStorage.getItem(AUTH_USER_KEY);

    if (!storedToken && initialToken) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, initialToken);
      if (initialUser) {
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(initialUser));
      }
      return;
    }

    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setToken(storedToken);

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }

    fetchCurrentUser(storedToken)
      .then((currentUser) => {
        setUser(currentUser);
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      })
      .catch(() => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.localStorage.removeItem(AUTH_USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [initialToken, initialUser]);

  async function signIn(payload: { email: string; password: string }) {
    const result = await login(payload);
    setToken(result.accessToken);
    setUser(result.user);
    window.localStorage.setItem(AUTH_TOKEN_KEY, result.accessToken);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
    document.cookie = `${AUTH_TOKEN_KEY}=${result.accessToken}; Path=/; SameSite=Lax`;
  }

  function signOut() {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      signIn,
      signOut,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
