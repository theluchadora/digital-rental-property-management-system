export function formatCurrency(amount: number | null | undefined, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", options).format(new Date(value));
}

export function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "—";
  return `${formatDate(start, { month: "short", day: "numeric", year: "numeric" })} — ${formatDate(end, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function formatRelativeAge(value: string | null | undefined): string {
  if (!value) return "Just now";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function formatUserName(user?: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
} | null): string {
  const parts = [user?.firstName, user?.middleName, user?.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown User";
}

export function getInitials(user?: {
  firstName?: string | null;
  lastName?: string | null;
} | null): string {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "NA";
}
