import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem("fa_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("fa_token"))
      .finally(() => setLoading(false));
  }, []);

  const saveToken = useCallback((token) => {
    localStorage.setItem("fa_token", token);
  }, []);

  const login = useCallback((token, userData) => {
    saveToken(token);
    setUser(userData);
  }, [saveToken]);

  const logout = useCallback(() => {
    localStorage.removeItem("fa_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
