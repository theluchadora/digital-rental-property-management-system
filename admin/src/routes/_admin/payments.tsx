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
import { invoicesApi } from "@/api/services";

export const Route = createFileRoute("/_admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Estate Admin" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.list,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (i) =>
        (status === "ALL" || i.status === status) &&
        (i.lease.tenant.firstName.toLowerCase().includes(s) ||
          i.lease.tenant.lastName.toLowerCase().includes(s) ||
          i.lease.unit.property.title.toLowerCase().includes(s)),
    );
  }, [data, search, status]);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Invoices, receipts and payment status."
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by tenant or property…"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending review</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
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
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Billing Month</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">
                    {i.lease.tenant.firstName} {i.lease.tenant.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.lease.unit.property.title}
                  </TableCell>
                  <TableCell>
                    {format(new Date(i.billingMonth), "MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(i.dueDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{i.amountDue.toLocaleString()} ETB</TableCell>
                  <TableCell>
                    <StatusBadge value={i.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
