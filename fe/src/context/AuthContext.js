import { createContext, useContext, useEffect, useState } from "react";
import userService from "../services/user.service";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  const getProfile = async (currentToken) => {
    if (!currentToken) return null;

    try {
      const data = await userService.getMyProfile();
      const userData = data.user || data;
      const userRole = userData.role?.name || userData.role || null;
      setRole(userRole);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Lỗi lấy profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const savedToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      getProfile(savedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (newToken, remember) => {
    if (remember) {
      localStorage.setItem("token", newToken);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", newToken);
      localStorage.removeItem("token");
    }

    setToken(newToken);
    const profile = await getProfile(newToken);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await getProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, logout, role, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
