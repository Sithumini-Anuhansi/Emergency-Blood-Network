import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if there's a stored token and rehydrate user
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("ebn_token");
      const storedUser = localStorage.getItem("ebn_user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token is still valid against the backend
          await api.get("/auth/me");
        } catch {
          localStorage.removeItem("ebn_token");
          localStorage.removeItem("ebn_user");
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const userData = { _id: data._id, fullName: data.fullName, email: data.email, role: data.role };
    localStorage.setItem("ebn_token", data.token);
    localStorage.setItem("ebn_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    const userData = { _id: data._id, fullName: data.fullName, email: data.email, role: data.role };
    localStorage.setItem("ebn_token", data.token);
    localStorage.setItem("ebn_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("ebn_token");
    localStorage.removeItem("ebn_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};