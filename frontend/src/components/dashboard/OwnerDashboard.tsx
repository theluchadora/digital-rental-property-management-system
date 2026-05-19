import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Home, TrendingUp, FileText, CreditCard, Wrench, Mail, MoreVertical, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi } from "@/lib/api/dashboard";

const propertyPerformance: any[] = [];

const allActivity: any[] = [];

function downloadCSV(data: typeof propertyPerformance, filename: string) {
  const header = "Asset Name,Location,Revenue (MTD),Change,Occupancy\n";
  const rows = data.map(p => `"${p.name}","${p.location}","${p.revenue}","${p.change}",${p.occupancy}%`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard", "owner-stats"],
    queryFn: dashboardApi.getOwnerStats,
  });

  const statsList = [
    { label: "PROPERTIES", value: statsData?.propertiesCount ?? "—", sub: "TOTAL OWNED", icon: Building2, color: "text-secondary" },
    { label: "TOTAL SPACE", value: statsData?.unitsCount ?? "—", unit: "UNITS", sub: "ACROSS PORTFOLIO", icon: Home },
    { label: "OCCUPANCY", value: `${statsData?.occupancyRate ?? 0}%`, sub: null, icon: TrendingUp, color: "text-secondary", showBar: true },
    { label: "ACTIVE LEASES", value: statsData?.activeLeasesCount ?? "—", sub: "CURRENTLY SIGNED", icon: FileText },
  ];

  return (
    <div>
      <div className="mb-2 flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time performance and liquidity metrics.</p>
        </div>
        <div className="text-left sm:text-right text-sm text-muted-foreground">
          <p className="text-xs uppercase">Last Synced</p>
          <p className="font-semibold text-foreground">Just now</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        {statsList.map((s, i) => (
          <Card key={i} className="border-l-2 border-l-transparent first:border-l-secondary">
            <CardContent className="p-3 md:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl md:text-3xl font-bold ${s.color || "text-foreground"}`}>
                {s.value} {s.unit && <span className="text-xs md:text-sm font-normal text-muted-foreground">{s.unit}</span>}
              </p>
              {s.showBar && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-secondary" style={{ width: `${statsData?.occupancyRate ?? 0}%` }} />
                </div>
              )}
              {s.sub && <p className="mt-1 text-xs text-secondary">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
        <Card className="border-l-2 border-l-destructive bg-destructive/5">
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">URGENT</p>
            <p className="mt-1 text-2xl md:text-3xl font-bold text-destructive">
              {statsData?.urgentRequestsCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-destructive">⚠ REQUIRES ACTION</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table + Activity */}
      <div className="mt-6 md:mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg">Property Performance</CardTitle>
              <Button
                variant="link"
                className="text-secondary p-0 h-auto text-sm"
                onClick={() => downloadCSV(propertyPerformance, "property_performance_report.csv")}
              >
                <Download className="mr-1 h-3 w-3" /> DOWNLOAD REPORT
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-3 font-medium">Asset Name</th>
                      <th className="pb-3 font-medium">Revenue (MTD)</th>
                      <th className="pb-3 font-medium">Occupancy</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {propertyPerformance.map((p, i) => (
                      <tr key={i} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/properties/prop-00${i + 4}`)}>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover hidden sm:block" loading="lazy" />
                            <div>
                              <p className="font-medium text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="font-medium">{p.revenue}</p>
                          <p className={`text-xs ${p.change.startsWith("+") ? "text-success" : "text-destructive"}`}>{p.change}</p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 md:w-20 rounded-full bg-muted">
                              <div className="h-1.5 rounded-full bg-secondary" style={{ width: `${p.occupancy}%` }} />
                            </div>
                            <span className="text-sm">{p.occupancy}%</span>
                          </div>
                        </td>
                        <td className="py-4" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="text-secondary text-xs" onClick={() => navigate(`/properties/prop-00${i + 4}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {allActivity.slice(0, 4).map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className={`mt-0.5 ${a.color}`}><a.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                  {a.badge && <Badge variant="destructive" className="mt-1 text-[10px]">{a.badge}</Badge>}
                  <p className="mt-1 text-[10px] text-secondary">{a.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => setShowAllActivity(true)}>VIEW ALL ACTIVITY</Button>
          </CardContent>
        </Card>
      </div>

      {/* All Activity Dialog */}
      <Dialog open={showAllActivity} onOpenChange={setShowAllActivity}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>All Activity</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {allActivity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className={`mt-0.5 ${a.color}`}><a.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                  {a.badge && <Badge variant="destructive" className="mt-1 text-[10px]">{a.badge}</Badge>}
                  <p className="mt-1 text-[10px] text-secondary">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Portfolio Insights Report</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">AI-generated portfolio analysis based on current data.</p>
            <Card><CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Revenue Growth Opportunities</h3>
              <p className="text-sm text-muted-foreground">Our analysis has identified a 12% revenue growth opportunity across your commercial holdings. Key recommendations:</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Increase rents on 8 underpriced units across Vanguard Plaza</li>
                <li>Convert 3 vacant ground-floor units to short-term rentals</li>
                <li>Renegotiate utility contracts for 15% savings</li>
              </ul>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Occupancy Optimization</h3>
              <p className="text-sm text-muted-foreground">Current portfolio occupancy: 96%. Target: 98%.</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Marble Arch Lofts: 2 units available — consider reduced deposit promotion</li>
                <li>Vanguard Plaza: 11 units below market rate</li>
              </ul>
            </CardContent></Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA Banner */}
      {showBanner && (
        <div className="mt-6 md:mt-8 relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-primary/75" />
          <div className="absolute bottom-0 left-0 p-4 md:p-8">
            <h3 className="text-lg md:text-2xl font-bold italic text-primary-foreground">Optimizing Portfolio Yield<br className="hidden md:block" /> Through Data-Driven Insights</h3>
            <p className="mt-2 max-w-lg text-xs md:text-sm text-primary-foreground/70 hidden sm:block">
              Our AI has identified a 12% revenue growth opportunity across your commercial holdings.
            </p>
            <div className="mt-3 md:mt-4 flex gap-3">
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setShowReport(true)}>VIEW REPORT</Button>
              <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setShowBanner(false)}>DISMISS</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
