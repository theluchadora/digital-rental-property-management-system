import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  FileText,
  Receipt,
  Wrench,
  Bell,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { statsApi } from "@/api/services";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  ActivityListSkeleton,
  ChartPanel,
  StatCard,
} from "@/components/admin/LoadingBlocks";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Estate Admin" }] }),
  component: DashboardPage,
});

const COLORS = [
  "hsl(212 60% 12%)",
  "oklch(0.72 0.13 220)",
  "oklch(0.83 0.09 215)",
];

function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
  });

  const statCards = [
    {
      label: "Total Users",
      icon: Users,
      accent: "from-blue-500/10 to-transparent",
      value: stats?.totalUsers,
      hint: `${stats?.totalOwners ?? 0} owners · ${stats?.totalTenants ?? 0} tenants`,
    },
    {
      label: "Properties",
      icon: Building2,
      accent: "from-emerald-500/10 to-transparent",
      value: stats?.totalProperties,
      hint: "Root listings on platform",
    },
    {
      label: "Active Leases",
      icon: FileText,
      accent: "from-violet-500/10 to-transparent",
      value: stats?.activeLeases,
      hint: `${stats?.totalLeases ?? 0} total leases`,
    },
    {
      label: "Revenue (paid)",
      icon: Receipt,
      accent: "from-amber-500/10 to-transparent",
      value:
        stats?.totalRevenue !== undefined
          ? `${stats.totalRevenue.toLocaleString()} ETB`
          : undefined,
      hint: "All-time collected",
    },
    {
      label: "Pending Invoices",
      icon: TrendingUp,
      accent: "from-orange-500/10 to-transparent",
      value: stats?.pendingInvoices,
      hint: "Unpaid · overdue · review",
    },
    {
      label: "Open Maintenance",
      icon: Wrench,
      accent: "from-rose-500/10 to-transparent",
      value: stats?.openMaintenance,
      hint: "OPEN + IN_PROGRESS",
    },
    {
      label: "Open Incidents",
      icon: ShieldAlert,
      accent: "from-red-500/10 to-transparent",
      value: stats?.openIncidents,
      hint: "Needs admin review",
    },
    {
      label: "Suspended Users",
      icon: AlertTriangle,
      accent: "from-slate-500/10 to-transparent",
      value: stats?.suspendedUsers,
      hint: "Access restricted",
    },
  ];

  return (
    <>
      <PageHeader
        title="Command Center"
        description="Live platform health, revenue, and operational load."
      />
      <div className="space-y-6 p-6">
        {isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Some dashboard data could not be loaded. Check that the backend is
            running.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-gradient-to-r from-primary/5 via-card to-secondary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">API</span>
            <span className="text-muted-foreground">
              {isLoading ? (
                <Skeleton className="inline-block h-4 w-16" />
              ) : (
                (stats?.systemHealth?.api ?? "healthy")
              )}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">Database</span>
            <span className="text-muted-foreground">
              {isLoading ? (
                <Skeleton className="inline-block h-4 w-16" />
              ) : (
                (stats?.systemHealth?.database ?? "healthy")
              )}
            </span>
          </div>
          <div className="ml-auto flex gap-2 text-sm">
            <Link
              to="/reports"
              className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90"
            >
              View reports
            </Link>
            <Link
              to="/users"
              className="rounded-md border px-3 py-1.5 font-medium hover:bg-muted"
            >
              Manage users
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((c) => (
            <StatCard
              key={c.label}
              label={c.label}
              icon={c.icon}
              accent={c.accent}
              isLoading={isLoading}
              value={c.value}
              hint={c.hint}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Paid invoices, last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartPanel
                isLoading={isLoading}
                isError={isError}
                variant="line"
                empty={!isLoading && (stats?.monthlyRevenue?.length ?? 0) === 0}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.monthlyRevenue ?? []}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.9 0.01 250)"
                    />
                    <XAxis dataKey="month" stroke="oklch(0.5 0.02 250)" />
                    <YAxis stroke="oklch(0.5 0.02 250)" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="oklch(0.72 0.13 220)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent activity
              </CardTitle>
              <CardDescription>Latest signups, leases, tickets</CardDescription>
            </CardHeader>
            <CardContent className="max-h-72 overflow-y-auto pr-1">
              {isLoading ? (
                <ActivityListSkeleton rows={5} />
              ) : (stats?.recentActivity ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats?.recentActivity?.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <p className="text-sm font-medium leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.subtitle} ·{" "}
                        {formatDistanceToNow(new Date(item.at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartPanel
                isLoading={isLoading}
                isError={isError}
                variant="pie"
                empty={!isLoading && (stats?.usersByRole?.length ?? 0) === 0}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.usersByRole ?? []}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(stats?.usersByRole ?? []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartPanel>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance by Status</CardTitle>
              <CardDescription>Across all properties</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartPanel
                isLoading={isLoading}
                isError={isError}
                variant="bar"
                empty={
                  !isLoading && (stats?.maintenanceByStatus?.length ?? 0) === 0
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.maintenanceByStatus ?? []}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.9 0.01 250)"
                    />
                    <XAxis dataKey="status" stroke="oklch(0.5 0.02 250)" />
                    <YAxis stroke="oklch(0.5 0.02 250)" />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="oklch(0.83 0.09 215)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Unread notifications</p>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-44" />
                  ) : (
                    `${stats?.unreadNotifications ?? 0} system-wide alerts`
                  )}
                </p>
              </div>
            </div>
            <Link
              to="/notifications"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open notifications →
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
