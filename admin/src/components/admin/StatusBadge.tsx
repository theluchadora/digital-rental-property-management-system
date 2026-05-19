import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success border-success/30",
  PAID: "bg-success/15 text-success border-success/30",
  RESOLVED: "bg-success/15 text-success border-success/30",
  OCCUPIED: "bg-success/15 text-success border-success/30",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  EXPIRED: "bg-muted text-muted-foreground border-border",
  DRAFT: "bg-muted text-muted-foreground border-border",
  VACANT: "bg-tertiary/30 text-primary border-tertiary",
  PENDING_REVIEW: "bg-warning/20 text-warning border-warning/40",
  UNPAID: "bg-warning/20 text-warning border-warning/40",
  OPEN: "bg-warning/20 text-warning border-warning/40",
  IN_PROGRESS: "bg-secondary/20 text-secondary border-secondary/40",
  MAINTENANCE: "bg-secondary/20 text-secondary border-secondary/40",
  OVERDUE: "bg-destructive/15 text-destructive border-destructive/40",
  SUSPENDED: "bg-destructive/15 text-destructive border-destructive/40",
  TERMINATED: "bg-destructive/15 text-destructive border-destructive/40",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/40",
  DELETED: "bg-destructive/15 text-destructive border-destructive/40",
  URGENT: "bg-destructive/15 text-destructive border-destructive/40",
  HIGH: "bg-warning/20 text-warning border-warning/40",
  MEDIUM: "bg-secondary/20 text-secondary border-secondary/40",
  LOW: "bg-muted text-muted-foreground border-border",
  ADMIN: "bg-primary/10 text-primary border-primary/30",
  OWNER: "bg-secondary/20 text-secondary border-secondary/40",
  TENANT: "bg-tertiary/30 text-primary border-tertiary",
};

export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        map[value] ?? "bg-muted text-muted-foreground",
      )}
    >
      {value.replace(/_/g, " ")}
    </Badge>
  );
}
