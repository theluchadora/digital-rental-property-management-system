import React from "react";
import { format } from "date-fns";
import { X, Archive, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Property } from "@/api/types";

interface Props {
  property: Property | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DELETED",
  ) => void;
}

export function FloatingPropertyDetails({
  property,
  onClose,
  onUpdateStatus,
}: Props) {
  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <Card className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-primary/20 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">Property Details</h2>
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
          <div>
            <h3 className="text-xl font-semibold mb-1">{property.title}</h3>
            <p className="text-sm text-muted-foreground">
              {property.description || "No description provided."}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium border-b pb-2">Information</h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Type</div>
              <div>
                <StatusBadge value={property.type} />
              </div>
              <div className="text-muted-foreground">Status</div>
              <div>
                <StatusBadge value={property.status} />
              </div>
              <div className="text-muted-foreground">Location</div>
              <div>
                {property.addressCity}
                {property.addressStreet ? `, ${property.addressStreet}` : ""}
              </div>
              <div className="text-muted-foreground">Registered</div>
              <div>
                {format(new Date(property.createdAt || new Date()), "PPP")}
              </div>
            </div>
          </div>

          {property.owner && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium border-b pb-2">Owner</h4>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {property.owner.firstName[0]}
                  {property.owner.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {property.owner.firstName} {property.owner.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {property.owner.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-6 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              Actions
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  onUpdateStatus(
                    property.id,
                    property.status === "MAINTENANCE"
                      ? "ACTIVE"
                      : "MAINTENANCE",
                  )
                }
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {property.status === "MAINTENANCE"
                  ? "End Maintenance"
                  : "Set Maintenance"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  onUpdateStatus(
                    property.id,
                    property.status === "INACTIVE" ? "ACTIVE" : "INACTIVE",
                  )
                }
              >
                <Archive className="mr-2 h-4 w-4" />
                {property.status === "INACTIVE" ? "Activate" : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
