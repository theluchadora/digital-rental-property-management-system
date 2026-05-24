import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/admin/PageHeader";
import { reportsApi } from "@/api/services";
import { TrendingUp, AlertCircle, Building2, FileText } from "lucide-react";

export const Route = createFileRoute("/_admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Estate Admin" }] }),
  component: ReportsPage,
});

const PIE_COLORS = [
  "hsl(212 60% 22%)",
  "oklch(0.72 0.13 220)",
  "oklch(0.83 0.09 215)",
  "oklch(0.65 0.08 200)",
];

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: reportsApi.overview,
  });

  const kpis = [
    {
      label: "Revenue (MTD)",
      value: data ? `${data.revenueThisMonth.toLocaleString()} ETB` : "—",
      icon: TrendingUp,
      hint: `${data?.paidInvoicesThisMonth ?? 0} paid invoices`,
    },
    {
      label: "Revenue (YTD)",
      value: data ? `${data.revenueYtd.toLocaleString()} ETB` : "—",
      icon: TrendingUp,
      hint: "Year to date",
    },
    {
      label: "Outstanding",
      value: data ? `${data.outstandingAmount.toLocaleString()} ETB` : "—",
      icon: AlertCircle,
      hint: `${data?.outstandingCount ?? 0} unpaid/overdue`,
    },
    {
      label: "Top owner (YTD)",
      value: data?.topOwnersByRevenue?.[0]?.name ?? "—",
      icon: Building2,
      hint: data?.topOwnersByRevenue?.[0]
        ? `${data.topOwnersByRevenue[0].revenue.toLocaleString()} ETB`
        : "No paid invoices yet",
    },
  ];

  return (
    <>
      <PageHeader
        title="Platform Reports"
        description="Financial and operational insights across all owners and tenants."
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card
              key={k.label}
              className="border-border/60 bg-gradient-to-br from-card to-card/80 shadow-sm"
            >
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {k.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <k.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoices by status
              </CardTitle>
              <CardDescription>Platform-wide billing</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.invoicesByStatus ?? []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {(data?.invoicesByStatus ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
              <CardTitle>Leases by status</CardTitle>
              <CardDescription>Active pipeline vs terminated</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.leasesByStatus ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="oklch(0.72 0.13 220)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top owners by revenue (YTD)</CardTitle>
            <CardDescription>Based on paid invoices</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.topOwnersByRevenue ?? []}
                layout="vertical"
                margin={{ left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString()} ETB`, "Revenue"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(212 60% 28%)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
