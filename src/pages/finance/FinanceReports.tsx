import { useFinanceReports } from "@/hooks/useFinance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trophy,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
} from "lucide-react";

const tooltipStyle = {
  borderRadius: "1rem",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

const FinanceReports = () => {
  const { data: report, isLoading } = useFinanceReports();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải báo cáo tài chính...
      </div>
    );
  }

  const totalRevenue = report?.totalRevenue ?? 0;
  const totalWithdrawn = report?.totalWithdrawn ?? 0;
  const totalRefunded = report?.totalRefunded ?? 0;
  const totalEscrow = report?.totalEscrow ?? 0;

  // Map the monthly revenue series ("yyyy-MM" -> amount) onto the charts.
  const monthlyData = (report?.monthlyRevenue ?? []).map((m) => {
    const [, mm] = m.month.split("-");
    return {
      month: mm ? `T${parseInt(mm, 10)}` : m.month,
      revenue: m.amount,
    };
  });

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng doanh thu",
            value: `${totalRevenue.toLocaleString("vi-VN")}đ`,
            sub: "Tổng cộng",
            icon: DollarSign,
            color: "from-blue-500 to-indigo-500",
          },
          {
            label: "Đã rút",
            value: `${totalWithdrawn.toLocaleString("vi-VN")}đ`,
            sub: "Tổng tiền rút",
            icon: TrendingDown,
            color: "from-rose-500 to-pink-500",
          },
          {
            label: "Đã hoàn tiền",
            value: `${totalRefunded.toLocaleString("vi-VN")}đ`,
            sub: "Tổng hoàn trả",
            icon: TrendingUp,
            color: "from-emerald-500 to-teal-500",
          },
          {
            label: "Đang ký quỹ",
            value: `${totalEscrow.toLocaleString("vi-VN")}đ`,
            sub: "Số dư escrow",
            icon: Trophy,
            color: "from-amber-500 to-orange-500",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white transition-all hover:shadow-lg ${s.color}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80">
                <ArrowUpRight className="h-3 w-3" />
                {s.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* BAR CHART */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" />
          Doanh thu theo tháng
        </h3>

        {monthlyData.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickFormatter={v => `${(v / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                formatter={(v: number) => `${v.toLocaleString("vi-VN")}đ`}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="revenue" name="Doanh thu" fill="hsl(224, 76%, 48%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* BREAKDOWNS — no backend data */}
      {/* TODO(BE): finance report only exposes totalRevenue/Withdrawn/Refunded/Escrow + monthlyRevenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Cơ cấu nguồn thu
          </h3>
          <div className="py-12 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Cơ cấu chi phí
          </h3>
          <div className="py-12 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        </div>
      </div>

      {/* AREA CHART */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Xu hướng doanh thu</h3>

        {monthlyData.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickFormatter={v => `${(v / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                formatter={(v: number) => `${v.toLocaleString("vi-VN")}đ`}
                contentStyle={tooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#revenueGrad)"
                strokeWidth={2}
                name="Doanh thu"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* TOP TUTORS — no backend data */}
      {/* TODO(BE): finance report only exposes totalRevenue/Withdrawn/Refunded/Escrow + monthlyRevenue */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          Top gia sư & giáo viên có doanh thu cao
        </h3>
        <div className="py-12 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu
        </div>
      </div>
    </div>
  );
};

export default FinanceReports;
