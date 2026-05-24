import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/api/notifications";
import { messagesApi } from "@/lib/api/messages";
import { announcementsApi } from "@/lib/api/announcements";
import { leasesApi } from "@/lib/api/leases";
import { subscribeToEvent } from "@/lib/websocket";
import { getReadAnnouncementIds } from "@/lib/announcement-read";

export function useSidebarBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!user;

  useEffect(() => {
    if (!enabled) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    };
    const unsubNotif = subscribeToEvent("NEW_NOTIFICATION", invalidate);
    const unsubMsg = subscribeToEvent("NEW_MESSAGE", invalidate);
    return () => {
      unsubNotif();
      unsubMsg();
    };
  }, [enabled, queryClient]);

  const { data: badges } = useQuery({
    queryKey: ["sidebar-badges", user?.id, user?.role],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => {
      const [notifications, convRes, annRes] = await Promise.all([
        notificationsApi.list({ isRead: false }),
        messagesApi.getConversations(),
        announcementsApi.list({ limit: 50 }).catch(() => ({ data: { data: [] as { id: string }[] } })),
      ]);

      const conversations = convRes.data?.conversations || [];
      const unreadMessages = conversations.filter(
        (c) => c.lastMessage?.receiverId === user!.id && !c.lastMessage?.readAt
      ).length;

      const readIds = getReadAnnouncementIds();
      const announcements = annRes.data?.data || [];
      const unreadAnnouncements = announcements.filter((a) => !readIds.includes(a.id)).length;

      let pendingLeases = 0;
      let awaitingPayment = 0;
      if (user!.role === "OWNER") {
        const leaseRes = await leasesApi.list({ limit: 200 });
        const leases = leaseRes.data?.data || [];
        pendingLeases = leases.filter((l) => l.status === "INITIATED").length;
      } else if (user!.role === "TENANT") {
        const leaseRes = await leasesApi.list({ limit: 200 });
        const leases = leaseRes.data?.data || [];
        awaitingPayment = leases.filter((l) => l.status === "AWAITINGPAYMENT").length;
      }

      return {
        notifications: notifications.length,
        messages: unreadMessages,
        announcements: unreadAnnouncements,
        leases: user!.role === "OWNER" ? pendingLeases : awaitingPayment,
      };
    },
  });

  return {
    notifications: badges?.notifications ?? 0,
    messages: badges?.messages ?? 0,
    announcements: badges?.announcements ?? 0,
    leases: badges?.leases ?? 0,
  };
}
