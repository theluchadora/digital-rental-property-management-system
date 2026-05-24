import { Loader2 } from "lucide-react";

export {
  TableSkeletonRows,
  TableEmptyRow,
  TableErrorRow,
} from "@/components/admin/LoadingBlocks";

/** Full-page spinner — use only for auth/session gates */
export function PageLoading({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-8"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
