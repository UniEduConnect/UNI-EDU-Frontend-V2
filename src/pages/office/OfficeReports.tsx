import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, TrendingUp, BarChart3, Users, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOfficeReports } from "@/hooks/useOffice";
import { useClasses } from "@/hooks/useClasses";

const COLORS = [
  "#ef4444", // đỏ
  "#f59e0b", // cam
  "#3b82f6", // xanh dương
  "#10b981", // xanh lá
  "#a855f7", // tím
];


const OfficeReports = () => {
  const { toast } = useToast();
  const { data: report, isLoading: reportLoading } = useOfficeReports();
  const { classes, isLoading: classesLoading } = useClasses();

  const isLoading = reportLoading || classesLoading;

  const activeClasses = classes.filter(
    (c) => c.status?.toLowerCase() === "active",
  ).length;

  // Pie "Phân bổ lớp theo môn" — derived from live classes grouped by subject.
  const classDistribution = Object.entries(
    classes.reduce<Record<string, number>>((acc, c) => {
      const key = c.subject || "Khác";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải báo cáo...
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tổng buổi học */}
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{report?.totalSessions ?? 0}</p>
              <p className="text-xs text-white/80 mt-1">Tổng buổi học</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Buổi đã hoàn thành */}
        <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{report?.completedSessions ?? 0}</p>
              <p className="text-xs text-white/80 mt-1">Buổi đã hoàn thành</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Buổi vắng */}
        <Card className="border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{report?.missedSessions ?? 0}</p>
              <p className="text-xs text-white/80 mt-1">Buổi vắng</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: HS đang học */}
        <Card className="border-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{activeClasses}</p>
              <p className="text-xs text-white/80 mt-1">HS đang học</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Buổi học & Sự cố theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO(BE): office report time-series not exposed (only the 5 aggregate counts) */}
            <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
              Chưa có dữ liệu
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Phân bổ lớp theo môn</CardTitle>
          </CardHeader>
          <CardContent>
            {classDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={classDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {classDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-soft border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Thống kê qua các tuần</CardTitle>
          <p className="text-xs text-muted-foreground">So sánh các chỉ số qua các tuần</p>
        </CardHeader>
        <CardContent>
          {/* TODO(BE): office report time-series not exposed (only the 5 aggregate counts) */}
          <div className="rounded-xl overflow-hidden border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tuần</TableHead>
                  <TableHead className="text-center">Đăng ký mới</TableHead>
                  <TableHead className="text-center">Lớp tạo mới</TableHead>
                  <TableHead className="text-center">Yêu cầu xử lý</TableHead>
                  <TableHead className="text-center">Tỷ lệ hài lòng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Chưa có dữ liệu
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Chỉ số KPI</CardTitle>
            <p className="text-xs text-muted-foreground">Hiệu suất so với mục tiêu</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TODO(BE): office report time-series not exposed (only the 5 aggregate counts) */}
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground py-6">Chưa có dữ liệu</p>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tổng quan nhanh</CardTitle>
            <p className="text-xs text-muted-foreground">Số liệu vận hành theo thời gian thực</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Tổng buổi học", value: report?.totalSessions ?? 0 },
              { label: "Đã hoàn thành", value: report?.completedSessions ?? 0 },
              { label: "Vắng / bỏ lỡ", value: report?.missedSessions ?? 0 },
              { label: "Sự cố đang mở", value: report?.openIncidents ?? 0 },
              { label: "Sự cố đã xử lý", value: report?.resolvedIncidents ?? 0 },
            ].map((r) => (
              <div key={r.label} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border">
                <span className="flex items-center gap-3 text-sm text-foreground"><FileText className="w-4 h-4 text-muted-foreground" />{r.label}</span>
                <span className="text-sm font-bold text-foreground">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OfficeReports;
