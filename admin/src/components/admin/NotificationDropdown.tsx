import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  Info,
  CreditCard,
  Wrench,
  Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/services";
import type { Notification, PaginatedResponse } from "@/api/types";

const iconMap: Record<string, typeof Info> = {
  INVOICE: CreditCard,
  MAINTENANCE: Wrench,
  MESSAGE: Bell,
  ANNOUNCEMENT: AlertTriangle,
  SYSTEM: Settings,
};

const colorMap: Record<string, string> = {
  INVOICE: "text-secondary",
  MAINTENANCE: "text-warning",
  MESSAGE: "text-secondary",
  ANNOUNCEMENT: "text-warning",
  SYSTEM: "text-muted-foreground",
};

const routeMap: Record<string, string> = {
  INVOICE: "/payments",
  MAINTENANCE: "/maintenance",
  MESSAGE: "/messages",
  ANNOUNCEMENT: "/messages",
  SYSTEM: "/settings",
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationsApi.list();
      return Array.isArray(res)
        ? res
        : (res as unknown as PaginatedResponse<Notification>)?.data || [];
    },
    refetchInterval: false,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClick = (n: Notification) => {
    setOpen(false);
    navigate({ to: routeMap[n.type] || "/dashboard" });
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
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((n: Notification) => {
              const Icon = iconMap[n.type] || Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                    !n.isRead ? "bg-muted/30" : ""
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mt-0.5 shrink-0 ${colorMap[n.type] || "text-muted-foreground"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}
                    >
                      {n.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {timeSince(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
