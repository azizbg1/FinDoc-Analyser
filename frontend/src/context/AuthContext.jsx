import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const AuthCtx = createContext(null);

const STORAGE_KEY = "findoc_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post("http://localhost:8000/api/login", { email, password });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
