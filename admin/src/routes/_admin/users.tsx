import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, MoreHorizontal, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FloatingUserDetails } from "@/components/admin/FloatingUserDetails";
import {
  TableEmptyRow,
  TableErrorRow,
  TableSkeletonRows,
} from "@/components/admin/LoadingBlocks";
import { usersApi } from "@/api/services";
import { format } from "date-fns";
import type { User } from "@/api/types";
import { Download, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_admin/users")({
  head: () => ({ meta: [{ title: "Users — Estate Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: usersResult, isLoading, isError } = useQuery({
    queryKey: ["users", role, statusFilter, search],
    queryFn: () =>
      usersApi.list({
        role,
        status: statusFilter,
        q: search,
      }),
  });
  const users = usersResult?.users ?? [];
  const totalUsers = usersResult?.total ?? 0;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "+251900000001",
    password: "",
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setSelectedIds(new Set());
      toast.success("User removed");
    },
    onError: () => toast.error("Failed to remove user"),
  });

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "SUSPENDED";
    }) => usersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[];
      status: "ACTIVE" | "SUSPENDED";
    }) => usersApi.bulkUpdateStatus(ids, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setSelectedIds(new Set());
      toast.success(`Updated ${data.count} users`);
    },
    onError: () => toast.error("Failed to update users"),
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => usersApi.bulkDelete(ids),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setSelectedIds(new Set());
      toast.success(`Deleted ${data.count} users`);
    },
    onError: () => toast.error("Failed to delete users"),
  });

  const createAdmin = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.createAdmin(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Admin created successfully");
      setIsInviteOpen(false);
      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "+251900000001",
        password: "",
      });
    },
    onError: () => toast.error("Failed to create admin"),
  });

  const filtered = users;

  const allSelected =
    filtered.length > 0 && selectedIds.size === filtered.length;
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Joined",
    ];
    const rows = filtered.map((u) => [
      u.id,
      u.firstName,
      u.lastName,
      u.email,
      u.phoneNumber || "",
      u.role,
      u.accountStatus,
      new Date(u.createdAt).toISOString(),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAdmin.mutate(adminForm);
  };

  return (
    <>
      <PageHeader
        title="All Users"
        description="Every account on the platform — owners, tenants, and admins."
      />
      <div className="space-y-4 p-6 pb-24 relative">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, phone…"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="OWNER">Owners</SelectItem>
              <SelectItem value="TENANT">Tenants</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {isLoading
                ? "Loading…"
                : `${filtered.length} shown · ${totalUsers} total`}
            </span>
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateAdmin}>
                  <DialogHeader>
                    <DialogTitle>Create Administrator</DialogTitle>
                    <DialogDescription>
                      Invite a new user to help manage the platform. They will
                      have full administrative access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          required
                          value={adminForm.firstName}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          required
                          value={adminForm.lastName}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={adminForm.email}
                        onChange={(e) =>
                          setAdminForm({ ...adminForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone</Label>
                      <Input
                        id="phoneNumber"
                        required
                        value={adminForm.phoneNumber}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            phoneNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Temporary Password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={8}
                        value={adminForm.password}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={createAdmin.isPending}>
                      {createAdmin.isPending ? "Creating..." : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableSkeletonRows rows={8} columns={8} />}
              {isError && !isLoading && (
                <TableErrorRow
                  colSpan={8}
                  message="Could not load users. Sign in as admin and ensure the API is running."
                />
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <TableEmptyRow
                  colSpan={8}
                  message="No users match your filters."
                />
              )}
              {!isLoading &&
                !isError &&
                filtered.map((u) => {
                const isSelected = selectedIds.has(u.id);
                return (
                  <TableRow
                    key={u.id}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(u.id)}
                        aria-label="Select row"
                        disabled={u.role === "ADMIN"}
                      />
                    </TableCell>
                    <TableCell
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => setViewingUser(u)}
                    >
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.phoneNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={u.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={u.accountStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingUser(u)}>
                            View details
                          </DropdownMenuItem>
                          {u.role !== "ADMIN" && (
                            <>
                              <DropdownMenuSeparator />
                              {u.accountStatus === "SUSPENDED" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({
                                      id: u.id,
                                      status: "ACTIVE",
                                    })
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-amber-600 focus:text-amber-600"
                                  onClick={() =>
                                    updateStatus.mutate({
                                      id: u.id,
                                      status: "SUSPENDED",
                                    })
                                  }
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove user?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove {u.firstName}{" "}
                                      {u.lastName}. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        remove.mutate(u.id);
                                        document.body.click(); // close dropdown
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Floating Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ml-32 z-50 animate-in slide-in-from-bottom-5">
            <Card className="flex items-center gap-4 px-4 py-3 shadow-lg border-primary/20 bg-background/95 backdrop-blur">
              <span className="text-sm font-medium">
                {selectedIds.size} user{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() =>
                    bulkUpdateStatus.mutate({
                      ids: Array.from(selectedIds),
                      status: "SUSPENDED",
                    })
                  }
                  disabled={bulkUpdateStatus.isPending}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() =>
                    bulkUpdateStatus.mutate({
                      ids: Array.from(selectedIds),
                      status: "ACTIVE",
                    })
                  }
                  disabled={bulkUpdateStatus.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activate
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete {selectedIds.size} users?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete these users and cannot be
                        undone. Users with active properties or leases will not
                        be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          bulkDelete.mutate(Array.from(selectedIds))
                        }
                        className="bg-destructive"
                      >
                        Yes, delete them
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 ml-2"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {viewingUser && (
          <FloatingUserDetails
            user={viewingUser}
            onClose={() => setViewingUser(null)}
            onUpdateStatus={(id, status) => {
              updateStatus.mutate({ id, status });
              setViewingUser(null);
            }}
          />
        )}
      </div>
    </>
  );
}
