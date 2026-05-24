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
import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { notificationsApi } from "@/api/services";
import {
  TableEmptyRow,
  TableErrorRow,
  TableSkeletonRows,
} from "@/components/admin/LoadingBlocks";

export const Route = createFileRoute("/_admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Estate Admin" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["notifications", "system"],
    queryFn: notificationsApi.listSystem,
  });
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (n) =>
        (type === "ALL" || n.type === type) &&
        (n.message.toLowerCase().includes(s) ||
          (n.user
            ? `${n.user.firstName} ${n.user.lastName}`.toLowerCase().includes(s)
            : false)),
    );
  }, [data, search, type]);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Incident alerts, help requests and system messages."
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search notifications…"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="MESSAGE">Message</SelectItem>
              <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
              <SelectItem value="INVOICE">Invoice</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
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
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableSkeletonRows rows={8} columns={5} />}
              {isError && !isLoading && <TableErrorRow colSpan={5} />}
              {!isLoading &&
                !isError &&
                filtered.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">
                    {n.user ? `${n.user.firstName} ${n.user.lastName}` : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={n.type} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {n.message}
                  </TableCell>
                  <TableCell>
                    {n.isRead ? (
                      <span className="text-xs text-muted-foreground">
                        Read
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-secondary">
                        Unread
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(n.createdAt), "MMM d, HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !isError && filtered.length === 0 && (
                <TableEmptyRow colSpan={5} message="No notifications" />
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
