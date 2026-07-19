import {
  useWallet,
  useWalletTransactions,
  useDeposit,
  useTestDeposit,
  useWithdraw,
} from "@/hooks/useWallet";
import { useClasses } from "@/hooks/useClasses";
import type { DepositResponse, ClassItem } from "@/types/api";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  CreditCard,
  ShieldCheck,
  Search,
  Download,
  Receipt,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const typeLabels: Record<string, string> = {
  deposit: "Nạp tiền",
  transfer_in: "Nhận từ phụ huynh",
  transfer_out: "Chuyển đi",
  tuition_payment: "Học phí",
  mock_exam_purchase: "Mua đề thi",
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

// Methods for the deposit dialog — bank transfer first, then the online gateways.
const depositMethods = [bankTransferMethod, ...paymentMethods];

const CHART_COLORS = [
  "hsl(224, 76%, 48%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

const StudentWallet = () => {
  const navigate = useNavigate();
  const { data: walletData } = useWallet();
  const { transactions: walletTransactions, isLoading: txLoading } =
    useWalletTransactions();
  const { classes } = useClasses({ Status: "active" });
  const depositMutation = useDeposit();
  const testDepositMutation = useTestDeposit();
  const withdrawMutation = useWithdraw();
  const walletBalance = walletData?.balance ?? 0;

  const [showDeposit, setShowDeposit] = useState(false);
  const [showPayTuition, setShowPayTuition] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = walletTransactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter(
      (t) =>
        !search || t.description.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSpent = Math.abs(
    walletTransactions
      .filter((t) => t.amount < 0 && t.status === "completed")
      .reduce((s, t) => s + t.amount, 0),
  );

  const totalRefunded = walletTransactions
    .filter((t) => t.type === "refund" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  const spendingByType = [
    {
      name: "Học phí",
      value: Math.abs(
        walletTransactions
          .filter((t) => t.type === "tuition_payment")
          .reduce((s, t) => s + t.amount, 0),
      ),
    },
    {
      name: "Đề thi",
      value: Math.abs(
        walletTransactions
          .filter((t) => t.type === "mock_exam_purchase")
          .reduce((s, t) => s + t.amount, 0),
      ),
    },
  ].filter((d) => d.value > 0);

  const monthlyData = (() => {
    const map = new Map<string, number>();
    walletTransactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const m = t.date.slice(0, 7);
        map.set(m, (map.get(m) || 0) + Math.abs(t.amount));
      });

    return Array.from(map.entries())
      .sort()
      .slice(-6)
      .map(([m, v]) => ({
        month: m.replace("2026-", "T").replace("2025-", "T"),
        amount: v,
      }));
  })();

  const resetDialogState = () => {
    setAmount("");
    setSelectedMethod("");
  };

  const handleDeposit = () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0 || !selectedMethod) return;

    const methodName =
      depositMethods.find((m) => m.id === selectedMethod)?.name ||
      selectedMethod;

    // Bank transfer has no gateway redirect — send the payer to the QR/instructions page.
    if (selectedMethod === "bank") {
      setShowDeposit(false);
      resetDialogState();
      navigate(`/wallet/bank-transfer?amount=${amt}`);
      return;
    }

    // Demo path: create + confirm a test deposit, crediting the wallet immediately.
    if (selectedMethod === "test") {
      testDepositMutation.mutate(amt, {
        onSuccess: () => {
          toast.success(
            `Đã nạp ${amt.toLocaleString("vi-VN")}đ vào ví!`,
          );
          setShowDeposit(false);
          resetDialogState();
        },
        onError: (e) =>
          toast.error(
            e instanceof Error ? e.message : "Nạp tiền test thất bại.",
          ),
      });
      return;
    }

    depositMutation.mutate(
      { amount: amt, method: selectedMethod },
      {
        onSuccess: (res: DepositResponse) => {
          // Online gateways (MoMo/VNPay) return a redirect URL to complete payment.
          if (res?.payUrl) {
            window.location.href = res.payUrl;
            return;
          }
          toast.success(
            `Đã tạo yêu cầu nạp ${amt.toLocaleString("vi-VN")}đ qua ${methodName}!`,
          );
          setShowDeposit(false);
          resetDialogState();
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Nạp tiền thất bại."),
      },
    );
  };

  const handleWithdraw = () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0 || !selectedMethod) return;

    if (amt > walletBalance) {
      toast.error("Số tiền vượt quá số dư ví!");
      return;
    }

    const methodName =
      paymentMethods.find((m) => m.id === selectedMethod)?.name ||
      selectedMethod;

    withdrawMutation.mutate(
      {
        amount: amt,
        method: selectedMethod,
        bankAccount: "",
        bankName: methodName,
        note: "",
      },
      {
        onSuccess: () => {
          toast.success(
            `Đã gửi yêu cầu rút ${amt.toLocaleString("vi-VN")}đ qua ${methodName}`,
          );
          setShowWithdraw(false);
          resetDialogState();
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Rút tiền thất bại."),
      },
    );
  };

  // TODO(BE): no pay-tuition endpoint (tuition is escrowed at class creation)
  const handlePayTuitionItem = (_cls: ClassItem) => {
    toast.info(
      "Học phí được giữ trong escrow khi tạo lớp — chưa có luồng thanh toán riêng.",
    );
  };

  const handleExportPDF = () => {
    toast.success("Đang xuất file lịch sử giao dịch...");
    setTimeout(() => {
      const content = [
        "LỊCH SỬ GIAO DỊCH - VÍ HỌC PHÍ UNI EDUCATION",
        `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
        `Số dư hiện tại: ${walletBalance.toLocaleString("vi-VN")}đ`,
        "",
        "STT | Ngày | Loại | Mô tả | Số tiền | Trạng thái",
        ...filtered.map(
          (t, i) =>
            `${i + 1} | ${t.date} | ${typeLabels[t.type]} | ${t.description} | ${
              t.amount > 0 ? "+" : ""
            }${t.amount.toLocaleString("vi-VN")}đ | ${
              t.status === "completed" ? "Hoàn thành" : "Đang xử lý"
            }`,
        ),
      ].join("\n");

      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vi-hoc-phi-${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file thành công!");
    }, 1000);
  };

  return (
    <div className="px-4 sm:px-6 pt-3 pb-6 space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Wallet */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-5 sm:p-6 shadow-lg min-h-[180px] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80">Số dư ví</p>
              <p className="text-2xl sm:text-3xl font-bold leading-tight">
                {walletBalance.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              onClick={() => setShowDeposit(true)}
              className="w-full rounded-xl gap-1.5 bg-white text-blue-600 hover:bg-white/90 h-10"
              size="sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Nạp tiền
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowWithdraw(true)}
                variant="ghost"
                className="rounded-xl gap-1.5 bg-white/10 hover:bg-white/20 text-white h-10"
                size="sm"
              >
                <ArrowUpRight className="w-4 h-4 shrink-0" />
                Rút tiền
              </Button>

              <Button
                onClick={() => setShowPayTuition(true)}
                variant="ghost"
                className="rounded-xl gap-1.5 bg-white/10 hover:bg-white/20 text-white h-10"
                size="sm"
              >
                <Receipt className="w-4 h-4 shrink-0" />
                Thanh toán
              </Button>
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-5 sm:p-6 shadow-lg min-h-[180px] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80">Tổng chi</p>
              <p className="text-2xl sm:text-3xl font-bold leading-tight">
                {totalSpent.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-4 min-h-[2.5rem]">
            Tổng các giao dịch chi tiêu đã hoàn thành
          </p>
        </div>

        {/* Refund */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-3xl p-5 sm:p-6 shadow-lg min-h-[180px] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80">Hoàn tiền</p>
              <p className="text-2xl sm:text-3xl font-bold leading-tight">
                {totalRefunded.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-4 min-h-[2.5rem]">
            Các khoản hoàn tiền đã xử lý
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Chi tiêu theo tháng
          </h3>

          {monthlyData.length > 0 ? (
            <ChartContainer
              config={{
                amount: { label: "Chi tiêu", color: "hsl(224, 76%, 48%)" },
              }}
              className="h-[260px] w-full"
            >
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/50"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Chưa có dữ liệu
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Phân bổ chi tiêu
          </h3>

          {spendingByType.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-[220px] w-full md:w-[220px] shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      stroke="none"
                    >
                      {spendingByType.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 flex-1">
                {spendingByType.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <p className="text-sm font-medium text-foreground">
                        {d.name}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {d.value.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Chưa có dữ liệu
            </p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h3 className="text-base font-semibold text-foreground">
            Lịch sử giao dịch
          </h3>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-sm gap-2 h-10"
            onClick={handleExportPDF}
          >
            <Download className="w-4 h-4" />
            Xuất file
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm giao dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-11"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Tất cả", value: "all" },
              { label: "Nạp tiền", value: "deposit" },
              { label: "Rút tiền", value: "withdrawal" },
              { label: "Học phí", value: "tuition_payment" },
              { label: "Đề thi", value: "mock_exam_purchase" },
              { label: "Hoàn tiền", value: "refund" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors",
                  typeFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {txLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải giao
              dịch...
            </div>
          )}

          {!txLoading &&
            filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 sm:gap-4 p-4 border border-border/60 hover:bg-muted/30 rounded-2xl transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted shrink-0">
                  {t.amount > 0 ? (
                    <ArrowDownLeft className="w-4 h-4 text-foreground" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-[15px] font-medium text-foreground truncate">
                    {t.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.date} • {typeLabels[t.type]}
                    {t.paymentMethod ? ` • ${t.paymentMethod}` : ""}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm sm:text-[15px] font-semibold",
                      t.amount > 0
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString("vi-VN")}đ
                  </p>
                  <span
                    className={cn(
                      "inline-block text-[10px] mt-1 px-2 py-0.5 rounded-lg",
                      t.status === "completed"
                        ? "bg-success/15 text-success dark:bg-emerald-900/20"
                        : "bg-warning/15 text-warning dark:bg-amber-900/20",
                    )}
                  >
                    {t.status === "completed" ? "Hoàn thành" : "Đang xử lý"}
                  </span>
                </div>
              </div>
            ))}

          {!txLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Không có giao dịch nào
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-1">
        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs sm:text-sm text-muted-foreground text-center">
          Secure Payment • VNPay • MoMo • Ngân hàng
        </span>
      </div>

      {/* Deposit Dialog */}
      <Dialog
        open={showDeposit}
        onOpenChange={(open) => {
          setShowDeposit(open);
          if (!open) resetDialogState();
        }}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Nạp tiền vào ví</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground">
                Số tiền
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 rounded-xl h-11"
                placeholder="Nhập số tiền"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {[100000, 200000, 500000, 1000000, 2000000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {(v / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Phương thức thanh toán
              </label>
              <div className="space-y-2 mt-3">
                {depositMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all",
                      selectedMethod === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={
                !amount ||
                parseInt(amount) <= 0 ||
                !selectedMethod ||
                depositMutation.isPending ||
                testDepositMutation.isPending
              }
              className="w-full rounded-xl h-11"
            >
              {testDepositMutation.isPending || depositMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                "Xác nhận nạp tiền"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Tuition Dialog */}
      <Dialog
        open={showPayTuition}
        onOpenChange={(open) => setShowPayTuition(open)}
      >
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Thanh toán học phí</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-1">
              Số dư ví:{" "}
              <span className="font-semibold text-foreground">
                {walletBalance.toLocaleString("vi-VN")}đ
              </span>
            </p>

            {/* TODO(BE): no pay-tuition endpoint (tuition is escrowed at class creation) */}
            <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Học phí được giữ trong escrow ngay khi tạo lớp và giải ngân theo
                buổi học. Hiện chưa có luồng thanh toán học phí riêng.
              </p>
            </div>

            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Không có lớp đang hoạt động.
              </p>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center gap-3 p-4 border border-border rounded-2xl"
                >
                  <img
                    src={cls.tutorAvatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-[15px] font-medium text-foreground truncate">
                      {cls.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cls.tutorName}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {cls.fee.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs h-9 px-4"
                    disabled
                    onClick={() => handlePayTuitionItem(cls)}
                  >
                    Đã giữ escrow
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog
        open={showWithdraw}
        onOpenChange={(open) => {
          setShowWithdraw(open);
          if (!open) resetDialogState();
        }}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Rút tiền từ ví</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Số dư khả dụng:{" "}
              <strong className="text-foreground">
                {walletBalance.toLocaleString("vi-VN")}đ
              </strong>
            </p>

            <div>
              <label className="text-sm font-medium text-foreground">
                Số tiền
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 rounded-xl h-11"
                placeholder="Nhập số tiền"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {[100000, 200000, 500000, 1000000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {(v / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Phương thức nhận tiền
              </label>
              <div className="space-y-2 mt-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all",
                      selectedMethod === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={
                !amount ||
                parseInt(amount) <= 0 ||
                !selectedMethod ||
                parseInt(amount) > walletBalance
              }
              className="w-full rounded-xl h-11"
            >
              Xác nhận rút tiền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentWallet;
