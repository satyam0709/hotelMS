"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { adminLogin, adminLogout, getAdminMe } from "@/lib/api/admin-auth";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await getAdminMe();
      setAdmin(me || null);
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAdmin(null);
        return null;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } catch {
        setAdmin(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const user = await adminLogin(credentials);
    setAdmin(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } finally {
      setAdmin(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      loading,
      login,
      logout,
      refresh,
      isAuthenticated: Boolean(admin),
    }),
    [admin, loading, login, logout, refresh]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
