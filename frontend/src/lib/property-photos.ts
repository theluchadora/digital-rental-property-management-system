import type { Property, PropertyPhoto } from "@/types/api";

/** Normalize API photos (string URLs or PropertyPhoto objects) into URL strings. */
export function getPropertyPhotoUrls(
  photos?: (string | PropertyPhoto)[] | null
): string[] {
  if (!photos?.length) return [];
  return photos
    .map((p) => (typeof p === "string" ? p : p?.url))
    .filter((url): url is string => Boolean(url));
}

export function getPropertyCoverUrl(property: Pick<Property, "photos">): string | null {
  const urls = getPropertyPhotoUrls(property.photos);
  return urls[0] ?? null;
}
