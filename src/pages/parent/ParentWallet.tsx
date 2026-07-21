import { useWallet, useWalletTransactions, useDeposit, useTestDeposit, useWithdraw } from "@/hooks/useWallet";
import { useClasses } from "@/hooks/useClasses";
import { useNavigate } from "react-router-dom";
import { makeTransferNote } from "@/lib/bankTransfer";
import { formatVndInput, onlyDigits } from "@/lib/money";
import {
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Download,
  Receipt,
  Search,
  ShieldCheck,
  Loader2,
  ArrowUpRight as ArrowUpRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  deposit: "Nạp tiền",
  transfer_out: "Chuyển cho con",
  transfer_in: "Nhận tiền",
  tuition_payment: "Học phí",
  escrow_in: "Học phí (escrow)",
  refund: "Hoàn tiền",
  withdrawal: "Rút tiền",
};

const paymentMethods = [
  { id: "vnpay", name: "VNPay", desc: "Cổng thanh toán VNPay" },
  { id: "momo", name: "MoMo", desc: "Ví điện tử MoMo" },
  { id: "payos", name: "PayOS", desc: "Cổng thanh toán PayOS" },
  { id: "vietcombank", name: "Vietcombank", desc: "Ngân hàng Vietcombank" },
  { id: "techcombank", name: "Techcombank", desc: "Ngân hàng Techcombank" },
];

// Manual bank transfer (VietQR) — deposit-only, so it must NOT leak into the withdraw dialog
// which renders `paymentMethods`.
const bankTransferMethod = {
  id: "bank",
  name: "Chuyển khoản ngân hàng",
  desc: "Quét mã QR VietQR",
};

// Deposit dialog list — bank transfer first, then the online gateways.
const depositMethods = [bankTransferMethod, ...paymentMethods];

const ParentWallet = () => {
  const navigate = useNavigate();
  const { data: walletData } = useWallet();
  const { transactions, isLoading: txLoading } = useWalletTransactions();
  // Classes drive the pay-tuition picker. A parent sees their own children's classes
  // (GET /classes is role-scoped server-side).
  const { classes } = useClasses({ Status: "active" });
  const depositMutation = useDeposit();
  const testDepositMutation = useTestDeposit();
  const withdrawMutation = useWithdraw();

  const walletBalance = walletData?.balance ?? 0;

  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [search, setSearch] = useState("");

  // Active classes are the "pending tuition" list. Tuition is escrowed at class
  // creation, so there is no per-class outstanding balance to pay here.
  const pendingClasses = classes;

  const totalPending = pendingClasses.reduce((s, c) => s + c.fee, 0);
  const paidThisMonth = Math.abs(
    transactions
      .filter(t => (t.type === "tuition_payment" || t.type === "escrow_in") && t.date >= "2026-03-01")
      .reduce((s, t) => s + t.amount, 0)
  );

  const filteredTxns = transactions
    .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleDeposit = () => {
    const amt = parseInt(depositAmt);
    if (!amt || amt <= 0 || !selectedMethod) return;
    const methodName = depositMethods.find(m => m.id === selectedMethod)?.name || selectedMethod;

    // Bank transfer has no gateway redirect — send the payer to the QR/instructions page.
    if (selectedMethod === "bank") {
      setShowDeposit(false);
      setDepositAmt("");
      setSelectedMethod("");
      navigate(`/wallet/bank-transfer?amount=${amt}`);
      return;
    }

    // Demo path: create + confirm a test deposit, crediting the wallet immediately.
    if (selectedMethod === "test") {
      testDepositMutation.mutate(amt, {
        onSuccess: () => {
          toast.success(`Đã nạp ${amt.toLocaleString("vi-VN")}đ vào ví!`);
          setShowDeposit(false);
          setDepositAmt("");
          setSelectedMethod("");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Nạp tiền test thất bại."),
      });
      return;
    }

    depositMutation.mutate(
      { amount: amt, method: selectedMethod },
      {
        onSuccess: (res) => {
          if (res?.payUrl) { window.location.href = res.payUrl; return; }
          toast.success(`Đã tạo yêu cầu nạp ${amt.toLocaleString("vi-VN")}đ qua ${methodName}!`);
          setShowDeposit(false);
          setDepositAmt("");
          setSelectedMethod("");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Nạp tiền thất bại."),
      },
    );
  };

  const handleWithdraw = () => {
    const amt = parseInt(withdrawAmt);
    if (!amt || amt <= 0 || !selectedMethod) return;
    if (amt > walletBalance) {
      toast.error("Số tiền vượt quá số dư ví!");
      return;
    }
    const methodName = paymentMethods.find(m => m.id === selectedMethod)?.name || selectedMethod;
    withdrawMutation.mutate(
      { amount: amt, method: selectedMethod, bankAccount: "", bankName: methodName, note: makeTransferNote("withdraw") },
      {
        onSuccess: () => {
          toast.success(`Đã gửi yêu cầu rút ${amt.toLocaleString("vi-VN")}đ qua ${methodName}`);
          setShowWithdraw(false);
          setWithdrawAmt("");
          setSelectedMethod("");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Rút tiền thất bại."),
      },
    );
  };

  const handleExport = () => {
    toast.success("Đang xuất lịch sử giao dịch...");
    setTimeout(() => {
      const content = [
        "LỊCH SỬ GIAO DỊCH - PHỤ HUYNH UNI EDUCATION",
        `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
        `Số dư: ${walletBalance.toLocaleString("vi-VN")}đ`,
        "",
        ...transactions.map(
          (t, i) =>
            `${i + 1}. ${t.date} | ${t.description} | ${t.amount > 0 ? "+" : ""}${t.amount.toLocaleString("vi-VN")}đ`
        ),
      ].join("\n");

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `giao-dich-phu-huynh-${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file thành công!");
    }, 1000);
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* HERO */}
      {/* <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">Ví phụ huynh & học phí</h2>
            <p className="mt-1 text-sm text-white/80">
              Quản lý số dư, thanh toán học phí và theo dõi lịch sử giao dịch
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Số dư ví</p>
              <p className="text-xl font-bold">{walletBalance.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Cần thanh toán</p>
              <p className="text-xl font-bold">{totalPending.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Lớp đang học",
            value: `${totalPending.toLocaleString("vi-VN")}đ`,
            sub: `${pendingClasses.length} lớp đang hoạt động`,
            color: "from-blue-500 to-indigo-500",
            icon: Receipt,
          },
          {
            label: "Đã thanh toán",
            value: `${paidThisMonth.toLocaleString("vi-VN")}đ`,
            sub: "Trong tháng này",
            color: "from-amber-500 to-orange-500",
            icon: ArrowUpRight,
          },
          {
            label: "Số dư ví",
            value: `${walletBalance.toLocaleString("vi-VN")}đ`,
            sub: "Khả dụng hiện tại",
            color: "from-emerald-500 to-teal-500",
            icon: Wallet,
          },
          {
            label: "Giao dịch",
            value: transactions.length,
            sub: "Tổng số lịch sử",
            color: "from-rose-500 to-pink-500",
            icon: CreditCard,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={cn(
              "group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white transition-all hover:shadow-lg",
              s.color
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRightIcon className="ml-auto h-4 w-4 shrink-0" />
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowDeposit(true)} size="sm" className="rounded-xl gap-1">
            <Plus className="h-3.5 w-3.5" />
            Nạp tiền
          </Button>

          <Button onClick={() => setShowWithdraw(true)} variant="outline" size="sm" className="rounded-xl gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Rút tiền
          </Button>

          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Xuất file
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex w-fit gap-1 rounded-2xl bg-muted p-1">
        {[
          { key: "pending", label: "Học phí lớp" },
          { key: "history", label: "Lịch sử" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "pending" | "history")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.key === "pending" && pendingClasses.length > 0 && (
              <span className="ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {pendingClasses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PENDING */}
      {tab === "pending" ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Học phí các lớp</h3>

          {/* TODO(BE): no pay-tuition endpoint (tuition escrowed at class creation) */}
          <div className="mb-4 flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Học phí được giữ trong escrow ngay khi tạo lớp và giải ngân theo buổi học. Hiện chưa có
              luồng thanh toán học phí riêng cho phụ huynh.
            </p>
          </div>

          {pendingClasses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Không có lớp đang hoạt động.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingClasses.map(cls => (
                <div
                  key={cls.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <img src={cls.tutorAvatar} alt={cls.tutorName} className="h-10 w-10 rounded-full object-cover" />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cls.tutorName} • {cls.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cls.completedSessions}/{cls.totalSessions} buổi
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-foreground">{cls.fee.toLocaleString("vi-VN")}đ</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 rounded-xl text-xs"
                      disabled
                    >
                      Đã giữ escrow
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* HISTORY */
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm giao dịch..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="rounded-xl pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            {txLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải giao dịch...
              </div>
            ) : filteredTxns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Không có giao dịch nào
              </p>
            ) : (
              filteredTxns.map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    {t.amount > 0 ? (
                      <ArrowDownLeft className="h-4 w-4 text-foreground" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{t.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-[11px] text-muted-foreground">{t.date}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {typeLabels[t.type] || t.type}
                      </Badge>
                    </div>
                  </div>

                  <p
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      t.amount > 0 ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString("vi-VN")}đ
                  </p>

                  <span
                    className={cn(
                      "inline-block shrink-0 text-[10px] px-2 py-0.5 rounded-lg",
                      t.status === "completed"
                        ? "bg-success/15 text-success dark:bg-emerald-900/20"
                        : "bg-warning/15 text-warning dark:bg-amber-900/20",
                    )}
                  >
                    {t.status === "completed" ? "Hoàn thành" : "Đang xử lý"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-center gap-3 py-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Secure Payment • VNPay • MoMo • Ngân hàng
        </span>
      </div>

      {/* DEPOSIT DIALOG */}
      <Dialog open={showDeposit} onOpenChange={open => {
        setShowDeposit(open);
        if (!open) {
          setDepositAmt("");
          setSelectedMethod("");
        }
      }}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Nạp tiền vào ví</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Số tiền</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatVndInput(depositAmt)}
                onChange={e => setDepositAmt(onlyDigits(e.target.value))}
                placeholder="Nhập số tiền"
                className="mt-1 rounded-xl"
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {[500000, 1000000, 2000000, 5000000].map(v => (
                  <button
                    key={v}
                    onClick={() => setDepositAmt(String(v))}
                    className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {(v / 1000000).toFixed(1)}tr
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Phương thức thanh toán</label>
              <div className="mt-2 space-y-2">
                {depositMethods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      selectedMethod === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={!depositAmt || parseInt(depositAmt) <= 0 || !selectedMethod || depositMutation.isPending || testDepositMutation.isPending}
              className="w-full rounded-xl"
            >
              {(depositMutation.isPending || testDepositMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý...
                </>
              ) : (
                "Xác nhận nạp tiền"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WITHDRAW DIALOG */}
      <Dialog open={showWithdraw} onOpenChange={open => {
        setShowWithdraw(open);
        if (!open) {
          setWithdrawAmt("");
          setSelectedMethod("");
        }
      }}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Rút tiền từ ví</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Số dư khả dụng:{" "}
              <strong className="text-foreground">{walletBalance.toLocaleString("vi-VN")}đ</strong>
            </p>

            <div>
              <label className="text-xs font-medium text-foreground">Số tiền</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatVndInput(withdrawAmt)}
                onChange={e => setWithdrawAmt(onlyDigits(e.target.value))}
                placeholder="Nhập số tiền"
                className="mt-1 rounded-xl"
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {[500000, 1000000, 2000000, 5000000].map(v => (
                  <button
                    key={v}
                    onClick={() => setWithdrawAmt(String(v))}
                    className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {(v / 1000000).toFixed(1)}tr
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Phương thức nhận tiền</label>
              <div className="mt-2 space-y-2">
                {paymentMethods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      selectedMethod === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmt ||
                parseInt(withdrawAmt) <= 0 ||
                !selectedMethod ||
                parseInt(withdrawAmt) > walletBalance ||
                withdrawMutation.isPending
              }
              className="w-full rounded-xl"
            >
              Xác nhận rút tiền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentWallet;
