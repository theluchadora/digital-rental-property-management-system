import type { User } from "@/api/types";

const ACCESS = "admin_access_token";
const REFRESH = "admin_refresh_token";
const USER = "admin_user";

const isBrowser = () => typeof window !== "undefined";

export const authStorage = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    const token = localStorage.getItem(ACCESS);
    if (token && token.includes("mock")) {
      this.clearSession();
      return null;
    }
    return token;
  },
  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(REFRESH);
  },
  getUser(): User | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  setSession(accessToken: string, refreshToken: string, user: User) {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  clearSession() {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },
};
