/**
 * Receiving bank account for manual "chuyển khoản ngân hàng" top-ups.
 *
 * Single source of truth — change the account here and every QR / instruction screen follows.
 * TODO(config): move these to build-time env vars (VITE_BANK_*) before going live so the
 * receiving account isn't hard-coded in the repo.
 */
export const BANK_TRANSFER = {
  /** VietQR bank code (https://api.vietqr.io/v2/banks). MB = Ngân hàng Quân đội. */
  bankCode: "MB",
  bankName: "MB Bank (Ngân hàng Quân đội)",
  accountNumber: "0797636177",
  accountName: "NGUYEN NU QUYNH NHU",
} as const;

/**
 * VietQR renders a ready-to-scan QR image for us. Passing `amount` + `addInfo` pre-fills the
 * transfer in the payer's banking app, so they can't mistype the amount or drop the note —
 * which is what makes the transfer reconcilable on our side.
 */
export function buildVietQrUrl(amount: number, note: string): string {
  const { bankCode, accountNumber, accountName } = BANK_TRANSFER;
  const params = new URLSearchParams({
    amount: String(Math.trunc(amount)),
    addInfo: note,
    accountName,
  });
  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?${params}`;
}

export type TransferKind = "deposit" | "withdraw";

/**
 * Short, human-readable transfer note carried in the bank transfer content so a payment can be
 * matched back to its wallet operation (e.g. "UNIEDU NAP A1B2C3").
 *
 * The NAP (nạp/top-up) vs RUT (rút/withdrawal) prefix makes a deposit distinguishable from a
 * withdrawal on the bank statement — a deposit is money coming IN, a withdrawal is money going
 * OUT, so they must never be confused during reconciliation. ASCII-only (no diacritics) because
 * VietQR / bank transfer memos don't reliably carry Vietnamese accents.
 */
export function makeTransferNote(kind: TransferKind = "deposit"): string {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const prefix = kind === "withdraw" ? "RUT" : "NAP";
  return `UNIEDU ${prefix} ${code}`;
}
