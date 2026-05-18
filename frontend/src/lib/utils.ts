import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// helper functions:

export function formatDate(
  date?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "—";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  
  return dateObj.toLocaleDateString(undefined, options || defaultOptions);
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUserName(user?: { firstName?: string; lastName?: string; email?: string }): string {
  if (!user) return "—";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  return user.email || "—";
}