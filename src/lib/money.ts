/**
 * Helpers for money `<input>`s that show Vietnamese thousands separators while typing.
 *
 * A native `type="number"` input CANNOT display grouping separators (browsers reject the dots),
 * so money fields use `type="text"` + `inputMode="numeric"` and format on display:
 *   - state stores the RAW digit string ("1000000"), so downstream parseInt/Number keep working;
 *   - the input shows `formatVndInput(raw)` → "1.000.000";
 *   - onChange strips back to digits via `onlyDigits`.
 */

/** "1000000" | 1000000 -> "1.000.000". Empty / no digits -> "". */
export function formatVndInput(raw: string | number | null | undefined): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

/** Keep only digits — the raw value to store in state. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
