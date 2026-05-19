import React from "react";
import { format } from "date-fns";
import { X, CheckCircle2, Ban, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Lease } from "@/api/types";

interface Props {
  lease: Lease | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED",
  ) => void;
}

export function FloatingLeaseDetails({
  lease,
  onClose,
  onUpdateStatus,
}: Props) {
  if (!lease) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <Card className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-primary/20 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">Lease Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-1">
                Lease #{lease.id.slice(0, 8)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Created on{" "}
                {format(new Date(lease.createdAt || new Date()), "PPP")}
              </p>
            </div>
            <StatusBadge value={lease.status} />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium border-b pb-2">
              Agreement Terms
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Monthly Rent</div>
              <div className="font-medium">
                ${lease.monthlyRent.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Deposit</div>
              <div>${lease.depositAmount?.toLocaleString() || "0"}</div>
              <div className="text-muted-foreground">Start Date</div>
              <div>{format(new Date(lease.startDate), "PPP")}</div>
              <div className="text-muted-foreground">End Date</div>
              <div>{format(new Date(lease.endDate), "PPP")}</div>
            </div>
          </div>

          {lease.tenant && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium border-b pb-2">Tenant</h4>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {lease.tenant.firstName[0]}
                  {lease.tenant.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {lease.tenant.firstName} {lease.tenant.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lease.tenant.email} |{" "}
                    {lease.tenant.phoneNumber || "No phone"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {lease.unit && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium border-b pb-2">
                Unit Details
              </h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-muted-foreground">Property</div>
                <div className="font-medium">{lease.unit.property.title}</div>
                <div className="text-muted-foreground">Unit / Apt</div>
                <div>{lease.unit.unitIdentifier}</div>
                <div className="text-muted-foreground">Bed / Bath</div>
                <div>
                  {lease.unit.bedrooms} Bed, {lease.unit.bathrooms} Bath
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-6 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onUpdateStatus(lease.id, "ACTIVE")}
                disabled={lease.status === "ACTIVE"}
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />{" "}
                Activate
              </Button>
              <Button
                variant="outline"
                onClick={() => onUpdateStatus(lease.id, "TERMINATED")}
                disabled={lease.status === "TERMINATED"}
              >
                <Ban className="mr-2 h-4 w-4 text-destructive" /> Terminate
              </Button>
              <Button
                variant="outline"
                onClick={() => onUpdateStatus(lease.id, "EXPIRED")}
                disabled={lease.status === "EXPIRED"}
                className="col-span-2"
              >
                <Clock className="mr-2 h-4 w-4 text-amber-600" /> Mark as
                Expired
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
