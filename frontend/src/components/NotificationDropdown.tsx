import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Info, CreditCard, Wrench, Settings, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { messagesApi } from "@/lib/api/messages";
import { subscribeToEvent } from "@/lib/websocket";
import type { Notification } from "@/types/api";


const iconMap: Record<string, typeof Info> = {
  INVOICE: CreditCard,
  MAINTENANCE: Wrench,
  MESSAGE: Bell,
  ANNOUNCEMENT: AlertTriangle,
  LEASE: FileText,
  SYSTEM: Settings,
};

const colorMap: Record<string, string> = {
  INVOICE: "text-secondary",
  MAINTENANCE: "text-warning",
  MESSAGE: "text-secondary",
  ANNOUNCEMENT: "text-warning",
  LEASE: "text-secondary",
  SYSTEM: "text-muted-foreground",
};

const routeMap: Record<string, string> = {
  INVOICE: "/payments",
  MAINTENANCE: "/maintenance",
  MESSAGE: "/messages",
  ANNOUNCEMENT: "/dashboard",
  LEASE: "/leases",
  SYSTEM: "/settings",
};

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEvent("NEW_NOTIFICATION", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: notificationData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ isRead: false }),
    refetchInterval: false,
  });

  const notifications = notificationData?.data?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = () => {
    // For now, we manually mark them one by one if there isn't a bulk endpoint
    notifications.forEach(n => {
      if (!n.isRead) markReadMutation.mutate(n.id);
    });
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

    navigate(routeMap[n.type] || "/dashboard");
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative text-muted-foreground hover:text-foreground">
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
            notifications.map(n => {
              const Icon = iconMap[n.type] || Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                    !n.isRead ? "bg-secondary/5" : ""
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colorMap[n.type] || "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
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
