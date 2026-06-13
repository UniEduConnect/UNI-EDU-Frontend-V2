import type { AvailableSlotDto, SessionResponse } from "@/types/api";

// Canonical weekly grid — kept identical to the tutor schedule so tutor & student
// availability (and the intersection) line up exactly.
export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"] as const;
export const SLOTS = ["7:00-9:00", "9:00-11:00", "14:00-16:00", "17:00-19:00", "19:00-21:00"] as const;

const DOW_TO_DAY: Record<number, string> = {
  1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 0: "Chủ nhật",
};

export const slotKey = (day: string, slot: string) => `${day}|${slot}`;

/** "Chủ nhật"/"CN" normalize so different label styles still match. */
export function normalizeDay(day: string): string {
  const d = (day ?? "").trim();
  return d === "CN" ? "Chủ nhật" : d;
}

const slotRange = (slot: string): [number, number] => {
  const [a, b] = slot.split("-");
  return [parseInt(a, 10), parseInt(b, 10)];
};

/** Map a session's actual start datetime to a weekly (day, slot) cell, or null. */
export function sessionCell(session: SessionResponse): { day: string; slot: string } | null {
  const d = new Date(session.startAt);
  const day = DOW_TO_DAY[d.getDay()];
  const h = d.getHours();
  const slot = SLOTS.find((s) => {
    const [a, b] = slotRange(s);
    return h >= a && h < b;
  });
  return slot ? { day, slot } : null;
}

const BUSY_STATUSES = new Set(["scheduled", "in_progress", "pending_confirm"]);

/** Set of "day|slot" keys that are BUSY (have an upcoming/active session). */
export function busySlotKeys(sessions: SessionResponse[]): Set<string> {
  const keys = new Set<string>();
  for (const s of sessions) {
    if (!BUSY_STATUSES.has(s.status)) continue;
    const cell = sessionCell(s);
    if (cell) keys.add(slotKey(cell.day, cell.slot));
  }
  return keys;
}

export function hasSlot(slots: AvailableSlotDto[], day: string, slot: string): boolean {
  return slots.some((s) => normalizeDay(s.day) === day && s.time === slot);
}

/** Weekly slots present in BOTH sets (smart common-slot matching, client fallback). */
export function intersectSlots(a: AvailableSlotDto[], b: AvailableSlotDto[]): AvailableSlotDto[] {
  const setB = new Set(b.map((s) => slotKey(normalizeDay(s.day), s.time)));
  const seen = new Set<string>();
  const out: AvailableSlotDto[] = [];
  for (const s of a) {
    const k = slotKey(normalizeDay(s.day), s.time);
    if (setB.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push({ day: normalizeDay(s.day), time: s.time });
    }
  }
  return out;
}
