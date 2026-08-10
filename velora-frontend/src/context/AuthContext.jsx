import { createContext, useContext, useState, useCallback } from "react";
import { saveSession, clearSession } from "../api/client";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());

  const login = useCallback((authResponseData) => {
    const savedUser = saveSession(authResponseData);
    setUser(savedUser || readStoredUser());
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const isAuthenticated = !!user && !!localStorage.getItem("accessToken");
  
  const role = (user?.role || "").toUpperCase();
  const isPolice = role === "POLICE" || role === "ROLE_POLICE";
  const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated, isPolice, isAdmin, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

