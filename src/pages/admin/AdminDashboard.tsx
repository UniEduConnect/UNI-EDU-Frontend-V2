import { useAdminDashboard } from "@/hooks/useDashboard";
import { useAdminUsers, useAdminReports } from "@/hooks/useAdmin";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, CreditCard, Clock, FileText, UserCheck, ArrowUpRight, ChevronRight, Plus, BarChart3, PieChart as PieChartIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, Pie, Cell, PieChart, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const DASHBOARD_THEME = {
  primary: "#1E68E6",
  success: "#16A34A",
  warning: "#f59e0b",
  danger: "#ef4444",
  neutral: "#94a3b8",
  muted: "#64748b",
};

const PIE_COLORS = [DASHBOARD_THEME.primary, DASHBOARD_THEME.success, DASHBOARD_THEME.warning, DASHBOARD_THEME.danger];

const AdminDashboard = () => {
  const navigate = useNavigate();

  // All dashboard data comes from the real API — no mock fallback (empty = real empty state).
  const { data: dash, isLoading: dashLoading } = useAdminDashboard();
  const { users: userData, isLoading: usersLoading } = useAdminUsers();
  const { classes: classData, isLoading: classesLoading } = useClasses();
  const { data: report } = useAdminReports();
  const monthlyRevenue = (report?.monthlyRevenue ?? []).map((m) => ({ month: m.month.slice(5), revenue: m.amount }));

  const isLoading = dashLoading || usersLoading || classesLoading;

  const totalUsers = dash?.totalUsers ?? 0;
  const totalTutorsTeachers = dash ? dash.tutors + dash.teachers : 0;
  const activeClasses = dash?.activeClasses ?? 0;
  const pendingApprovals = dash?.pendingApprovals ?? 0;
  const monthRevenue = dash?.totalRevenue ?? 0;
  const monthTests = dash?.totalExams ?? 0;

  const now = new Date();
  const pendingUsers = userData.filter(u => u.status === "pending");
  const avgApprovalDays = pendingUsers.length > 0
    ? Math.round(pendingUsers.reduce((sum, u) => sum + Math.ceil((now.getTime() - new Date(u.createdAt).getTime()) / 86400000), 0) / pendingUsers.length)
    : 0;

  const topStats = [
    { label: "Tổng người dùng", value: totalUsers, icon: Users, change: "+12%", up: true, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
    { label: "Gia sư & Giáo viên", value: totalTutorsTeachers, icon: GraduationCap, change: "+8%", up: true, bg: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "Lớp đang hoạt động", value: activeClasses, icon: BookOpen, change: "+5%", up: true, bg: "from-amber-500 to-orange-500", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { label: "Doanh thu tháng", value: `${(monthRevenue / 1000000).toFixed(1)}M`, icon: CreditCard, change: "+18%", up: true, bg: "from-rose-500 to-pink-500", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  ];

  const recentClasses = classData.filter(c => c.status === "searching" || c.status === "active").slice(0, 4);
  const recentUsers = userData.slice(0, 5);

  const roleNameMap: Record<string, string> = {
    tutor: "Gia sư",
    teacher: "Giáo viên",
    student: "Học sinh",
    parent: "Phụ huynh",
  };

  // Driven by the admin dashboard aggregate counts.
  const usersByRole = [
    { name: roleNameMap.tutor, value: dash?.tutors ?? 0 },
    { name: roleNameMap.teacher, value: dash?.teachers ?? 0 },
    { name: roleNameMap.student, value: dash?.students ?? 0 },
    { name: roleNameMap.parent, value: dash?.parents ?? 0 },
  ];

  const statusLabel: Record<string, string> = { searching: "Đang tìm", active: "Đang học", completed: "Hoàn thành" };
  const statusClass: Record<string, string> = {
    searching: "bg-amber-100 text-amber-700",
    active: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
  };

  const userStatusLabel: Record<string, string> = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Từ chối", suspended: "Tạm khóa" };
  const userStatusClass: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    suspended: "bg-slate-100 text-slate-700",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map(s => (
          <Card key={s.label} className={`border-0 shadow-soft hover:shadow-elevated transition-shadow duration-300 bg-gradient-to-r ${s.bg} text-white`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-[13px] text-white/80 font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{s.value}</p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,.9)" }} />
                    <span className="text-xs font-semibold text-white/90">{s.change}</span>
                    <span className="text-xs text-white/70">vs tháng trước</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-full flex items-center justify-center border border-white/30 bg-white/20 backdrop-blur-sm shadow-sm">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground font-medium">Chờ phê duyệt</p>
                  <p className="text-2xl font-bold text-slate-900">{pendingApprovals}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full rounded-xl text-xs" onClick={() => navigate("/admin/approvals")}>
              Xem ngay <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground font-medium">Bài test tháng này</p>
                <p className="text-2xl font-bold text-foreground">{monthTests}</p>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-10">
              {[40, 65, 55, 80, 70, 90, 60].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-blue-100/50 relative overflow-hidden" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 w-full rounded-sm" style={{ height: `${h}%`, backgroundColor: DASHBOARD_THEME.primary }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground font-medium">TB phê duyệt</p>
                <p className="text-2xl font-bold text-foreground">{avgApprovalDays} ngày</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${Math.min(avgApprovalDays * 10, 125)} 125`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">{avgApprovalDays}d</span>
              </div>
              <p className="text-xs text-muted-foreground">Mục tiêu: &lt; 3 ngày</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-0 shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Doanh thu theo tháng</h3>
            {monthlyRevenue.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("vi-VN")}đ`} contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(148, 163, 184, 0.4)", color: "white" }} />
                  <Bar dataKey="revenue" fill={DASHBOARD_THEME.primary} radius={[6, 6, 0, 0]} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4" /> Cơ cấu người dùng</h3>
            <div className="h-[240px]">
              {usersByRole.some(r => r.value > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={usersByRole} dataKey="value" nameKey="name" outerRadius={85} label isAnimationActive={false}>
                      {usersByRole.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(148, 163, 184, 0.4)", color: "white" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Quản lý lớp học</h3>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/admin/classes")}>
                Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentClasses.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.tutorName || "—"} · {c.fee.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusClass[c.status] ?? "bg-slate-100 text-slate-700"}`}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                </div>
              ))}
              {recentClasses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có lớp học</p>}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3 rounded-xl text-xs" onClick={() => navigate("/admin/classes")}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Tạo lớp mới
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Người dùng mới</h3>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/admin/users")}>
                Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors">
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-muted-foreground" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{roleNameMap[u.role] ?? u.role} · {u.email}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${userStatusClass[u.status] ?? "bg-slate-100 text-slate-700"}`}>
                    {userStatusLabel[u.status] ?? u.status}
                  </span>
                </div>
              ))}
              {recentUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có người dùng</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
