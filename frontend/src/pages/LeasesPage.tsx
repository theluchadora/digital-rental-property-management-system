import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Download, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { leasesApi } from "@/lib/api/leases";
import { LeaseActionButtons } from "@/components/LeaseActionButtons";
import TenantApplicantInfo from "@/components/TenantApplicantInfo";
import { PageLoader, StatsGridSkeleton, TableSkeleton } from "@/components/ui/loading-state";
import type { Lease } from "@/types/api";

const statusColors: Record<string, string> = {
  INITIATED: "bg-warning/10 text-warning border-warning/30",
  AWAITINGPAYMENT: "bg-warning/10 text-warning border-warning/30",
  ACTIVE: "bg-secondary/10 text-secondary border-secondary/30",
  DRAFT: "bg-muted text-muted-foreground border-border",
  EXPIRED: "bg-destructive/10 text-destructive border-destructive/30",
  TERMINATED: "bg-foreground/10 text-foreground border-foreground/30",
};

const ITEMS_PER_PAGE = 4;

export default function LeasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.role === "OWNER";
  
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadLeases() {
      setIsLoading(true);
      try {
        const response = await leasesApi.list({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        });
        const data = response.data.data || [];
        setLeases(data);
      } catch (err) {
        console.error("Failed to load leases:", err);
        toast({ title: "Failed to load leases", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadLeases();
  }, [statusFilter, toast]);

  const filteredLeases = leases;

  const totalPages = Math.max(1, Math.ceil(filteredLeases.length / ITEMS_PER_PAGE));
  const paginatedLeases = filteredLeases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const annualContractValue = leases.filter(l => l.status === "ACTIVE").reduce((acc, l) => acc + (l.monthlyRent * 12), 0);
  const activeLeasesCount = leases.filter(l => l.status === "ACTIVE").length;
  const expiringSoonCount = leases.filter(l => {
    if (l.status !== "ACTIVE") return false;
    const daysUntilExp = (new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExp > 0 && daysUntilExp <= 60;
  }).length;

  const exportCSV = () => {
    const header = "Lease ID,Tenant,Unit,Monthly Rent,Start,End,Status\n";
    const rows = filteredLeases.map(l =>
      `"${l.id}","${l.tenant?.firstName} ${l.tenant?.lastName}","${l.unit?.unitIdentifier}",${l.monthlyRent},"${l.startDate}","${l.endDate}","${l.status}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leases_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Leases Exported" });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Lease Ledger</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Contract Management</p>
        </div>
        {isOwner && (
          <Link to="/leases/new">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Plus className="mr-2 h-4 w-4" /> CREATE LEASE
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6">
          <StatsGridSkeleton count={4} />
        </div>
      ) : (
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "ANNUAL CONTRACT VALUE", value: `$${annualContractValue.toLocaleString()}.00` },
          { label: "ACTIVE LEASES", value: activeLeasesCount.toString() },
          { label: "OCCUPANCY RATE", value: "—", color: "text-secondary" },
          { label: "EXPIRING SOON", value: expiringSoonCount.toString(), color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 md:p-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-xl md:text-2xl font-bold ${s.color || "text-foreground"}`}>
                {s.value}
                {s.change && <span className="ml-2 text-sm text-secondary">{s.change}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      <Card className="mt-6 md:mt-8">
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
          <CardTitle className="text-sm uppercase tracking-wider">Active Contract Registry</CardTitle>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm"><Filter className="mr-1 h-3 w-3" /> FILTER</Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Status</p>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="INITIATED">Initiated</SelectItem>
                    <SelectItem value="AWAITINGPAYMENT">Awaiting Payment</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-3 w-3" /> EXPORT</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} cols={7} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-4 font-medium">Lease ID</th>
                  <th className="p-4 font-medium">Tenant</th>
                  <th className="p-4 font-medium">Unit ID</th>
                  <th className="p-4 font-medium">Monthly Rent</th>
                  <th className="p-4 font-medium">Term Dates</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">#{lease.id.replace("lease-", "LSE-").toUpperCase()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {lease.tenant?.firstName?.[0] || ""}{lease.tenant?.lastName?.[0] || "T"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : lease.tenantEmail || "Applicant"}</p>
                          {isOwner && (lease.status === "INITIATED" || lease.status === "AWAITINGPAYMENT") ? (
                            <TenantApplicantInfo tenant={lease.tenant} compact />
                          ) : (
                            <p className="text-[10px] text-muted-foreground">
                              {lease.status === "ACTIVE" ? `Resident since ${new Date(lease.startDate).getFullYear()}` :
                               lease.status === "DRAFT" ? "New Applicant" :
                               lease.status === "EXPIRED" ? "Moved Out" : "Early Exit"}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{lease.unit?.unitIdentifier}</td>
                    <td className="p-4 font-medium">${lease.monthlyRent.toLocaleString()}.00</td>
                    <td className="p-4">
                      <p className="text-xs">
                        {new Date(lease.startDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()} —<br />
                        {new Date(lease.endDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}
                      </p>
                    </td>
                    <td className="p-4">
                      <Badge className={`text-[10px] ${statusColors[lease.status] || ""}`}>{lease.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/leases/${lease.id}`}>
                          <Button variant="ghost" size="sm" className="text-secondary text-xs">View</Button>
                        </Link>
                        <LeaseActionButtons
                          lease={lease}
                          compact
                          onLeaseUpdated={(updated) =>
                            setLeases((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p className="text-xs uppercase">Showing {paginatedLeases.length} of {filteredLeases.length} leases</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              size="icon"
              className={`h-8 w-8 ${page === currentPage ? "bg-secondary text-secondary-foreground" : ""}`}
              variant={page === currentPage ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
