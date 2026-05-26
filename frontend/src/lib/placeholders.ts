export const propertyImages = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
] as const;

export function getPropertyImage(index = 0): string {
  return propertyImages[((index % propertyImages.length) + propertyImages.length) % propertyImages.length];
}

/** @deprecated Do not use for listings — return null and show empty state instead. */
export function getEntityImage(
  imageUrl: string | null | undefined,
  _fallbackIndex = 0
): string | null {
  return imageUrl?.trim() || null;
}
