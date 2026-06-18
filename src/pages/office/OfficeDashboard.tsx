import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, AlertTriangle, CalendarDays, ClipboardCheck, Clock, UserPlus, Inbox, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOfficeDashboard } from "@/hooks/useDashboard";
import { useAttendance, useIncidents } from "@/hooks/useOffice";
import { useClasses } from "@/hooks/useClasses";
import { useNotifications } from "@/hooks/useNotifications";

const OfficeDashboard = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useOfficeDashboard();
  const { attendance, isLoading: attLoading } = useAttendance();
  const { incidents, isLoading: incLoading } = useIncidents();
  const { classes } = useClasses();
  const { notifications } = useNotifications();

  const activeClasses = dashboard?.activeClasses ?? 0;
  const pendingAttendance = dashboard?.pendingAttendance ?? 0;
  const openIncidents = dashboard?.openIncidents ?? 0;
  const totalClasses = classes.length;

  const recentAttendance = attendance.slice(0, 5);
  const recentIncidents = incidents.slice(0, 5);

  const quickActionsList = [
    { label: "Quản lý đăng ký", icon: UserPlus, action: () => navigate("/office/registrations") },
    { label: "Điểm danh", icon: ClipboardCheck, action: () => navigate("/office/attendance") },
    { label: "Xử lý sự cố", icon: AlertTriangle, action: () => navigate("/office/incidents") },
    { label: "Quản lý lớp", icon: BookOpen, action: () => navigate("/office/classes") },
    { label: "Lịch hẹn", icon: Calendar, action: () => navigate("/office/appointments") },
    { label: "Xếp lịch AI", icon: CalendarDays, action: () => navigate("/office/ai-schedule") },
  ];

  if (dashLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải bảng điều khiển...
      </div>
    );
  }

  if (dashError) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tải được bảng điều khiển. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lớp đang học */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{activeClasses}</p>
              <p className="text-xs text-white/80 mt-1">Lớp đang học</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Cảnh báo điểm danh */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{pendingAttendance}</p>
              <p className="text-xs text-white/80 mt-1">Cảnh báo điểm danh</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tổng số lớp */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{totalClasses}</p>
              <p className="text-xs text-white/80 mt-1">Tổng số lớp</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Sự cố chờ xử lý */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{openIncidents}</p>
              <p className="text-xs text-white/80 mt-1">Sự cố chờ xử lý</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Điểm danh gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attLoading ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải...
              </div>
            ) : recentAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu điểm danh</p>
            ) : (
              recentAttendance.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.className}</p>
                    <p className="text-xs text-muted-foreground">{a.tutor} → {a.student}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{a.date}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông báo gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có thông báo</p>
            ) : (
              notifications.slice(0, 4).map(n => (
                <div key={n.id} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    n.type === "error" ? "bg-destructive" : n.type === "warning" ? "bg-muted-foreground" : n.type === "success" ? "bg-primary" : "bg-border"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sự cố gần đây</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {incLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải...
            </div>
          ) : recentIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Không có sự cố nào</p>
          ) : (
            recentIncidents.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.className}</p>
                  <p className="text-xs text-muted-foreground">{item.reporter} ({item.reporterRole}) • {item.description} • Ưu tiên: {item.priority}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/office/incidents")}>Xử lý</Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActionsList.map(a => (
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

export default OfficeDashboard;
