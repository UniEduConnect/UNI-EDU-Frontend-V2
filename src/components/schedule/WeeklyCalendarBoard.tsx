import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Monitor, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { vietnamWeekday, vietnamMinutesOfDay, vietnamToday, formatSessionClock, formatSessionDate } from "@/lib/sessionTime";
import SessionStatusBadge from "@/components/schedule/SessionStatusBadge";

export interface CalendarBoardSession {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  /** Primary line, e.g. the class name. */
  title: string;
  /** Secondary line, e.g. the other party's name (tutor sees student, student/parent sees tutor). */
  subtitle?: string;
  format?: string;
}

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

// Pixels per hour of grid height. Events are positioned/sized proportionally to this so a
// 09:00-11:00 class visually spans exactly two hour-rows, instead of sitting in a single
// table row that stretches to fit the card (which was throwing off every row below it).
const ROW_HEIGHT = 64;
const MIN_EVENT_HEIGHT = 44;

const pad2 = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Monday of the week containing `d` (d is assumed to already be a calendar-date-only local midnight). */
function mondayOf(d: Date): Date {
  const dow = d.getDay(); // 0=Sun..6=Sat
  return addDays(d, dow === 0 ? -6 : 1 - dow);
}

interface WeeklyCalendarBoardProps {
  sessions: CalendarBoardSession[];
  onSelect?: (session: CalendarBoardSession) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * The one shared "thời khóa biểu" widget: a real, dated weekly calendar (Mon-Sun, with prev/next/
 * today navigation) showing actual scheduled sessions positioned on their real date + hour.
 * Used identically by tutor (teaching schedule), student, and parent (child's schedule) UIs so the
 * three roles see the same calendar-style timetable instead of each rolling their own list/grid.
 */
export default function WeeklyCalendarBoard({ sessions, onSelect, className, emptyMessage = "Không có buổi học nào trong tuần này" }: WeeklyCalendarBoardProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => addDays(mondayOf(vietnamToday()), weekOffset * 7), [weekOffset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const dayKeys = useMemo(() => days.map(dateKey), [days]);

  const weekSessions = useMemo(() => {
    const keySet = new Set(dayKeys);
    return sessions.filter((s) => keySet.has(formatSessionDate(s.startAt)));
  }, [sessions, dayKeys]);

  const { rows, minHour, byCol } = useMemo(() => {
    // Fit the row range tightly to this week's actual sessions (±1h padding) instead of
    // always spanning a fixed 06:00-21:00 — a week where every session sits at 09:00-11:00
    // shouldn't render a dozen empty rows above and below it.
    const startHours = weekSessions.map((s) => Math.floor(vietnamMinutesOfDay(s.startAt) / 60));
    const endHours = weekSessions.map((s) => Math.ceil(vietnamMinutesOfDay(s.endAt) / 60));
    const minHour = startHours.length ? Math.max(0, Math.min(...startHours) - 1) : 7;
    const maxHour = endHours.length ? Math.min(23, Math.max(...endHours)) : 21;
    const rows = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

    const byCol = new Map<number, CalendarBoardSession[]>();
    for (const s of weekSessions) {
      const weekday = vietnamWeekday(s.startAt); // 0=Sun..6=Sat
      const col = weekday === 0 ? 6 : weekday - 1; // Monday-first column index
      const arr = byCol.get(col) ?? [];
      arr.push(s);
      byCol.set(col, arr);
    }
    return { rows, minHour, byCol };
  }, [weekSessions]);

  const gridHeight = rows.length * ROW_HEIGHT;
  const fmtDay = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  const isToday = (d: Date) => dateKey(d) === dateKey(vietnamToday());

  return (
    <div className={cn("bg-card border border-border rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded-lg hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {fmtDay(days[0])} - {fmtDay(days[6])}/{days[6].getFullYear()}
          </p>
          {weekOffset !== 0 && (
            <button className="text-xs text-primary hover:underline mt-0.5" onClick={() => setWeekOffset(0)}>
              Về tuần hiện tại
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded-lg hover:bg-muted">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {weekSessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[772px]">
            {/* Day header */}
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div className="text-[10px] text-muted-foreground font-medium px-2 pb-2">Giờ</div>
              {days.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-[11px] font-medium pb-2 text-center border-l border-border/50",
                    isToday(d) ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {DAY_LABELS[i]}
                  <br />
                  <span className="text-[10px] font-normal">{fmtDay(d)}</span>
                </div>
              ))}
            </div>

            {/* Timed grid: hour-label column + 7 day columns, all sharing the same proportional height */}
            <div className="grid border-t border-border/50" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div className="relative" style={{ height: gridHeight }}>
                {rows.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 -translate-y-1/2 text-[10px] text-muted-foreground font-mono px-2"
                    style={{ top: i * ROW_HEIGHT }}
                  >
                    {pad2(hour)}:00
                  </div>
                ))}
              </div>

              {days.map((d, col) => (
                <div key={col} className="relative border-l border-border/50" style={{ height: gridHeight }}>
                  {rows.map((hour, i) => (
                    <div key={hour} className="absolute left-0 right-0 border-t border-border/30" style={{ top: i * ROW_HEIGHT }} />
                  ))}
                  {(byCol.get(col) ?? []).map((s) => {
                    const startMin = vietnamMinutesOfDay(s.startAt);
                    const endMin = Math.max(vietnamMinutesOfDay(s.endAt), startMin + 15);
                    const top = ((startMin - minHour * 60) / 60) * ROW_HEIGHT;
                    const height = Math.max(((endMin - startMin) / 60) * ROW_HEIGHT, MIN_EVENT_HEIGHT);
                    return (
                      <button
                        key={s.id}
                        onClick={() => onSelect?.(s)}
                        style={{ top, height }}
                        className={cn(
                          "absolute left-1 right-1 overflow-hidden text-left p-1.5 rounded-lg text-[10px] font-medium border transition-colors",
                          s.status === "completed"
                            ? "bg-muted border-border text-foreground"
                            : s.status === "missed" || s.status === "cancelled"
                              ? "bg-destructive/5 border-destructive/20 text-destructive"
                              : "bg-primary/5 border-primary/20 text-foreground hover:bg-primary/10",
                        )}
                      >
                        <p className="truncate font-semibold">{s.title}</p>
                        {s.subtitle && <p className="truncate text-[9px] text-muted-foreground">{s.subtitle}</p>}
                        <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          {s.format === "online" ? <Monitor className="w-2.5 h-2.5 shrink-0" /> : <MapPin className="w-2.5 h-2.5 shrink-0" />}
                          {formatSessionClock(s.startAt)}-{formatSessionClock(s.endAt)}
                        </p>
                        <SessionStatusBadge status={s.status} className="mt-1 inline-block !px-1 !py-0.5" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
