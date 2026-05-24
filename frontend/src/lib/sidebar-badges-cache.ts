import type { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/api";

export type SidebarBadgeData = {
  notifications: number;
  messages: number;
  announcements: number;
  leases: number;
};

const defaultBadges = (): SidebarBadgeData => ({
  notifications: 0,
  messages: 0,
  announcements: 0,
  leases: 0,
});

export function patchSidebarBadges(
  queryClient: QueryClient,
  patch:
    | Partial<SidebarBadgeData>
    | ((old: SidebarBadgeData) => Partial<SidebarBadgeData>)
) {
  queryClient.setQueriesData<SidebarBadgeData>({ queryKey: ["sidebar-badges"] }, (old) => {
    const base = old ?? defaultBadges();
    const delta = typeof patch === "function" ? patch(base) : patch;
    return { ...base, ...delta };
  });
}

export function prependUnreadNotification(queryClient: QueryClient, notification: Notification) {
  queryClient.setQueryData<Notification[]>(["notifications"], (old = []) => {
    if (old.some((n) => n.id === notification.id)) return old;
    return [{ ...notification, isRead: false }, ...old];
  });
  patchSidebarBadges(queryClient, (old) => ({
    notifications: old.notifications + 1,
    ...(notification.type === "ANNOUNCEMENT"
      ? { announcements: old.announcements + 1 }
      : {}),
  }));
}

export function applyNotificationRead(queryClient: QueryClient, count = 1) {
  patchSidebarBadges(queryClient, (old) => ({
    notifications: Math.max(0, old.notifications - count),
  }));
}

export function applyAnnouncementsRead(queryClient: QueryClient, count = 1) {
  patchSidebarBadges(queryClient, (old) => ({
    announcements: Math.max(0, old.announcements - count),
  }));
}

export function clearAnnouncementBadge(queryClient: QueryClient) {
  patchSidebarBadges(queryClient, { announcements: 0 });
}
