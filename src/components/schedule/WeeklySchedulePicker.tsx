import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Weekday chips for the "desired schedule" picker (Mon-first, Sunday last).
export const SCHEDULE_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// A per-day time range for the desired schedule.
export type DaySlot = { from: string; to: string };

/**
 * Serialize the picked days + per-day time ranges into a schedule string,
 * e.g. "T2 19:00-21:00, T5 18:00-20:00". Days without a full range degrade gracefully.
 */
export function buildScheduleString(days: string[], times: Record<string, DaySlot>): string {
  return SCHEDULE_DAYS.filter((d) => days.includes(d))
    .map((d) => {
      const { from = "", to = "" } = times[d] ?? {};
      if (from && to) return `${d} ${from}-${to}`;
      if (from) return `${d} ${from}`;
      return d;
    })
    .join(", ");
}

/** Encapsulates the day/time state + toggle logic behind the picker below. */
export function useWeeklySchedule() {
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<Record<string, DaySlot>>({});

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    setTimes((prev) => {
      if (prev[day]) {
        // Deselecting a day drops its time range.
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: { from: "", to: "" } };
    });
  };

  const setTime = (day: string, key: keyof DaySlot, value: string) =>
    setTimes((prev) => ({ ...prev, [day]: { ...(prev[day] ?? { from: "", to: "" }), [key]: value } }));

  const reset = () => {
    setDays([]);
    setTimes({});
  };

  return { days, times, toggleDay, setTime, reset, scheduleString: buildScheduleString(days, times) };
}

interface WeeklySchedulePickerProps {
  days: string[];
  times: Record<string, DaySlot>;
  onToggleDay: (day: string) => void;
  onChangeTime: (day: string, key: keyof DaySlot, value: string) => void;
  label?: string;
}

/** Day-chip + per-day time-range picker, shared by the student "đăng tìm gia sư" and tutor "đăng tin tìm học sinh" dialogs. */
export default function WeeklySchedulePicker({
  days,
  times,
  onToggleDay,
  onChangeTime,
  label = "Lịch mong muốn",
}: WeeklySchedulePickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {SCHEDULE_DAYS.map((d) => {
          const active = days.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onToggleDay(d)}
              className={cn(
                "h-9 min-w-[2.75rem] rounded-xl border px-2 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
      {SCHEDULE_DAYS.filter((d) => days.includes(d)).map((d) => (
        <div key={d} className="flex items-center gap-2">
          <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
            {d}
          </span>
          <div className="relative flex-1">
            <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="time"
              aria-label={`Giờ bắt đầu ${d}`}
              value={times[d]?.from ?? ""}
              onChange={(e) => onChangeTime(d, "from", e.target.value)}
              className="h-9 rounded-xl pl-8 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">đến</span>
          <div className="relative flex-1">
            <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="time"
              aria-label={`Giờ kết thúc ${d}`}
              value={times[d]?.to ?? ""}
              onChange={(e) => onChangeTime(d, "to", e.target.value)}
              className="h-9 rounded-xl pl-8 text-sm"
            />
          </div>
        </div>
      ))}
      {days.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Lịch đã chọn:{" "}
          <span className="font-medium text-foreground">{buildScheduleString(days, times)}</span>
        </p>
      )}
    </div>
  );
}
