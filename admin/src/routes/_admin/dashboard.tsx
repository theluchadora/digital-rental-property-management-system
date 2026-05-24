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
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
  });

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers,
      icon: Users,
      hint: `${stats?.totalOwners ?? 0} owners · ${stats?.totalTenants ?? 0} tenants`,
      accent: "from-blue-500/10 to-transparent",
    },
    {
      label: "Properties",
      value: stats?.totalProperties,
      icon: Building2,
      hint: "Root listings on platform",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      label: "Active Leases",
      value: stats?.activeLeases,
      icon: FileText,
      hint: `${stats?.totalLeases ?? 0} total leases`,
      accent: "from-violet-500/10 to-transparent",
    },
    {
      label: "Revenue (paid)",
      value:
        stats?.totalRevenue !== undefined
          ? `${stats.totalRevenue.toLocaleString()} ETB`
          : "—",
      icon: Receipt,
      hint: "All-time collected",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      label: "Pending Invoices",
      value: stats?.pendingInvoices,
      icon: TrendingUp,
      hint: "Unpaid · overdue · review",
      accent: "from-orange-500/10 to-transparent",
    },
    {
      label: "Open Maintenance",
      value: stats?.openMaintenance,
      icon: Wrench,
      hint: "OPEN + IN_PROGRESS",
      accent: "from-rose-500/10 to-transparent",
    },
    {
      label: "Open Incidents",
      value: stats?.openIncidents,
      icon: ShieldAlert,
      hint: "Needs admin review",
      accent: "from-red-500/10 to-transparent",
    },
    {
      label: "Suspended Users",
      value: stats?.suspendedUsers,
      icon: AlertTriangle,
      hint: "Access restricted",
      accent: "from-slate-500/10 to-transparent",
    },
  ];

  return (
    <>
      <PageHeader
        title="Command Center"
        description="Live platform health, revenue, and operational load."
      />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-gradient-to-r from-primary/5 via-card to-secondary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">API</span>
            <span className="text-muted-foreground">
              {stats?.systemHealth?.api ?? (isLoading ? "…" : "healthy")}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">Database</span>
            <span className="text-muted-foreground">
              {stats?.systemHealth?.database ?? (isLoading ? "…" : "healthy")}
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
          {cards.map((c) => (
            <Card
              key={c.label}
              className={`overflow-hidden border-border/70 bg-gradient-to-br ${c.accent}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                      {c.value ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.hint}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Paid invoices, last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
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
            <CardContent className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {(stats?.recentActivity ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                stats?.recentActivity?.map((item) => (
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
                ))
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
            <CardContent className="h-72">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance by Status</CardTitle>
              <CardDescription>Across all properties</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
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
                  {stats?.unreadNotifications ?? 0} system-wide alerts
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
