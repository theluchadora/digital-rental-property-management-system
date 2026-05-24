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

export function markAnnouncementAsRead(id: string): void {
  const read = getReadAnnouncementIds();
  if (read.includes(id)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...read, id]));
}

export function markAnnouncementsAsRead(ids: string[]): void {
  if (ids.length === 0) return;
  const read = getReadAnnouncementIds();
  const updated = [...new Set([...read, ...ids])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
