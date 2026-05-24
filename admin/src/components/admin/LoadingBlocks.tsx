import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";

export function MetricSkeleton({
  size = "lg",
}: {
  size?: "sm" | "lg";
}) {
  return (
    <div className="space-y-2">
      <Skeleton
        className={cn(size === "lg" ? "h-8 w-24" : "h-6 w-20")}
      />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

type StatCardProps = {
  label: string;
  icon: LucideIcon;
  accent?: string;
  isLoading?: boolean;
  value?: React.ReactNode;
  hint?: React.ReactNode;
};

export function StatCard({
  label,
  icon: Icon,
  accent = "from-transparent to-transparent",
  isLoading,
  value,
  hint,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 bg-gradient-to-br",
        accent,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <MetricSkeleton />
            ) : (
              <>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                  {value ?? "—"}
                </p>
                {hint != null && (
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                )}
              </>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({
  variant = "line",
  className,
}: {
  variant?: "line" | "bar" | "pie" | "horizontal-bar";
  className?: string;
}) {
  if (variant === "pie") {
    return (
      <div
        className={cn("flex h-full items-center justify-center", className)}
        aria-hidden
      >
        <Skeleton className="h-40 w-40 rounded-full" />
      </div>
    );
  }

  if (variant === "horizontal-bar") {
    return (
      <div className={cn("flex h-full flex-col justify-center gap-3 px-2", className)}>
        {[100, 72, 48, 36, 28].map((w, i) => (
          <Skeleton key={i} className="h-6" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  const heights =
    variant === "bar"
      ? [45, 72, 55, 88, 40, 65]
      : [30, 55, 42, 70, 48, 62];

  return (
    <div
      className={cn(
        "flex h-full items-end justify-between gap-2 px-2 pb-2 pt-6",
        className,
      )}
      aria-hidden
    >
      {heights.map((h, i) => (
        <Skeleton
          key={i}
          className="w-full max-w-[48px] rounded-t-md"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function ActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-muted/20 px-3 py-2 space-y-2">
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-3 w-[45%]" />
        </div>
      ))}
    </div>
  );
}

type ChartPanelProps = {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  heightClass?: string;
  variant?: "line" | "bar" | "pie" | "horizontal-bar";
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function ChartPanel({
  isLoading,
  isError,
  errorMessage = "Failed to load chart data.",
  heightClass = "h-72",
  variant = "line",
  children,
  empty,
  emptyMessage = "No data yet.",
}: ChartPanelProps) {
  return (
    <div className={cn(heightClass, "w-full")}>
      {isLoading ? (
        <ChartSkeleton variant={variant} className="h-full" />
      ) : isError ? (
        <p className="flex h-full items-center justify-center text-sm text-destructive px-4 text-center">
          {errorMessage}
        </p>
      ) : empty ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

export function TableEmptyRow({
  colSpan,
  message = "No results found",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}

export function TableErrorRow({
  colSpan,
  message = "Failed to load data. Check your connection and try again.",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-destructive">
        {message}
      </TableCell>
    </TableRow>
  );
}

export function TableSkeletonRows({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  const widths = ["w-28", "w-36", "w-24", "w-20", "w-16", "w-12"];

  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <TableRow key={row} aria-hidden>
          {Array.from({ length: columns }).map((_, col) => (
            <TableCell key={col}>
              <Skeleton
                className={cn(
                  "h-4",
                  widths[col % widths.length],
                  col === columns - 1 && "ml-auto",
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function InlineStat({
  isLoading,
  value,
  className,
}: {
  isLoading?: boolean;
  value?: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return <Skeleton className={cn("h-5 w-12", className)} />;
  }
  return <span className={className}>{value ?? "—"}</span>;
}
