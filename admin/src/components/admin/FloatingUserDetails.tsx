import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, CheckCircle2, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { propertiesApi, leasesApi, invoicesApi } from "@/api/services";
import type { User } from "@/api/types";

interface Props {
  user: User | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: "ACTIVE" | "SUSPENDED") => void;
}

export function FloatingUserDetails({ user, onClose, onUpdateStatus }: Props) {
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["admin_properties", user?.id],
    queryFn: () => propertiesApi.list({ ownerId: user?.id }),
    enabled: !!user && user.role === "OWNER",
  });

  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["admin_leases", user?.id],
    queryFn: () => leasesApi.list({ tenantId: user?.id }),
    enabled: !!user && user.role === "TENANT",
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["admin_invoices", user?.id],
    // For invoices, if it's a tenant we might filter by leaseId later, but we'll fetch all and filter client side or backend might handle tenantId.
    // Assuming backend invoices list can filter by tenantId (often true in such architectures) or we just show a placeholder if not supported directly.
    queryFn: () => invoicesApi.list({ tenantId: user?.id }),
    enabled: !!user && user.role === "TENANT",
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
      {/* Click-away backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <Card className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-primary/20 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">User Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-medium text-primary">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties" disabled={user.role !== "OWNER"}>
                Properties
              </TabsTrigger>
              <TabsTrigger value="leases" disabled={user.role !== "TENANT"}>
                Leases
              </TabsTrigger>
              <TabsTrigger value="invoices" disabled={user.role !== "TENANT"}>
                Invoices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium border-b pb-2">
                  Information
                </h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Role</div>
                  <div>
                    <StatusBadge value={user.role} />
                  </div>
                  <div className="text-muted-foreground">Status</div>
                  <div>
                    <StatusBadge value={user.accountStatus} />
                  </div>
                  <div className="text-muted-foreground">Phone</div>
                  <div>{user.phoneNumber || "Not provided"}</div>
                  <div className="text-muted-foreground">Joined</div>
                  <div>{format(new Date(user.createdAt), "PPP")}</div>
                </div>
              </div>

              {user.role !== "ADMIN" && (
                <div className="space-y-3 pt-6 border-t">
                  <h4 className="text-sm font-medium text-destructive">
                    Danger Zone
                  </h4>
                  <div className="flex flex-col gap-2">
                    {user.accountStatus === "SUSPENDED" ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-green-600 hover:text-green-700"
                        onClick={() => onUpdateStatus(user.id, "ACTIVE")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Activate User
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => onUpdateStatus(user.id, "SUSPENDED")}
                      >
                        <Ban className="mr-2 h-4 w-4" /> Suspend User
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="properties">
              <div className="space-y-4">
                {isLoadingProperties ? (
                  <p className="text-sm text-muted-foreground">
                    Loading properties...
                  </p>
                ) : properties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No properties associated with this owner.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {properties.map((p) => (
                      <Card
                        key={p.id}
                        className="p-4 flex justify-between items-center bg-muted/20"
                      >
                        <div>
                          <p className="font-medium text-sm">{p.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.addressCity}
                            {p.addressStreet ? `, ${p.addressStreet}` : ""}
                          </p>
                        </div>
                        <StatusBadge value={p.status} />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="leases">
              <div className="space-y-4">
                {isLoadingLeases ? (
                  <p className="text-sm text-muted-foreground">
                    Loading leases...
                  </p>
                ) : leases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No leases associated with this tenant.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {leases.map((l) => (
                      <Card
                        key={l.id}
                        className="p-4 flex justify-between items-center bg-muted/20"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            Lease #{l.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rent: ${l.monthlyRent} |{" "}
                            {format(new Date(l.startDate), "MMM yyyy")} -{" "}
                            {format(new Date(l.endDate), "MMM yyyy")}
                          </p>
                        </div>
                        <StatusBadge value={l.status} />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              <div className="space-y-4">
                {isLoadingInvoices ? (
                  <p className="text-sm text-muted-foreground">
                    Loading invoices...
                  </p>
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No invoices associated with this tenant.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {invoices.map((inv) => (
                      <Card
                        key={inv.id}
                        className="p-4 flex justify-between items-center bg-muted/20"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            Invoice #{inv.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Amount: ${inv.amountDue} | Due:{" "}
                            {format(new Date(inv.dueDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <StatusBadge value={inv.status} />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
