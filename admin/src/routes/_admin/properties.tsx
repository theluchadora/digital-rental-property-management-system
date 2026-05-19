import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, Trash2, Archive, AlertTriangle } from "lucide-react";
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
import { propertiesApi } from "@/api/services";
import { FloatingPropertyDetails } from "@/components/admin/FloatingPropertyDetails";
import type { Property, PaginatedResponse } from "@/api/types";

export const Route = createFileRoute("/_admin/properties")({
  head: () => ({ meta: [{ title: "Properties — Estate Admin" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.list(),
  });

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

  const bulkUpdateStatus = useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[];
      status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DELETED";
    }) => propertiesApi.bulkUpdateStatus(ids, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      setSelectedIds(new Set());
      toast.success(`Updated ${data.count} properties`);
    },
    onError: () => toast.error("Failed to update properties"),
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => propertiesApi.bulkDelete(ids),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      setSelectedIds(new Set());
      toast.success(`Deleted ${data.count} properties`);
    },
    onError: () => toast.error("Failed to delete properties"),
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    const propsList = Array.isArray(data)
      ? data
      : (data as unknown as PaginatedResponse<Property>).data || [];
    return propsList.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.addressCity.toLowerCase().includes(s) ||
        (p.addressStreet ?? "").toLowerCase().includes(s) ||
        p.owner?.firstName.toLowerCase().includes(s) ||
        p.owner?.lastName.toLowerCase().includes(s),
    );
  }, [data, search]);

  const allSelected =
    filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
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
      "Title",
      "Type",
      "City",
      "Street",
      "Owner",
      "Status",
      "Registered",
    ];
    const rows = filtered.map((p) => [
      p.id,
      p.title,
      p.type,
      p.addressCity,
      p.addressStreet || "",
      p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : "",
      p.status,
      new Date(p.createdAt || new Date()).toISOString(),
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
      `properties_export_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Properties"
        description="All buildings and vehicles registered on the platform."
      />
      <div className="space-y-4 p-6 relative pb-24">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title, city, owner…"
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
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewingProperty(p)}
                  data-state={selectedIds.has(p.id) ? "selected" : undefined}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => {}}
                      onClick={(e) => toggleOne(p.id, e as React.MouseEvent)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {p.title}
                      <div className="text-xs text-muted-foreground font-normal">
                        {p.addressStreet}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={p.type} />
                  </TableCell>
                  <TableCell>{p.addressCity}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={p.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No properties found
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
                  onClick={() =>
                    bulkUpdateStatus.mutate({
                      ids: Array.from(selectedIds),
                      status: "INACTIVE",
                    })
                  }
                >
                  <Archive className="mr-2 h-4 w-4" /> Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    bulkUpdateStatus.mutate({
                      ids: Array.from(selectedIds),
                      status: "MAINTENANCE",
                    })
                  }
                >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Maintenance
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete these properties?",
                      )
                    ) {
                      bulkDelete.mutate(Array.from(selectedIds));
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </Card>
          </div>
        )}

        <FloatingPropertyDetails
          property={viewingProperty}
          onClose={() => setViewingProperty(null)}
          onUpdateStatus={(id, status) => {
            bulkUpdateStatus.mutate({ ids: [id], status });
            setViewingProperty(null);
          }}
        />
      </div>
    </>
  );
}
