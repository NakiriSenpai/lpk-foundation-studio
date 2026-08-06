import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { getCurrentSession, signInWithPassword, signOut, toAuthUser } from "@/services/auth";
import type { AppRole, AuthState, LoginCredentials } from "@/types/auth";
import { ROLE_RANK } from "@/types/auth";

export type AuthContextValue = AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: readonly AppRole[]) => boolean;
  hasMinimumRole: (role: AppRole) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Listener didaftarkan lebih dulu, lalu restore session yang tersimpan.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    void getCurrentSession().then((restored) => {
      if (!active) return;
      setSession(restored);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const next = await signInWithPassword(credentials);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = toAuthUser(session);
    const role = user?.role ?? null;
    return {
      user,
      session,
      role,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      logout,
      hasRole: (target) => role === target,
      hasAnyRole: (roles) => (role ? roles.includes(role) : false),
      hasMinimumRole: (target) => (role ? ROLE_RANK[role] >= ROLE_RANK[target] : false),
    };
  }, [session, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
