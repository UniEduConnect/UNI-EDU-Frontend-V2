import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { CreditCard, BookOpen, Users, GraduationCap, Loader2 } from "lucide-react";
import { useAdminReports } from "@/hooks/useAdmin";
import { useAdminDashboard } from "@/hooks/useDashboard";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

const AdminReports = () => {
  const { data: report, isLoading: reportLoading } = useAdminReports();
  const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();

  const isLoading = reportLoading || dashboardLoading;

  const stats = [
    { label: "Tổng doanh thu", value: `${((report?.totalRevenue ?? 0) / 1000000).toFixed(1)}M`, icon: CreditCard, color: "bg-primary/10 text-primary" },
    { label: "Tổng lớp học", value: report?.totalClasses ?? 0, icon: BookOpen, color: "bg-success/10 text-success" },
    { label: "Tổng người dùng", value: report?.totalUsers ?? 0, icon: Users, color: "bg-warning/10 text-warning" },
    { label: "Tổng đề thi", value: report?.totalExams ?? 0, icon: GraduationCap, color: "bg-secondary/20 text-secondary-foreground" },
  ];

  const monthlyRevenue = useMemo(
    () =>
      (report?.monthlyRevenue ?? []).map((m) => ({
        month: m.month.slice(5),
        revenue: m.amount,
      })),
    [report]
  );

  const newUsers = useMemo(
    () => (report?.newUsersByMonth ?? []).map((m) => ({ month: m.month.slice(5), count: m.count })),
    [report]
  );

  const TYPE_LABEL: Record<string, string> = {
    Deposit: "Nạp tiền", EscrowIn: "Học phí", EscrowRelease: "Giải ngân", Withdrawal: "Rút tiền",
    Refund: "Hoàn tiền", PlatformFee: "Phí nền tảng", TransferIn: "Nhận CK", TransferOut: "Chuyển đi",
  };
  const revenueByType = useMemo(
    () => (report?.revenueByType ?? []).map((t) => ({ name: TYPE_LABEL[t.type] ?? t.type, value: t.amount })).filter((e) => e.value > 0),
    [report]
  );

  // Users by role for pie chart — sourced from the admin dashboard counts.
  const usersByRole = useMemo(() => {
    if (!dashboard) return [] as { name: string; value: number }[];
    return [
      { name: "Gia sư", value: dashboard.tutors },
      { name: "Giáo viên", value: dashboard.teachers },
      { name: "Học sinh", value: dashboard.students },
      { name: "Phụ huynh", value: dashboard.parents },
    ].filter((e) => e.value > 0);
  }, [dashboard]);

  const chartConfig = {
    revenue: { label: "Doanh thu", color: "hsl(var(--chart-1))" },
    count: { label: "Người dùng mới", color: "hsl(var(--chart-1))" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải báo cáo...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-0 shadow-soft">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Revenue bar + User growth (no source) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Doanh thu theo tháng</h3>
            {monthlyRevenue.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name="Doanh thu" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Xu hướng người dùng mới</h3>
            {newUsers.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <BarChart data={newUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} name="Người dùng mới" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Phân bổ doanh thu theo loại</h3>
            {revenueByType.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <>
                <div className="h-[230px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={revenueByType} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                        {revenueByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                  {revenueByType.map((e, i) => (
                    <span key={e.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{e.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Phân bổ người dùng theo vai trò</h3>
            {usersByRole.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <>
                <div className="h-[280px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={usersByRole}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={false}
                      >
                        {usersByRole.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {usersByRole.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
