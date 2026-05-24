import type { QueryClient } from "@tanstack/react-query";
import { applyAnnouncementsRead } from "@/lib/sidebar-badges-cache";

const STORAGE_KEY = "read_announcements";

export function getReadAnnouncementIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isAnnouncementRead(id: string): boolean {
  return getReadAnnouncementIds().includes(id);
}

export function markAnnouncementAsRead(id: string, queryClient?: QueryClient): void {
  const read = getReadAnnouncementIds();
  if (read.includes(id)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...read, id]));
  if (queryClient) applyAnnouncementsRead(queryClient, 1);
}

export function markAnnouncementsAsRead(ids: string[], queryClient?: QueryClient): void {
  if (ids.length === 0) return;
  const read = getReadAnnouncementIds();
  const newlyRead = ids.filter((id) => !read.includes(id));
  const updated = [...new Set([...read, ...ids])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (queryClient && newlyRead.length > 0) {
    applyAnnouncementsRead(queryClient, newlyRead.length);
  }
}
