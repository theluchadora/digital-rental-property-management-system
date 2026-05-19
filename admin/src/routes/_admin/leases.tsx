import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, Ban, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { leasesApi } from "@/api/services";
import { FloatingLeaseDetails } from "@/components/admin/FloatingLeaseDetails";
import type { Lease, PaginatedResponse } from "@/api/types";

export const Route = createFileRoute("/_admin/leases")({
  head: () => ({ meta: [{ title: "Leases — Estate Admin" }] }),
  component: LeasesPage,
});

function LeasesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["leases"],
    queryFn: () => leasesApi.list(),
  });

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingLease, setViewingLease] = useState<Lease | null>(null);

  const bulkUpdateStatus = useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[];
      status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED";
    }) => leasesApi.bulkUpdateStatus(ids, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      setSelectedIds(new Set());
      toast.success(`Updated ${data.count} leases`);
    },
    onError: () => toast.error("Failed to update leases"),
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    const leaseList = Array.isArray(data)
      ? data
      : (data as unknown as PaginatedResponse<Lease>).data || [];
    return leaseList.filter(
      (l) =>
        l.tenant.firstName.toLowerCase().includes(s) ||
        l.tenant.lastName.toLowerCase().includes(s) ||
        l.unit.unitIdentifier.toLowerCase().includes(s) ||
        l.unit.property.title.toLowerCase().includes(s),
    );
  }, [data, search]);

  const allSelected =
    filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)));
    }
  };

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      "ID",
      "Tenant",
      "Property",
      "Unit",
      "Start Date",
      "End Date",
      "Monthly Rent",
      "Status",
    ];
    const rows = filtered.map((l) => [
      l.id,
      `${l.tenant.firstName} ${l.tenant.lastName}`,
      l.unit.property.title,
      l.unit.unitIdentifier,
      format(new Date(l.startDate), "yyyy-MM-dd"),
      format(new Date(l.endDate), "yyyy-MM-dd"),
      l.monthlyRent,
      l.status,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `leases_export_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Leases"
        description="All active and historical lease agreements."
      />
      <div className="space-y-4 p-6 relative pb-24">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by tenant, unit, property…"
          />
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} results
          </span>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewingLease(l)}
                  data-state={selectedIds.has(l.id) ? "selected" : undefined}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(l.id)}
                      onCheckedChange={() => {}}
                      onClick={(e) => toggleOne(l.id, e as React.MouseEvent)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {l.tenant.firstName} {l.tenant.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{l.unit.property.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {l.unit.unitIdentifier}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(l.startDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(l.endDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>${l.monthlyRent.toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge value={l.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No leases found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Floating Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-200">
            <Card className="flex items-center gap-4 px-6 py-3 shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <span className="text-sm font-medium border-r pr-4">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() =>
                    bulkUpdateStatus.mutate({
                      ids: Array.from(selectedIds),
                      status: "ACTIVE",
                    })
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={() =>
                    bulkUpdateStatus.mutate({
                      ids: Array.from(selectedIds),
                      status: "EXPIRED",
                    })
                  }
                >
                  <Clock className="mr-2 h-4 w-4" /> Expire
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to TERMINATE these leases? This is a permanent status change.",
                      )
                    ) {
                      bulkUpdateStatus.mutate({
                        ids: Array.from(selectedIds),
                        status: "TERMINATED",
                      });
                    }
                  }}
                >
                  <Ban className="mr-2 h-4 w-4" /> Terminate
                </Button>
              </div>
            </Card>
          </div>
        )}

        <FloatingLeaseDetails
          lease={viewingLease}
          onClose={() => setViewingLease(null)}
          onUpdateStatus={(id, status) => {
            bulkUpdateStatus.mutate({ ids: [id], status });
            setViewingLease(null);
          }}
        />
      </div>
    </>
  );
}
