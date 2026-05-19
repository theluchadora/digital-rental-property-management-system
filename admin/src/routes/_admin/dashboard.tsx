import { createFileRoute } from "@tanstack/react-router";
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
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
  });

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers,
      icon: Users,
      hint: `${stats?.totalOwners ?? 0} owners · ${stats?.totalTenants ?? 0} tenants`,
    },
    {
      label: "Properties",
      value: stats?.totalProperties,
      icon: Building2,
      hint: "Across portfolio",
    },
    {
      label: "Active Leases",
      value: stats?.activeLeases,
      icon: FileText,
      hint: `${stats?.totalLeases ?? 0} total`,
    },
    {
      label: "Revenue (paid)",
      value:
        stats?.totalRevenue !== undefined
          ? `${stats.totalRevenue.toLocaleString()} ETB`
          : "—",
      icon: Receipt,
      hint: "All-time",
    },
    {
      label: "Pending Invoices",
      value: stats?.pendingInvoices,
      icon: TrendingUp,
      hint: "Need review",
    },
    {
      label: "Open Maintenance",
      value: stats?.openMaintenance,
      icon: Wrench,
      hint: "OPEN + IN_PROGRESS",
    },
    {
      label: "Unread Alerts",
      value: stats?.unreadNotifications,
      icon: Bell,
      hint: "Incidents & helps",
    },
    {
      label: "Suspended Users",
      value: 0,
      icon: AlertTriangle,
      hint: "Action required",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of platform activity and key metrics."
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {c.value ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.hint}
                    </p>
                  </div>
                  <div className="rounded-md bg-secondary/15 p-2 text-secondary">
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
        </div>

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
    </>
  );
}
