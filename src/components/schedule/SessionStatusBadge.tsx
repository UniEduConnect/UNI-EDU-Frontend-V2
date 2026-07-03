import { cn } from "@/lib/utils";

// Shared status -> (label, color) mapping for a class Session, used everywhere a session's
// status is shown (student/tutor class detail, the tutor's aggregate schedule) so the wording
// and colors never drift between screens.
const STATUS_META: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Sắp tới", className: "bg-primary/10 text-primary" },
  in_progress: { label: "Đang diễn ra", className: "bg-amber-100 text-warning dark:bg-amber-900/30 dark:text-amber-400" },
  pending_confirm: { label: "Chờ xác nhận", className: "bg-amber-100 text-warning dark:bg-amber-900/30 dark:text-amber-400" },
  completed: { label: "Hoàn thành", className: "bg-emerald-100 text-success dark:bg-emerald-900/30 dark:text-emerald-400" },
  missed: { label: "Vắng", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Đã hủy", className: "bg-muted text-muted-foreground" },
};

export function sessionStatusLabel(status: string): string {
  return STATUS_META[status]?.label ?? "Khác";
}

interface SessionStatusBadgeProps {
  status: string;
  className?: string;
}

export default function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "text-[11px] font-medium px-2 py-1 rounded-lg whitespace-nowrap",
        meta?.className ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {meta?.label ?? "Khác"}
    </span>
  );
}
