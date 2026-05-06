import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  loading?: boolean;
}

export function StatCard({ label, value, hint, className, loading }: Props) {
  return (
    <div className={cn("stat-card", className)}>
      <p className="text-xs sm:text-sm text-muted">{label}</p>
      {loading ? (
        <div className="h-7 w-24 rounded-md bg-surface-2 animate-pulse" />
      ) : (
        <p className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</p>
      )}
      {hint && <p className="text-[11px] sm:text-xs text-muted">{hint}</p>}
    </div>
  );
}
