import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, RegisterPayload } from "@/lib/api/auth";
import { authStorage } from "@/lib/auth-storage";
import type { User } from "@/types/api";
import { getApiErrorMessage } from "@/lib/api-error-handler";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by fetching profile
    const checkAuth = async () => {
      const storedUser = authStorage.getUser();
      if (storedUser) {
        // Verify with backend
        try {
          const { data } = await authApi.getProfile();
          setUser(data);
          authStorage.setUser(data);
        } catch {
          // Session expired
          authStorage.clearSession();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authApi.login({ email, password });
      setUser(data.user);
      authStorage.setUser(data.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      const response = await authApi.register(data);
      setUser(response.data);
      authStorage.setUser(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authStorage.clearSession();
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authStorage.setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};