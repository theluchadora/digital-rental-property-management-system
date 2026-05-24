import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, CreditCard, Wrench, Bell, Calendar, Building2, ArrowRight, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { announcementsApi } from "@/lib/api/announcements";
import { dashboardApi } from "@/lib/api/dashboard";
import { Announcement } from "@/types/api";
import { markAnnouncementAsRead } from "@/lib/announcement-read";
import { StatsGridSkeleton, CardGridSkeleton } from "@/components/ui/loading-state";

export default function TenantDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read announcements tracking from localStorage
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("read_announcements") || "[]");
    } catch {
      return [];
    }
  });

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboard", "tenant-stats"],
    queryFn: dashboardApi.getTenantStats,
  });

  const activeLease = statsData?.activeLease ?? null;

  useEffect(() => {
    announcementsApi.list({ limit: 20 })
      .then((res) => {
        setAnnouncements(res.data?.data || []);
      })
      .catch(() => {
        setAnnouncements([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleOpenAnnouncement = (a: Announcement) => {
    setSelectedAnnouncement(a);
    if (!readAnnouncementIds.includes(a.id)) {
      const updated = [...readAnnouncementIds, a.id];
      setReadAnnouncementIds(updated);
      markAnnouncementAsRead(a.id, queryClient);
      announcementsApi.markNotificationsRead({ title: a.title }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome Back, {user?.firstName || "Julian"}
        </h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with your tenancy.</p>
      </div>

      {isStatsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Active Rent</p>
              <p className="text-sm md:text-lg font-bold text-foreground truncate">
                ${statsData?.currentRentAmount?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block">Per Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-destructive/10 shrink-0">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Payment Due</p>
              <p className="text-sm md:text-lg font-bold text-destructive">
                {statsData?.daysUntilDue != null
                  ? statsData.daysUntilDue <= 0
                    ? "Due now"
                    : `In ${statsData.daysUntilDue} days`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block">Upcoming Invoice</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-warning/10 shrink-0">
              <Wrench className="h-4 w-4 md:h-5 md:w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Requests</p>
              <p className="text-sm md:text-lg font-bold text-foreground">
                {statsData?.pendingRequestsCount ?? "—"}
              </p>
              <p className="text-xs text-warning hidden sm:block">Maintenance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unread Alerts</p>
              <p className="text-sm md:text-lg font-bold text-foreground">
                {statsData?.unreadMessagesCount ?? "—"}
              </p>
              <p className="text-xs text-secondary hidden sm:block">Messages & Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Lease Summary + Announcements */}
      <div className="mt-6 md:mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" /> Current Lease Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Property",
                value: activeLease?.property?.title || "—",
              },
              {
                label: "Location",
                value:
                  [activeLease?.property?.city, activeLease?.property?.address]
                    .filter(Boolean)
                    .join(", ") || "—",
              },
              {
                label: "Monthly Rent",
                value: activeLease
                  ? `$${activeLease.monthlyRent.toLocaleString()}`
                  : "—",
              },
              {
                label: "Security Deposit",
                value: activeLease?.depositAmount
                  ? `$${activeLease.depositAmount.toLocaleString()}`
                  : "—",
              },
              {
                label: "Lease Term",
                value: activeLease
                  ? `${new Date(activeLease.startDate).toLocaleDateString()} — ${new Date(activeLease.endDate).toLocaleDateString()}`
                  : "—",
              },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-right">{item.value}</span>
              </div>
            ))}
            {activeLease && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-secondary/10 text-secondary">{activeLease.status}</Badge>
              </div>
            )}
            {activeLease ? (
              <Link to={`/leases/${activeLease.id}`}>
                <Button className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90" size="sm">
                  View Full Lease <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button disabled className="w-full mt-4" size="sm">
                No Active Lease
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-secondary" /> Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent announcements.</p>
            ) : (
              announcements.map((a) => {
                const isUnread = !readAnnouncementIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border p-3 md:p-4 cursor-pointer hover:bg-secondary/5 transition duration-150 flex flex-col gap-1 relative overflow-hidden"
                    onClick={() => handleOpenAnnouncement(a)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        {isUnread && (
                          <ChevronRight className="h-4 w-4 text-warning shrink-0" />
                        )}
                        {a.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {a.content}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Announcement Modal Dialog */}
      <Dialog open={selectedAnnouncement !== null} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Bell className="h-5 w-5 text-secondary shrink-0" /> {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription className="text-xs flex items-center justify-between text-muted-foreground border-b pb-2 mb-2">
              <span>By {selectedAnnouncement?.owner?.firstName || "Management"}</span>
              <span>{selectedAnnouncement && new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-foreground whitespace-pre-line leading-relaxed">
            {selectedAnnouncement?.content}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setSelectedAnnouncement(null)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
