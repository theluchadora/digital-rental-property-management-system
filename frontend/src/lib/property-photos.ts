import { appConfig } from "@/lib/app-config";
import type { Property, PropertyPhoto } from "@/types/api";
import { propertiesApi } from "@/lib/api/properties";
import { unitsApi } from "@/lib/api/units";

const BLOCKED_URL_FRAGMENTS = [
  "tinkercad.com",
  "placehold.co",
  "via.placeholder.com",
  "placeholder.com",
  "dummyimage.com",
];

/** Reject junk / placeholder URLs — never show as property photos. */
export function isUsablePropertyPhotoUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (BLOCKED_URL_FRAGMENTS.some((f) => lower.includes(f))) return false;
  if (trimmed.startsWith("data:") && !trimmed.startsWith("data:image/")) {
    return false;
  }
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("/")
  );
}

/** Turn relative upload paths into absolute URLs for <img src>. */
export function resolvePhotoUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("data:image/")) return url;
  if (url.startsWith("/")) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${url}`;
  }
  const base = appConfig.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const root = base.startsWith("http") ? base : origin;
  return `${root}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Normalize API photos into display URLs (no placeholders). */
export function getPropertyPhotoUrls(
  photos?: (string | PropertyPhoto)[] | null
): string[] {
  if (!photos?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of photos) {
    const raw = typeof p === "string" ? p : p?.url;
    if (!isUsablePropertyPhotoUrl(raw)) continue;
    const resolved = resolvePhotoUrl(raw);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(resolved);
  }
  return out;
}

export function getPropertyCoverUrl(
  property: Pick<Property, "photos">
): string | null {
  const urls = getPropertyPhotoUrls(property.photos);
  return urls[0] ?? null;
}

function unwrapProperty(payload: unknown): Property | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.id && typeof p.id === "string") return payload as Property;
  if (p.property && typeof p.property === "object") return p.property as Property;
  if (p.unit && typeof p.unit === "object") return p.unit as Property;
  if (p.data && typeof p.data === "object") {
    const d = p.data as Record<string, unknown>;
    if (d.property) return d.property as Property;
    if (d.id) return d.data as Property;
  }
  return null;
}

/**
 * Load a listing with the same photo rules as the owner property API
 * (building gallery + unit photos, filtered consistently).
 */
export async function fetchPropertyListing(
  id: string
): Promise<Property | null> {
  try {
    const response = await propertiesApi.getById(id, { detail: true });
    const fromProps = unwrapProperty(response);
    if (fromProps) return fromProps;
  } catch {
    // fall through
  }

  try {
    const response = await unitsApi.getById(id);
    return unwrapProperty(response);
  } catch {
    return null;
  }
}
