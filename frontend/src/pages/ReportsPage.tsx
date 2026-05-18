import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Download, PieChart, TrendingUp, Building2, Calendar, FileText } from "lucide-react";

import { reportsApi } from "@/lib/api/reports";
import { propertiesApi } from "@/lib/api/properties";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ReportsPage() {
  const [propertyId, setPropertyId] = useState<string>("ALL");
  const [monthsBack, setMonthsBack] = useState<string>("6");

  const { data: propertiesData } = useQuery({
    queryKey: ["properties", "owner-list"],
    queryFn: () => propertiesApi.list({ limit: 100 }).then(res => res.data),
  });

  const properties = propertiesData?.data || [];

  // Calculate date range
  const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const startDate = format(startOfMonth(subMonths(new Date(), parseInt(monthsBack) - 1)), "yyyy-MM-dd");

  const { data: cashFlow, isLoading: isCashFlowLoading } = useQuery({
    queryKey: ["reports", "cash-flow", startDate, endDate, propertyId],
    queryFn: () => reportsApi.getCashFlow({
      startDate,
      endDate,
      propertyId: propertyId === "ALL" ? undefined : propertyId,
    }),
  });

  const { data: propertyStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["reports", "property-stats", propertyId],
    queryFn: () => reportsApi.getPropertyStats(propertyId),
    enabled: propertyId !== "ALL",
  });

  const handleExport = () => {
    if (!cashFlow) return;
    
    // Create simple CSV
    const header = "Category,Amount (ETB)\n";
    const rows = [
      `Total Income,${cashFlow.totalIncome}`,
      `Total Expenses,${cashFlow.totalExpenses}`,
      `Net Cash Flow,${cashFlow.netCashFlow}`
    ].join("\n");
    
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash_flow_report_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert income by property to array for chart
  const incomeChartData = cashFlow ? Object.entries(cashFlow.incomeByProperty).map(([propName, amount]) => ({
    name: propName.length > 15 ? propName.substring(0, 15) + "..." : propName,
    income: amount
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase text-foreground">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">Analyze your portfolio's cash flow and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={monthsBack} onValueChange={setMonthsBack}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger className="w-56">
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Properties</SelectItem>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} disabled={!cashFlow}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-success">Total Income</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {isCashFlowLoading ? "..." : `${cashFlow?.totalIncome?.toLocaleString() || 0} ETB`}
                </p>
              </div>
              <div className="rounded-full bg-success/20 p-3 text-success">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-destructive">Total Expenses</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {isCashFlowLoading ? "..." : `${cashFlow?.totalExpenses?.toLocaleString() || 0} ETB`}
                </p>
              </div>
              <div className="rounded-full bg-destructive/20 p-3 text-destructive">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-secondary">Net Cash Flow</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {isCashFlowLoading ? "..." : `${cashFlow?.netCashFlow?.toLocaleString() || 0} ETB`}
                </p>
              </div>
              <div className="rounded-full bg-secondary/20 p-3 text-secondary">
                <PieChart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income by Property</CardTitle>
            <CardDescription>{startDate} to {endDate}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isCashFlowLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : incomeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} ETB`, 'Income']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No income data for this period</div>
            )}
          </CardContent>
        </Card>

        {propertyId !== "ALL" && (
          <Card>
            <CardHeader>
              <CardTitle>Property Performance</CardTitle>
              <CardDescription>Selected property stats</CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" /></div>
              ) : propertyStats ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy Rate</span>
                      <span className="font-semibold">{propertyStats.occupancyRate}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-success" style={{ width: `${propertyStats.occupancyRate}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{propertyStats.occupiedUnits} of {propertyStats.totalUnits} units occupied</p>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Leases</span>
                      <span className="font-medium">{propertyStats.activeLeases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending Revenue</span>
                      <span className="font-medium text-warning">{propertyStats.pendingRevenue.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Open Maintenance</span>
                      <span className="font-medium text-destructive">{propertyStats.openMaintenanceRequests} requests</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">No property data available</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
