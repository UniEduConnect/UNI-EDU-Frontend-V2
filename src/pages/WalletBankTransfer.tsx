import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Check, Copy, Loader2, QrCode, ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTE } from "@/lib/roleRoutes";
import { useTestDeposit } from "@/hooks/useWallet";
import { BANK_TRANSFER, buildVietQrUrl, makeTransferNote } from "@/lib/bankTransfer";

/**
 * Manual bank-transfer top-up: shows the amount + a VietQR code pre-filled with that amount
 * and a reconciliation note, then lets the payer confirm they've transferred.
 *
 * Deliberate product decision: we trust the payer instead of waiting on bank reconciliation, so
 * confirming credits the wallet immediately. No webhook verifies the money actually arrived —
 * a dishonest payer can self-credit; that trade-off is accepted.
 *
 * Implemented on the test-deposit endpoints because the backend has no "bank" payment gateway
 * (InitiateDepositAsync only resolves momo/vnpay/payos), which is why these rows land in the
 * ledger with Method = "test".
 */
export default function WalletBankTransfer() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const testDeposit = useTestDeposit();
  const [copied, setCopied] = useState<string | null>(null);

  const walletPath = (role ? ROLE_ROUTE[role] : "") + "/wallet";

  const amount = Number(params.get("amount") ?? 0);
  const isValidAmount = Number.isFinite(amount) && amount > 0;

  // Generated once per visit so the note stays stable while the payer is transferring.
  const [note] = useState(() => params.get("note") || makeTransferNote("deposit"));
  const qrUrl = useMemo(() => buildVietQrUrl(amount, note), [amount, note]);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Không sao chép được, vui lòng copy thủ công.");
    }
  };

  const handleConfirm = () => {
    if (!isValidAmount) return;
    testDeposit.mutate(amount, {
      onSuccess: () =>
        navigate(`/wallet/deposit-return?bank=success&amount=${Math.trunc(amount)}`, { replace: true }),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Xác nhận thanh toán thất bại."),
    });
  };

  if (!isValidAmount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">Thiếu số tiền nạp</h1>
          <p className="text-sm text-muted-foreground">
            Không xác định được số tiền cần thanh toán. Vui lòng quay lại ví và nhập lại số tiền.
          </p>
          <Button className="w-full rounded-xl" onClick={() => navigate(walletPath)}>
            Về ví của tôi
          </Button>
        </div>
      </div>
    );
  }

  const rows = [
    { label: "Ngân hàng", value: BANK_TRANSFER.bankName, copyValue: BANK_TRANSFER.bankName, key: "bank" },
    { label: "Số tài khoản", value: BANK_TRANSFER.accountNumber, copyValue: BANK_TRANSFER.accountNumber, key: "acc" },
    { label: "Chủ tài khoản", value: BANK_TRANSFER.accountName, copyValue: BANK_TRANSFER.accountName, key: "name" },
    { label: "Nội dung chuyển khoản", value: note, copyValue: note, key: "note" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-4">
        <button
          onClick={() => navigate(walletPath)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại ví
        </button>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h1 className="flex items-center justify-center gap-2 text-lg font-bold text-foreground">
              <QrCode className="h-5 w-5 text-primary" /> Chuyển khoản ngân hàng
            </h1>
            <p className="text-xs text-muted-foreground">
              Quét mã QR bên dưới bằng app ngân hàng để thanh toán
            </p>
          </div>

          <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 text-center">
            <p className="text-xs text-muted-foreground">Số tiền cần thanh toán</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {amount.toLocaleString("vi-VN")}đ
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={qrUrl}
              alt={`Mã QR chuyển khoản ${amount.toLocaleString("vi-VN")}đ`}
              className="h-auto w-64 rounded-2xl border border-border bg-white"
              loading="eager"
            />
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{r.label}</p>
                  <p className="truncate text-sm font-medium text-foreground">{r.value}</p>
                </div>
                <button
                  onClick={() => copy(r.copyValue, r.key)}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Sao chép"
                >
                  {copied === r.key ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/20">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
              Vui lòng chuyển <span className="font-semibold">đúng số tiền</span> và giữ nguyên{" "}
              <span className="font-semibold">nội dung chuyển khoản</span> để hệ thống đối soát
              được giao dịch của bạn.
            </p>
          </div>

          <Button
            className="w-full rounded-2xl py-6 text-sm font-semibold"
            onClick={handleConfirm}
            disabled={testDeposit.isPending}
          >
            {testDeposit.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xác nhận...
              </>
            ) : (
              "Xác nhận thanh toán thành công"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
