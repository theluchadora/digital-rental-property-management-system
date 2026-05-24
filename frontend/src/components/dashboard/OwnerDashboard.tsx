import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Home,
  TrendingUp,
  FileText,
  Wrench,
  Mail,
  DollarSign,
  Download,
  ArrowRight,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate, Link } from "react-router-dom";
import { dashboardApi, type PropertyPerformanceRow } from "@/lib/api/dashboard";
import { StatsGridSkeleton } from "@/components/ui/loading-state";
import { formatDistanceToNow } from "date-fns";

function downloadCSV(data: PropertyPerformanceRow[], filename: string) {
  const header = "Asset Name,Location,Status,Occupancy,Monthly Rent\n";
  const rows = data
    .map(
      (p) =>
        `"${p.name}","${p.location}","${p.status}",${p.occupancy}%,"${p.monthlyRent ?? ""}"`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const activityIcon = {
  lease: FileText,
  maintenance: Wrench,
  payment: DollarSign,
};

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [showAllActivity, setShowAllActivity] = useState(false);

  const { data: overview, isLoading } = useQuery({
    queryKey: ["dashboard", "owner-overview"],
    queryFn: dashboardApi.getOwnerOverview,
  });

  const stats = overview?.stats;
  const propertyPerformance = overview?.propertyPerformance ?? [];
  const activities = overview?.activities ?? [];

  const statsList = [
    {
      label: "PROPERTIES",
      value: stats?.propertiesCount ?? "—",
      sub: "PORTFOLIO",
      icon: Building2,
      color: "text-secondary",
    },
    {
      label: "RENTABLE UNITS",
      value: stats?.unitsCount ?? "—",
      sub: "HOUSES & UNITS",
      icon: Home,
    },
    {
      label: "OCCUPANCY",
      value: `${stats?.occupancyRate ?? 0}%`,
      sub: null,
      icon: TrendingUp,
      color: "text-secondary",
      showBar: true,
    },
    {
      label: "ACTIVE LEASES",
      value: stats?.activeLeasesCount ?? "—",
      sub: "SIGNED",
      icon: FileText,
    },
    {
      label: "REVENUE (MTD)",
      value: stats?.revenueMTD != null ? `$${stats.revenueMTD.toLocaleString()}` : "—",
      sub: "PAID INVOICES",
      icon: DollarSign,
      color: "text-secondary",
    },
  ];

  const quickLinks = [
    {
      label: "Pending applications",
      count: stats?.pendingApplicationsCount ?? 0,
      href: "/leases",
      icon: Users,
    },
    {
      label: "Open maintenance",
      count: stats?.openMaintenanceCount ?? 0,
      href: "/maintenance",
      icon: Wrench,
    },
    {
      label: "Unpaid invoices",
      count: stats?.unpaidInvoicesCount ?? 0,
      href: "/payments",
      icon: DollarSign,
    },
    {
      label: "Unread messages",
      count: stats?.unreadMessagesCount ?? 0,
      href: "/messages",
      icon: Mail,
    },
  ];

  return (
    <div>
      <div className="mb-2 flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground">
            Live counts from your properties, leases, payments, and maintenance.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6">
          <StatsGridSkeleton count={5} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6">
          {statsList.map((s, i) => (
            <Card key={i} className="border-l-2 border-l-transparent first:border-l-secondary">
              <CardContent className="p-3 md:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className={`mt-1 text-2xl md:text-3xl font-bold ${s.color || "text-foreground"}`}>
                  {s.value}
                </p>
                {s.showBar && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-secondary"
                      style={{ width: `${stats?.occupancyRate ?? 0}%` }}
                    />
                  </div>
                )}
                {s.sub && <p className="mt-1 text-xs text-secondary">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
          <Card className="border-l-2 border-l-destructive bg-destructive/5">
            <CardContent className="p-3 md:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                URGENT
              </p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-destructive">
                {stats?.urgentRequestsCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-destructive">Maintenance</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      {!isLoading && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickLinks.map((q) => (
            <Link key={q.href} to={q.href}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardContent className="flex items-center gap-3 p-4">
                  <q.icon className="h-5 w-5 text-secondary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{q.label}</p>
                    <p className="text-xl font-bold text-foreground">{q.count}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 md:mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg">Properties</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/properties")}>
                  View all
                </Button>
                {propertyPerformance.length > 0 && (
                  <Button
                    variant="link"
                    className="text-secondary p-0 h-auto text-sm"
                    onClick={() =>
                      downloadCSV(propertyPerformance, "property_overview.csv")
                    }
                  >
                    <Download className="mr-1 h-3 w-3" /> Export
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {propertyPerformance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>No properties yet.</p>
                  <Button className="mt-4" size="sm" onClick={() => navigate("/properties/new")}>
                    Add your first property
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-3 font-medium">Property</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Rent</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {propertyPerformance.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/properties/${p.id}`)}
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="h-10 w-10 rounded object-cover hidden sm:block"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted hidden sm:flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-foreground">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.location}</p>
                                {p.tenantName && (
                                  <p className="text-xs text-secondary">{p.tenantName}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge
                              variant={
                                p.status === "OCCUPIED" ? "default" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {p.status}
                            </Badge>
                            {p.pendingApplication && (
                              <Badge variant="outline" className="ml-1 text-[10px]">
                                Application
                              </Badge>
                            )}
                          </td>
                          <td className="py-4">
                            {p.monthlyRent != null ? (
                              <p className="font-medium">${p.monthlyRent.toLocaleString()}/mo</p>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-4" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-secondary text-xs"
                              onClick={() => navigate(`/properties/${p.id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              activities.slice(0, 5).map((a) => {
                const Icon = activityIcon[a.type];
                return (
                  <button
                    key={a.id}
                    type="button"
                    className="flex w-full gap-3 text-left hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => navigate(a.href)}
                  >
                    <Icon className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                      {a.badge && (
                        <Badge variant="destructive" className="mt-1 text-[10px]">
                          {a.badge}
                        </Badge>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(a.time), { addSuffix: true })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                  </button>
                );
              })
            )}
            {activities.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-2"
                size="sm"
                onClick={() => setShowAllActivity(true)}
              >
                View all activity
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAllActivity} onOpenChange={setShowAllActivity}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {activities.map((a) => {
              const Icon = activityIcon[a.type];
              return (
                <button
                  key={a.id}
                  type="button"
                  className="flex w-full gap-3 text-left hover:bg-muted/50 rounded-lg p-2 transition-colors"
                  onClick={() => {
                    setShowAllActivity(false);
                    navigate(a.href);
                  }}
                >
                  <Icon className="h-5 w-5 text-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                    {a.badge && (
                      <Badge variant="destructive" className="mt-1 text-[10px]">
                        {a.badge}
                      </Badge>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.time), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
