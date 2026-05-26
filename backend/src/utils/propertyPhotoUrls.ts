/** Hosts/patterns that must never be shown as listing photos. */
const BLOCKED_HOST_FRAGMENTS = [
  "tinkercad.com",
  "placehold.co",
  "via.placeholder.com",
  "placeholder.com",
  "dummyimage.com",
];

const BLOCKED_PATH_FRAGMENTS = ["/assets/", "/mock/", "unsplash.com/photo-1545324418"];

export function isUsablePropertyPhotoUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") && !trimmed.startsWith("data:image/")) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (BLOCKED_HOST_FRAGMENTS.some((h) => lower.includes(h))) return false;
  if (BLOCKED_PATH_FRAGMENTS.some((p) => lower.includes(p))) return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("/")
  );
}

export function filterPropertyPhotoUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!isUsablePropertyPhotoUrl(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}
