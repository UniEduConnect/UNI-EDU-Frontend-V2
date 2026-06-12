import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Lock, Undo2, ArrowLeftRight, Banknote, BarChart3, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFinanceDashboard } from "@/hooks/useDashboard";
import { useFinanceTransactions, useFinanceReports } from "@/hooks/useFinance";

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashboardLoading } = useFinanceDashboard();
  const { transactions, isLoading: txLoading } = useFinanceTransactions();
  const { data: reports } = useFinanceReports();

  const totalRevenue = dashboard?.totalRevenue ?? 0;
  const pendingWithdrawals = dashboard?.pendingWithdrawals ?? 0;
  const totalEscrow = dashboard?.totalEscrow ?? 0;
  const refundsPending = dashboard?.refundsPending ?? 0;

  const recentTx = transactions.slice(0, 5);

  // Monthly revenue time-series from GET /Finance/reports (mapped to chart shape).
  const revenueData = (reports?.monthlyRevenue ?? []).map((m) => ({
    month: m.month,
    revenue: m.amount,
  }));

  const quickActions = [
    { label: "Giao dịch", icon: ArrowLeftRight, action: () => navigate("/finance/transactions") },
    { label: "Thanh toán GS", icon: Banknote, action: () => navigate("/finance/payouts") },
    { label: "Báo cáo", icon: BarChart3, action: () => navigate("/finance/reports") },
  ];

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan tài chính</h1>
        <p className="text-muted-foreground text-sm">Kế toán · Hôm nay, 03/03/2026</p>
      </div> */}

     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Card 1 */}
  <Card className="border-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg">
    <CardContent className="p-4">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
        <DollarSign className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold">{dashboardLoading ? "…" : `${totalRevenue.toLocaleString("vi-VN")}đ`}</p>
      <p className="text-xs text-white/80 mt-1">Tổng doanh thu</p>
    </CardContent>
  </Card>

  {/* Card 2 */}
  <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
    <CardContent className="p-4">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
        <Lock className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold">{dashboardLoading ? "…" : `${totalEscrow.toLocaleString("vi-VN")}đ`}</p>
      <p className="text-xs text-white/80 mt-1">Đang ký quỹ</p>
    </CardContent>
  </Card>

  {/* Card 3 */}
  <Card className="border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
    <CardContent className="p-4">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
        <Clock className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold">{dashboardLoading ? "…" : `${pendingWithdrawals.toLocaleString("vi-VN")}đ`}</p>
      <p className="text-xs text-white/80 mt-1">Chờ thanh toán</p>
    </CardContent>
  </Card>

  {/* Card 4 */}
  <Card className="border-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
    <CardContent className="p-4">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
        <Undo2 className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold">{dashboardLoading ? "…" : `${refundsPending.toLocaleString("vi-VN")}đ`}</p>
      <p className="text-xs text-white/80 mt-1">Hoàn tiền chờ duyệt</p>
    </CardContent>
  </Card>
</div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Doanh thu các tháng gần nhất</CardTitle></CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                Chưa có dữ liệu doanh thu
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("vi-VN")}đ`} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Giao dịch gần đây</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {txLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
              </div>
            ) : recentTx.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
            ) : (
              recentTx.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-xl">
                  <div>
                    <p className="text-xs font-medium text-foreground">{t.description}</p>
                    <p className="text-[10px] text-muted-foreground">{t.date}</p>
                  </div>
                  <span className={`text-xs font-bold ${t.type === "tuition" || t.type === "deposit" ? "text-primary" : "text-foreground"}`}>
                    {t.type === "refund" ? "-" : "+"}{t.amount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="text-base">Hành động nhanh</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(a => (
              <Button key={a.label} variant="outline" onClick={a.action} className="h-auto py-4 flex flex-col gap-2 rounded-xl">
                <a.icon className="w-5 h-5" />
                <span className="text-xs">{a.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;
