import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Info, CreditCard, Wrench, Settings, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { messagesApi } from "@/lib/api/messages";
import { subscribeToEvent } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types/api";

const iconMap: Record<string, typeof Info> = {
  INVOICE: CreditCard,
  MAINTENANCE: Wrench,
  MESSAGE: Bell,
  ANNOUNCEMENT: AlertTriangle,
  LEASE: FileText,
  SYSTEM: Settings,
  INCIDENT: AlertTriangle,
};

const colorMap: Record<string, string> = {
  INVOICE: "text-secondary",
  MAINTENANCE: "text-warning",
  MESSAGE: "text-secondary",
  ANNOUNCEMENT: "text-warning",
  LEASE: "text-secondary",
  SYSTEM: "text-muted-foreground",
  INCIDENT: "text-destructive",
};

function getNotificationRoute(n: Notification): string {
  const entityId = n.entityId;
  switch (n.type) {
    case "INVOICE":
      return entityId ? `/payments?invoice=${entityId}` : "/payments";
    case "MAINTENANCE":
      return "/maintenance";
    case "MESSAGE":
      return "/messages";
    case "ANNOUNCEMENT":
      return "/announcements";
    case "LEASE":
      return entityId ? `/leases/${entityId}` : "/leases";
    case "INCIDENT":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

function decrementSidebarNotificationCount(
  queryClient: ReturnType<typeof useQueryClient>
) {
  queryClient.setQueriesData<{ notifications?: number }>(
    { queryKey: ["sidebar-badges"] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        notifications: Math.max(0, (old.notifications ?? 0) - 1),
      };
    }
  );
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEvent("NEW_NOTIFICATION", (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
      const n = data as { title?: string; message?: string; content?: string; type?: string };
      const title = n?.title || "New notification";
      const body = n?.message || n?.content || "";
      toast({
        title,
        description: body ? String(body).slice(0, 120) : undefined,
      });
    });
    return unsubscribe;
  }, [queryClient, toast]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ isRead: false }),
    refetchInterval: false,
  });

  const unreadCount = notifications.length;

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<Notification[]>(["notifications"]);
      queryClient.setQueryData<Notification[]>(["notifications"], (old = []) =>
        old.filter((n) => n.id !== notificationId)
      );
      decrementSidebarNotificationCount(queryClient);
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
    },
  });

  const markAllRead = async () => {
    const unread = [...notifications];
    if (unread.length === 0) return;

    await queryClient.cancelQueries({ queryKey: ["notifications"] });
    const previous = queryClient.getQueryData<Notification[]>(["notifications"]);
    queryClient.setQueryData<Notification[]>(["notifications"], []);
    queryClient.setQueriesData<{ notifications?: number }>(
      { queryKey: ["sidebar-badges"] },
      (old) => (old ? { ...old, notifications: 0 } : old)
    );

    try {
      await Promise.all(unread.map((n) => notificationsApi.markRead(n.id)));
    } catch (e) {
      if (previous) queryClient.setQueryData(["notifications"], previous);
      queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
      console.error("Failed to mark all notifications read:", e);
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    setOpen(false);

    if (n.type === "MESSAGE" && n.entityId) {
      try {
        const { data } = await messagesApi.getById(n.entityId);
        const senderId = data.message?.senderId;
        if (senderId) {
          navigate(`/messages?userId=${senderId}`);
          return;
        }
      } catch (e) {
        console.error("Error fetching message for notification navigation:", e);
      }
    }

    navigate(getNotificationRoute(n));
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const displayTitle = (n: Notification) => {
    const t = (n as Notification & { title?: string }).title;
    if (t) return t;
    return n.type.replace(/_/g, " ");
  };

  const displayMessage = (n: Notification) => {
    return n.message || (n as Notification & { content?: string }).content || "";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative text-muted-foreground hover:text-foreground" type="button" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-secondary h-auto p-0" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n) => {
              const Icon = iconMap[n.type] || Info;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                    !n.isRead ? "bg-secondary/5" : ""
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colorMap[n.type] || "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{displayTitle(n)}</p>
                    <p className="text-xs text-muted-foreground truncate">{displayMessage(n)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeSince(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="h-2 w-2 rounded-full bg-secondary mt-1.5 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
