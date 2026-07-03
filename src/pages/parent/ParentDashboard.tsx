import {
  Wallet,
  Users,
  Bell,
  Star,
  CreditCard,
  MessageSquare,
  HelpCircle,
  BookOpen,
  BarChart3,
  UserRoundSearch,
  ArrowUpRight,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useParentDashboard } from "@/hooks/useDashboard";
import { useParentChildren } from "@/hooks/useParentChildren";
import { useWallet, useWalletTransactions } from "@/hooks/useWallet";
import { useMe } from "@/hooks/useUsers";
import { useNotifications } from "@/hooks/useNotifications";
import { useClasses } from "@/hooks/useClasses";
import { useMySchedule } from "@/hooks/useSchedule";
import { formatSessionClock } from "@/lib/sessionTime";

// Vietnam-local "dd/MM" — pinning the timezone avoids the browser-local-time display bug
// already fixed elsewhere (see @/lib/sessionTime.ts).
const formatSessionDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

const ParentDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashLoading } = useParentDashboard();
  const { children, isLoading: childrenLoading } = useParentChildren();
  const { data: wallet } = useWallet();
  const { transactions } = useWalletTransactions();
  const { data: me } = useMe();
  const { notifications } = useNotifications();
  // Parent-scoped: backend filters these to the parent's children
  // (Class.Student.ParentID == caller). May 403 for seed-data parents
  // (known role bug) — the hooks return empty arrays in that case.
  const { classes, isLoading: classesLoading } = useClasses({ Status: "active" });
  const { sessions, isLoading: sessionsLoading } = useMySchedule();

  const walletBalance = wallet?.balance ?? dashboard?.walletBalance ?? 0;
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

  // Upcoming sessions: join class/tutor names onto sessions via classId map.
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const upcomingSessions = [...sessions]
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5)
    .map((s) => {
      const cls = classMap.get(s.classId);
      return {
        id: s.id,
        studentName: cls?.studentName ?? "",
        className: cls?.name ?? "Buổi học",
        subject: cls?.subject ?? "",
        tutorName: cls?.tutorName ?? "",
        date: formatSessionDate(s.startAt),
        time: `${formatSessionClock(s.startAt)} - ${formatSessionClock(s.endAt)}`,
      };
    });

  // Total spent = sum of outflow transactions (negative amounts on the wallet).
  const totalSpent = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  );

  const quickActions = [
    { label: "Con em & tiến độ", icon: Users, action: () => navigate("/parent/children"), desc: "Theo dõi lớp học" },
    { label: "Thanh toán học phí", icon: CreditCard, action: () => navigate("/parent/wallet"), desc: "Quản lý học phí" },
    { label: "Tin nhắn", icon: MessageSquare, action: () => navigate("/parent/chat"), desc: "Trao đổi gia sư" },
    { label: "Hỗ trợ", icon: HelpCircle, action: () => navigate("/parent/support"), desc: "Khiếu nại & hỗ trợ" },
    { label: "Tìm gia sư", icon: UserRoundSearch, action: () => navigate("/find-tutor"), desc: "Tìm gia sư phù hợp" },
  ];

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 bg-white/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 bg-cyan-300/10 blur-2xl rounded-full" />

        <div className="relative flex flex-col lg:flex-row justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              Xin chào {me?.fullname ?? "Phụ huynh"}
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Theo dõi tình hình học tập và tài chính của con bạn
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[320px]">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur">
              <p className="text-xs">Tổng chi</p>
              <p className="text-xl font-bold">{totalSpent.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur">
              <p className="text-xs">Số dư</p>
              <p className="text-xl font-bold">{walletBalance.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          {
            label: "Chi tiêu",
            value: `${totalSpent.toLocaleString("vi-VN")}đ`,
            sub: "Học phí",
            color: "from-rose-500 to-pink-500",
            icon: Wallet,
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

      {/* UPCOMING SESSIONS */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          Buổi học sắp tới
        </h3>

        {sessionsLoading || classesLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
          </div>
        ) : upcomingSessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có buổi học nào sắp tới
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate("/parent/children")}
                className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition cursor-pointer"
              >
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.className}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.studentName ? `${s.studentName} · ` : ""}
                    {s.subject ? `${s.subject} · ` : ""}GV {s.tutorName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{s.date}</p>
                  <p className="text-xs text-muted-foreground">{s.time}</p>
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

      {/* QUICK ACTION */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Hành động nhanh</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <button
              key={i}
              onClick={a.action}
              className="rounded-2xl bg-muted/40 p-4 hover:bg-muted/70 transition"
            >
              <a.icon className="w-5 h-5 mb-2" />
              <p className="text-sm font-medium">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
