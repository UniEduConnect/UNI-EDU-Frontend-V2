// Session times are always displayed in Vietnam time (Asia/Ho_Chi_Minh), regardless of the
// viewer's browser timezone — this app has no per-user timezone setting, and the backend
// converts everything to/from Vietnam time when storing UTC (see SessionScheduling.cs).
// Using a fixed IANA zone here (rather than `new Date().getHours()`, which follows the
// browser's local zone) keeps the display correct even if a user's device is set to a
// different timezone than Vietnam.
const VN_TZ = "Asia/Ho_Chi_Minh";

/** "2026-07-06T02:00:00Z" -> "2026-07-06" (the Vietnam calendar date, not the UTC date). */
export function formatSessionDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: VN_TZ }); // en-CA locale formats as yyyy-MM-dd
}

/** "2026-07-06T02:00:00Z" -> "09:00" (Vietnam local time). */
export function formatSessionClock(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { timeZone: VN_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "2026-07-06 • 09:00-11:00" */
export function formatSessionRange(startIso?: string | null, endIso?: string | null): string {
  return `${formatSessionDate(startIso)} • ${formatSessionClock(startIso)}-${formatSessionClock(endIso)}`;
}

/**
 * Day of week (0=Sun..6=Sat, matching Date.getDay()) for the session's Vietnam calendar date.
 * Parses the VN date string as UTC midnight so the weekday is derived purely from the
 * calendar date — never shifted by the browser's own timezone.
 */
export function vietnamWeekday(iso?: string | null): number {
  const dateStr = formatSessionDate(iso);
  if (!dateStr) return -1;
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** Minutes since midnight in Vietnam local time — used to position a session on a calendar grid. */
export function vietnamMinutesOfDay(iso?: string | null): number {
  const clock = formatSessionClock(iso);
  if (!clock) return 0;
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

/**
 * "Today" as a browser-local midnight Date representing the current Vietnam calendar date.
 * Safe for date-only arithmetic (adding/subtracting days to build a week range) regardless of
 * the viewer's own browser timezone — NOT safe for time-of-day math.
 */
export function vietnamToday(): Date {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: VN_TZ }).split("-").map(Number);
  return new Date(y, m - 1, d);
}
