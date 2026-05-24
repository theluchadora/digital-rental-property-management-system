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
import { ChartPanel, StatCard } from "@/components/admin/LoadingBlocks";
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: reportsApi.overview,
  });

  const kpis = [
    {
      label: "Revenue (MTD)",
      icon: TrendingUp,
      value: data ? `${data.revenueThisMonth.toLocaleString()} ETB` : undefined,
      hint: `${data?.paidInvoicesThisMonth ?? 0} paid invoices`,
    },
    {
      label: "Revenue (YTD)",
      icon: TrendingUp,
      value: data ? `${data.revenueYtd.toLocaleString()} ETB` : undefined,
      hint: "Year to date",
    },
    {
      label: "Outstanding",
      icon: AlertCircle,
      value: data ? `${data.outstandingAmount.toLocaleString()} ETB` : undefined,
      hint: `${data?.outstandingCount ?? 0} unpaid/overdue`,
    },
    {
      label: "Top owner (YTD)",
      icon: Building2,
      value: data?.topOwnersByRevenue?.[0]?.name,
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
        {isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Failed to load reports. Ensure the backend is running.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <StatCard
              key={k.label}
              label={k.label}
              icon={k.icon}
              accent="from-card to-card/80"
              isLoading={isLoading}
              value={k.value}
              hint={k.hint}
            />
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
            <CardContent>
              <ChartPanel
                isLoading={isLoading}
                isError={isError}
                variant="pie"
                empty={!isLoading && (data?.invoicesByStatus?.length ?? 0) === 0}
              >
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
              </ChartPanel>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leases by status</CardTitle>
              <CardDescription>Active pipeline vs terminated</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartPanel
                isLoading={isLoading}
                isError={isError}
                variant="bar"
                empty={!isLoading && (data?.leasesByStatus?.length ?? 0) === 0}
              >
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
              </ChartPanel>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top owners by revenue (YTD)</CardTitle>
            <CardDescription>Based on paid invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPanel
              isLoading={isLoading}
              isError={isError}
              heightClass="h-80"
              variant="horizontal-bar"
              empty={!isLoading && (data?.topOwnersByRevenue?.length ?? 0) === 0}
            >
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
                    formatter={(v: number) => [
                      `${v.toLocaleString()} ETB`,
                      "Revenue",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(212 60% 28%)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
