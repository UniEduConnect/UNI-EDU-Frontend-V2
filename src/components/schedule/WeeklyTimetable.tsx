import { cn } from "@/lib/utils";
import type { AvailableSlotDto, SessionResponse } from "@/types/api";
import { DAYS, SLOTS, slotKey, busySlotKeys, hasSlot, sessionCell } from "@/lib/scheduleUtils";

interface WeeklyTimetableProps {
  /** Free slots (weekly availability). In edit mode this should be the working draft. */
  availability: AvailableSlotDto[];
  /** Busy = real sessions (mapped to weekly cells). */
  sessions?: SessionResponse[];
  /** Edit mode lets the user toggle their free slots. */
  editMode?: boolean;
  onToggle?: (day: string, slot: string) => void;
  /** "day|slot" keys to highlight as suggested common slots (smart matching). */
  suggested?: Set<string>;
}

/**
 * Weekly free/busy timetable. One grid, color-coded:
 *  - BẬN (blue)   : a session is scheduled in that cell
 *  - RẢNH (green)  : the user marked themselves free
 *  - Gợi ý (ring)  : free AND matches the selected tutor's free slot
 *  - ⚠ trùng       : free but a session already occupies it (conflict)
 */
export function WeeklyTimetable({ availability, sessions = [], editMode = false, onToggle, suggested }: WeeklyTimetableProps) {
  const busy = busySlotKeys(sessions);
  const sessionByCell = new Map<string, SessionResponse>();
  for (const s of sessions) {
    const c = sessionCell(s);
    if (c) sessionByCell.set(slotKey(c.day, c.slot), s);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr>
            <th className="text-[11px] text-muted-foreground font-medium p-2 text-left w-24">Giờ</th>
            {DAYS.map((d) => (
              <th key={d} className="text-[11px] text-muted-foreground font-medium p-2 text-center">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slot) => (
            <tr key={slot} className="border-t border-border/50">
              <td className="text-[11px] text-muted-foreground p-2 font-medium">{slot}</td>
              {DAYS.map((day) => {
                const key = slotKey(day, slot);
                const free = hasSlot(availability, day, slot);
                const isBusy = busy.has(key);
                const isSuggested = suggested?.has(key) ?? false;

                if (editMode) {
                  return (
                    <td key={day} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle?.(day, slot)}
                        className={cn(
                          "w-full h-12 rounded-lg text-[10px] font-medium transition-all border",
                          free
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-muted/30 text-muted-foreground/50 border-transparent hover:border-primary/20"
                        )}
                      >
                        {free ? "✓ Rảnh" : "+"}
                      </button>
                    </td>
                  );
                }

                if (isBusy) {
                  const s = sessionByCell.get(key);
                  return (
                    <td key={day} className="p-1 text-center">
                      <div className={cn(
                        "w-full min-h-12 rounded-lg border p-1 flex flex-col items-center justify-center",
                        free ? "bg-amber-100 border-amber-300 dark:bg-amber-900/20" : "bg-primary/10 border-primary/20"
                      )}>
                        <span className={cn("text-[10px] font-semibold", free ? "text-amber-700 dark:text-amber-300" : "text-primary")}>
                          {free ? "⚠ Trùng" : "Bận"}
                        </span>
                        {s && <span className="text-[9px] text-muted-foreground truncate max-w-full">{s.format === "online" ? "Online" : "Offline"}</span>}
                      </div>
                    </td>
                  );
                }

                if (free) {
                  return (
                    <td key={day} className="p-1 text-center">
                      <div className={cn(
                        "w-full h-12 rounded-lg border flex items-center justify-center",
                        isSuggested
                          ? "bg-emerald-500/25 border-emerald-500 ring-2 ring-emerald-400"
                          : "bg-emerald-500/10 border-emerald-500/30"
                      )}>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                          {isSuggested ? "★ Phù hợp" : "Rảnh"}
                        </span>
                      </div>
                    </td>
                  );
                }

                return <td key={day} className="p-1"><div className="w-full h-12" /></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/30" /> Rảnh</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/10 border border-primary/20" /> Bận (có lớp)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/25 border border-emerald-500 ring-1 ring-emerald-400" /> Phù hợp với gia sư</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Trùng lịch</span>
      </div>
    </div>
  );
}

export default WeeklyTimetable;
