import type { User } from "@/types/api";

const USER_KEY = "digital-estate:user";

export const authStorage = {
  getUser(): User | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem(USER_KEY);
  },
};