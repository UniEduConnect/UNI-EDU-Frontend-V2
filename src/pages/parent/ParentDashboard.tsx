import {
  Users,
  Bell,
  Star,
  BookOpen,
  BarChart3,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useParentDashboard } from "@/hooks/useDashboard";
import { useParentChildren } from "@/hooks/useParentChildren";
import { useMe } from "@/hooks/useUsers";
import { useNotifications } from "@/hooks/useNotifications";
import { useClasses } from "@/hooks/useClasses";

const ParentDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashLoading } = useParentDashboard();
  const { children, isLoading: childrenLoading } = useParentChildren();
  const { data: me } = useMe();
  const { notifications } = useNotifications();
  // Parent-scoped: backend filters these to the parent's children
  // (Class.Student.ParentID == caller). May 403 for seed-data parents
  // (known role bug) — the hooks return empty arrays in that case.
  const { classes, isLoading: classesLoading } = useClasses({ Status: "active" });

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Per-child progress: group the children's active classes by studentName.
  const progressByChild = classes.reduce<Record<string, typeof classes>>(
    (acc, c) => {
      const key = c.studentName || "Con";
      (acc[key] ??= []).push(c);
      return acc;
    },
    {}
  );

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 bg-white/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 bg-cyan-300/10 blur-2xl rounded-full" />

        <div className="relative">
          <h2 className="text-2xl font-bold">
            Xin chào {me?.fullname ?? "Phụ huynh"}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            Theo dõi tình hình học tập của con bạn
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Số con",
            value: dashboard?.childrenCount ?? children.length,
            sub: `${dashboard?.activeClasses ?? 0} lớp đang học`,
            color: "from-blue-500 to-indigo-500",
            icon: Users,
          },
          {
            label: "Thông báo",
            value: unreadNotifs,
            sub: "Chưa đọc",
            color: "from-amber-500 to-orange-500",
            icon: Bell,
          },
          {
            label: "Chờ xác nhận",
            value: dashboard?.pendingConfirmations ?? 0,
            sub: "Cần xử lý",
            color: "from-emerald-500 to-teal-500",
            icon: Star,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={cn(
              "group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white hover:shadow-lg transition-all",
              s.color
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{dashLoading ? "…" : s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4" />
          </div>
        ))}
      </div>

      {/* CHILDREN */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Con em</h3>

        {childrenLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
          </div>
        ) : children.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children.map((child) => (
              <div
                key={child.id}
                onClick={() => navigate("/parent/children")}
                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-muted/70 transition cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {child.fullName.charAt(0)}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold">{child.fullName}</p>
                  <p className="text-xs text-muted-foreground">Lớp {child.grade}</p>

                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {child.school}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHILD PROGRESS */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Tiến độ học tập của con
        </h3>

        {classesLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
          </div>
        ) : classes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có lớp học nào đang diễn ra
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(progressByChild).map(([studentName, childClasses]) => (
              <div key={studentName}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {studentName.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold">{studentName}</p>
                  <span className="text-xs text-muted-foreground">
                    {childClasses.length} lớp
                  </span>
                </div>

                <div className="space-y-3">
                  {childClasses.map((c) => {
                    const pct =
                      c.totalSessions > 0
                        ? Math.round((c.completedSessions / c.totalSessions) * 100)
                        : 0;
                    return (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/parent/children`)}
                        className="rounded-2xl bg-muted/40 p-4 hover:bg-muted/70 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.subject} · GV {c.tutorName}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-primary">
                            {c.completedSessions}/{c.totalSessions} buổi
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NOTIFICATIONS */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Thông báo</h3>

        {notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có thông báo
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-3 rounded-2xl",
                  !n.read ? "bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
