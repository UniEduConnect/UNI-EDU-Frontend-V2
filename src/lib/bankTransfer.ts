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

/**
 * Short, human-readable transfer note the payer must keep in the transfer content so the
 * payment can be matched back to this top-up (e.g. "UNIEDU A1B2C3").
 */
export function makeTransferNote(): string {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `UNIEDU ${code}`;
}
