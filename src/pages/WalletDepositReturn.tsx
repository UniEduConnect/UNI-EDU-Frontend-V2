import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTE } from "@/lib/roleRoutes";
import { confirmVnPayReturn } from "@/services/wallet";

/**
 * Landing page the payment gateway redirects the user's browser to after
 * Momo/VNPay checkout (configured as Momo.RedirectUrl / VnPay.ReturnUrl).
 *
 * For VNPay we forward the signed return params to the backend, which verifies
 * the signature and credits the wallet immediately (idempotent) — so the balance
 * updates even when the server-to-server IPN doesn't arrive (e.g. ngrok in dev).
 * The IPN remains the authoritative path in production.
 */
export default function WalletDepositReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const qc = useQueryClient();
  const [vnpStatus, setVnpStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const walletPath = (role ? ROLE_ROUTE[role] : "") + "/wallet";

  // VNPay success → confirm + settle on the backend, then refresh the wallet.
  useEffect(() => {
    if (params.get("vnp_ResponseCode") == null) return;
    setConfirming(true);
    confirmVnPayReturn(window.location.search)
      .then((r) => {
        setVnpStatus(r.status);
        if (r.status === "credited" || r.status === "already") {
          qc.invalidateQueries({ queryKey: ["wallet"] });
          qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
        }
      })
      .catch(() => setVnpStatus("error"))
      .finally(() => setConfirming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outcome = useMemo(() => {
    // Momo v2 returns resultCode (0 = success). VNPay returns vnp_ResponseCode ("00" = success).
    const momo = params.get("resultCode");
    const vnp = params.get("vnp_ResponseCode");

    if (momo != null) {
      if (momo === "0") return "success" as const;
      if (momo === "1000" || momo === "7000" || momo === "9000") return "pending" as const;
      return "failed" as const;
    }
    if (vnp != null) {
      if (vnp === "00") return "success" as const;
      if (vnp === "24") return "cancelled" as const;
      return "failed" as const;
    }
    return "unknown" as const;
  }, [params]);

  const amountRaw =
    params.get("amount") ?? // momo: VND
    (params.get("vnp_Amount") ? String(Number(params.get("vnp_Amount")) / 100) : null); // vnpay: subunits
  const amount = amountRaw ? Number(amountRaw) : null;

  const successDesc = confirming
    ? "Đang xác nhận giao dịch với cổng thanh toán…"
    : vnpStatus === "credited" || vnpStatus === "already"
      ? "Số dư ví đã được cộng vào tài khoản của bạn."
      : vnpStatus === "amount-mismatch" || vnpStatus === "invalid-signature"
        ? "Giao dịch chưa được xác nhận hợp lệ. Vui lòng kiểm tra lại số dư hoặc liên hệ hỗ trợ."
        : "Giao dịch đã được ghi nhận. Số dư ví sẽ được cộng ngay khi hệ thống xác nhận.";

  const ui = {
    success: {
      icon: confirming
        ? <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
        : <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
      title: "Thanh toán thành công",
      desc: successDesc,
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-amber-500" />,
      title: "Đang xử lý",
      desc: "Giao dịch đang được xử lý. Vui lòng kiểm tra lại số dư ví sau ít phút.",
    },
    cancelled: {
      icon: <XCircle className="w-16 h-16 text-muted-foreground" />,
      title: "Đã huỷ giao dịch",
      desc: "Bạn đã huỷ thanh toán. Không có khoản tiền nào bị trừ.",
    },
    failed: {
      icon: <XCircle className="w-16 h-16 text-rose-500" />,
      title: "Thanh toán thất bại",
      desc: "Giao dịch không thành công. Bạn có thể thử nạp lại từ trang ví.",
    },
    unknown: {
      icon: <Wallet className="w-16 h-16 text-muted-foreground" />,
      title: "Kết quả thanh toán",
      desc: "Không đọc được trạng thái giao dịch. Vui lòng kiểm tra số dư ví.",
    },
  }[outcome];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <div className="flex justify-center">{ui.icon}</div>
        <h1 className="text-xl font-bold text-foreground">{ui.title}</h1>
        {amount != null && (
          <p className="text-2xl font-bold text-foreground">{amount.toLocaleString("vi-VN")}đ</p>
        )}
        <p className="text-sm text-muted-foreground">{ui.desc}</p>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/")}>
            Trang chủ
          </Button>
          <Button className="flex-1 rounded-xl" onClick={() => navigate(walletPath)}>
            <Wallet className="w-4 h-4 mr-2" /> Về ví của tôi
          </Button>
        </div>
      </div>
    </div>
  );
}
