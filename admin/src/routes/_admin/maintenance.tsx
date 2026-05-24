import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { maintenanceApi } from "@/api/services";
import {
  TableEmptyRow,
  TableErrorRow,
  TableSkeletonRows,
} from "@/components/admin/LoadingBlocks";
import type { MaintenanceRequest } from "@/api/types";

export const Route = createFileRoute("/_admin/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance & Reports — Estate Admin" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["maintenance"],
    queryFn: maintenanceApi.list,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (m) =>
        (status === "ALL" || m.status === status) &&
        (priority === "ALL" || m.priority === priority) &&
        (m.category.toLowerCase().includes(s) ||
          m.tenant.firstName.toLowerCase().includes(s) ||
          m.tenant.lastName.toLowerCase().includes(s) ||
          m.unit.property.title.toLowerCase().includes(s)),
    );
  }, [data, search, status, priority]);

  return (
    <>
      <PageHeader
        title="Maintenance & Reports"
        description="Incident reports and maintenance requests from tenants."
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by tenant, property, category…"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} results`}
          </span>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableSkeletonRows rows={8} columns={7} />}
              {isError && !isLoading && <TableErrorRow colSpan={7} />}
              {!isLoading &&
                !isError &&
                filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.tenant.firstName} {m.tenant.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{m.unit.property.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.unit.unitIdentifier}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>
                    <StatusBadge value={m.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={m.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(m.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={selected?.id === m.id}
                      onOpenChange={(o) => setSelected(o ? m : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {m.category} · <StatusBadge value={m.priority} />
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Tenant:{" "}
                            </span>
                            {m.tenant.firstName} {m.tenant.lastName} (
                            {m.tenant.email})
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Unit:{" "}
                            </span>
                            {m.unit.property.title} — {m.unit.unitIdentifier}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Status:{" "}
                            </span>
                            <StatusBadge value={m.status} />
                          </div>
                          <div className="rounded-md border bg-muted/40 p-3">
                            {m.description}
                          </div>
                          {m.note && (
                            <div>
                              <span className="text-muted-foreground">
                                Note:{" "}
                              </span>
                              {m.note}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !isError && filtered.length === 0 && (
                <TableEmptyRow colSpan={7} message="No maintenance requests found" />
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
