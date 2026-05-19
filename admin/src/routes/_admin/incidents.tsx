import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { incidentsApi } from "@/api/services";
import type { IncidentReport, IncidentEvidence } from "@/api/types";

export const Route = createFileRoute("/_admin/incidents")({
  head: () => ({ meta: [{ title: "Incident Reports — Estate Admin" }] }),
  component: IncidentsPage,
});

const urgencyOrder: Record<string, number> = {
  EMERGENCY: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function IncidentsPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery<IncidentReport[]>({
    queryKey: ["admin", "incidents"],
    queryFn: () => incidentsApi.list(),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [selected, setSelected] = useState<IncidentReport | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return [...data]
      .filter(
        (r) =>
          (statusFilter === "ALL" || r.status === statusFilter) &&
          (urgencyFilter === "ALL" || r.urgency === urgencyFilter) &&
          (r.description?.toLowerCase().includes(s) ||
            r.location?.toLowerCase().includes(s) ||
            r.reporter?.firstName?.toLowerCase().includes(s) ||
            r.reporter?.lastName?.toLowerCase().includes(s) ||
            r.incidentType?.toLowerCase().includes(s)),
      )
      .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }, [data, search, statusFilter, urgencyFilter]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: string;
      note: string;
    }) => incidentsApi.updateStatus(id, { status, adminNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "incidents"] });
      setSelected(null);
      setAdminNote("");
      setNewStatus("");
    },
  });

  const openDetail = (report: IncidentReport) => {
    setSelected(report);
    setAdminNote(report.adminNote || "");
    setNewStatus(report.status);
  };

  const urgencyColors: Record<string, string> = {
    EMERGENCY: "bg-destructive/10 text-destructive font-semibold",
    HIGH: "bg-orange-500/10 text-orange-600 font-medium",
    MEDIUM: "bg-yellow-500/10 text-yellow-700",
    LOW: "bg-muted text-muted-foreground",
  };

  const openCount = data.filter((r) => r.status === "OPEN").length;
  const emergencyCount = data.filter(
    (r) => r.urgency === "EMERGENCY" && r.status === "OPEN",
  ).length;

  return (
    <>
      <PageHeader
        title="Incident Reports"
        description="Review and moderate user-filed incident reports and help requests."
      />

      {/* Summary banner */}
      {(openCount > 0 || emergencyCount > 0) && (
        <div className="mx-6 mb-4 flex gap-3">
          {emergencyCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
              🚨 {emergencyCount} Emergency
              {emergencyCount > 1 ? " reports" : " report"} pending
            </div>
          )}
          {openCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
              📋 {openCount} open report{openCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by description, location, reporter…"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All urgencies</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} results
          </span>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Urgency</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className={
                    r.urgency === "EMERGENCY" ? "bg-destructive/5" : undefined
                  }
                >
                  <TableCell>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${urgencyColors[r.urgency] || ""}`}
                    >
                      {r.urgency}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">
                      {r.incidentType?.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.reportType}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.isAnonymous ? (
                      <span className="text-muted-foreground text-xs italic">
                        Anonymous
                      </span>
                    ) : (
                      <span>
                        {r.reporter?.firstName} {r.reporter?.lastName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">
                    {r.location}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(r)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No incident reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Detail / Moderation Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Incident Report
              {selected && (
                <span
                  className={`rounded px-2 py-0.5 text-xs ml-1 ${urgencyColors[selected.urgency] || ""}`}
                >
                  {selected?.urgency}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Type
                  </p>
                  <p className="font-medium">
                    {selected.incidentType?.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Category
                  </p>
                  <p>{selected.reportType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Reporter
                  </p>
                  <p>
                    {selected.isAnonymous
                      ? "Anonymous"
                      : `${selected.reporter?.firstName ?? ""} ${selected.reporter?.lastName ?? ""} (${selected.reporter?.email ?? ""})`}
                  </p>
                </div>
                {selected.reportedUser && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Reported User
                    </p>
                    <p>
                      {selected.reportedUser.firstName}{" "}
                      {selected.reportedUser.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Location
                  </p>
                  <p>{selected.location}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Incident Date
                  </p>
                  <p>
                    {selected.incidentDate}
                    {selected.incidentTime
                      ? ` at ${selected.incidentTime}`
                      : ""}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </p>
                <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                  {selected.description}
                </div>
              </div>

              {selected.witnesses && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Witnesses
                  </p>
                  <p>{selected.witnesses}</p>
                </div>
              )}

              {selected.againstPerson && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Person Involved
                  </p>
                  <p>{selected.againstPerson}</p>
                </div>
              )}

              {selected.evidence?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Evidence Files
                  </p>
                  <div className="space-y-1">
                    {selected.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between rounded border px-3 py-1.5 text-xs"
                      >
                        <span className="truncate">{ev.filePath}</span>
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL}/download/incident-evidence/${ev.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-secondary hover:underline shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.adminNote && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Previous Admin Note
                  </p>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    {selected.adminNote}
                  </div>
                </div>
              )}

              {/* Moderation controls */}
              {selected.status !== "RESOLVED" &&
                selected.status !== "DISMISSED" && (
                  <div className="space-y-3 border-t pt-4">
                    <Label>Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="UNDER_REVIEW">
                          Under Review
                        </SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="DISMISSED">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label>Admin Note (sent to reporter)</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a note for the reporter (optional)…"
                      rows={3}
                    />
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected?.status !== "RESOLVED" &&
              selected?.status !== "DISMISSED" && (
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selected.id,
                      status: newStatus,
                      note: adminNote,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
