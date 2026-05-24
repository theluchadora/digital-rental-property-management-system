import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authStorage } from "@/lib/auth-storage";
import { authApi } from "@/api/services";
import type { User } from "@/api/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authStorage.getUser();
    if (!stored) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => {
        if (u.role !== "ADMIN") {
          authStorage.clearSession();
          setUser(null);
        } else {
          authStorage.setSession(
            authStorage.getAccessToken() ?? "session",
            authStorage.getRefreshToken() ?? "session",
            u,
          );
          setUser(u);
        }
      })
      .catch(() => {
        authStorage.clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.user.role !== "ADMIN")
      throw new Error("Only admins can sign in here.");
    authStorage.setSession(res.accessToken, res.refreshToken, res.user);
    setUser(res.user);
  };

  const logout = () => {
    authApi.logout().catch(() => undefined);
    authStorage.clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
