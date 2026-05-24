import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { messagesApi } from "@/api/services";
import {
  TableEmptyRow,
  TableErrorRow,
  TableSkeletonRows,
} from "@/components/admin/LoadingBlocks";
import { Mail, MailOpen } from "lucide-react";

export const Route = createFileRoute("/_admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Estate Admin" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["messages", "system"],
    queryFn: messagesApi.listSystem,
  });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (m) =>
        m.subject.toLowerCase().includes(s) ||
        m.content.toLowerCase().includes(s) ||
        m.sender.firstName.toLowerCase().includes(s) ||
        m.sender.lastName.toLowerCase().includes(s) ||
        m.receiver.firstName.toLowerCase().includes(s) ||
        m.receiver.lastName.toLowerCase().includes(s),
    );
  }, [data, search]);

  return (
    <>
      <PageHeader
        title="Messages"
        description="All conversations between users on the platform."
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by subject, content, sender or recipient…"
          />
          <span className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} results`}
          </span>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableSkeletonRows rows={8} columns={6} />}
              {isError && !isLoading && <TableErrorRow colSpan={6} />}
              {!isLoading &&
                !isError &&
                filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.readAt ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-secondary" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {m.sender.firstName} {m.sender.lastName}
                  </TableCell>
                  <TableCell>
                    {m.receiver.firstName} {m.receiver.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.subject}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(m.createdAt), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Open
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{m.subject}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                          <div className="text-muted-foreground">
                            {m.sender.firstName} {m.sender.lastName} →{" "}
                            {m.receiver.firstName} {m.receiver.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(m.createdAt), "PPpp")}
                          </div>
                          <div className="rounded-md border bg-muted/40 p-3 leading-relaxed">
                            {m.content}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !isError && filtered.length === 0 && (
                <TableEmptyRow colSpan={6} message="No messages found" />
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
