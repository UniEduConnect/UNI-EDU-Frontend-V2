import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  ChevronRight,
  Search,
  ClipboardCheck,
  BarChart3,
  Wallet,
  Sparkles,
  GraduationCap,
  Loader2,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useStudentDashboard } from "@/hooks/useDashboard";
import { useWallet } from "@/hooks/useWallet";
import { useClasses } from "@/hooks/useClasses";
import { useMySchedule } from "@/hooks/useSchedule";
import { useMySubmissions } from "@/hooks/useExams";
import {
  useMyStudentProfile,
  useParentLinkRequests,
  useRespondParentLink,
} from "@/hooks/useStudents";

const formatSessionDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

const formatSessionTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const StudentDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashboardLoading } = useStudentDashboard();
  const { data: wallet } = useWallet();
  const { classes, isLoading: classesLoading } = useClasses({ Status: "active" });
  const { sessions, isLoading: sessionsLoading } = useMySchedule();
  const { submissions, isLoading: submissionsLoading } = useMySubmissions();
  const { data: profile } = useMyStudentProfile();
  const { requests } = useParentLinkRequests();
  const respond = useRespondParentLink();

  const activeClasses = dashboard?.activeClasses ?? 0;
  const upcomingSessionsCount = dashboard?.upcomingSessions ?? 0;
  const avgScore = dashboard?.avgScore ?? 0;
  const examsTaken = dashboard?.examsTaken ?? 0;
  const walletBalance = wallet?.balance ?? 0;
  const escrowBalance = wallet?.escrowBalance ?? 0;

  // Join class/tutor names onto sessions via a classId -> ClassItem map.
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const upcomingSessions = [...sessions]
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5)
    .map((s) => {
      const cls = classMap.get(s.classId);
      return {
        ...s,
        className: cls?.name ?? "Buổi học",
        tutorName: cls?.tutorName ?? "",
        tutorAvatar: cls?.tutorAvatar ?? "",
        subject: cls?.subject ?? "",
        date: formatSessionDate(s.startAt),
        time: `${formatSessionTime(s.startAt)} - ${formatSessionTime(s.endAt)}`,
      };
    });

  const latestSubmissions = [...submissions]
    .sort((a, b) => b.submissionDate.localeCompare(a.submissionDate))
    .slice(0, 3);

  const stats = [
    {
      label: "Lớp đang học",
      value: activeClasses,
      sub: "Đang hoạt động",
      icon: BookOpen,
      bg: "from-blue-700 to-blue-900",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/student/classes",
    },
    {
      label: "Buổi học sắp tới",
      value: upcomingSessionsCount,
      sub: "Trong lịch học",
      icon: CheckCircle2,
      bg: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      link: "/student/schedule",
    },
    {
      label: "Bài thi đã làm",
      value: examsTaken,
      sub: "Tổng số bài thi",
      icon: Clock,
      bg: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      link: "/student/results",
    },
    {
      label: "Điểm TB",
      value: avgScore.toFixed(1),
      sub: `${examsTaken} bài thi`,
      icon: TrendingUp,
      bg: "from-rose-500 to-pink-500",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      link: "/student/results",
    },
  ];

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải tổng quan...
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-3">
      {/* Pending parent-link requests (consent-based linking) */}
      {requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-4 rounded-xl border border-amber-300/60 bg-amber-50 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-900/20 sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <UserPlus className="h-5 w-5" />
              </div>

              <p className="min-w-0 flex-1 text-sm text-amber-900 dark:text-amber-100">
                <span className="font-semibold">{r.parentName}</span> muốn liên kết với tài khoản
                của bạn để theo dõi và hỗ trợ học tập.
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate(
                      { id: r.id, approve: true },
                      {
                        onSuccess: () => toast.success("Đã chấp nhận liên kết"),
                        onError: () => toast.error("Thao tác thất bại"),
                      }
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" />
                  Chấp nhận
                </button>
                <button
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate(
                      { id: r.id, approve: false },
                      {
                        onSuccess: () => toast.success("Đã từ chối liên kết"),
                        onError: () => toast.error("Thao tác thất bại"),
                      }
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900/30"
                >
                  <X className="h-3.5 w-3.5" />
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero summary */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Tổng quan học tập
            </div>
            <h2 className="mt-3 text-2xl font-bold">
              Chào {profile?.fullName ?? "bạn"}, tiếp tục giữ tiến độ nhé
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Theo dõi điểm thi, lịch học, kết quả thi và ví học phí trong một nơi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              {/* TODO(BE): student GPA/goalGpa not modeled — using avgScore (exam average). */}
              <p className="text-xs text-white/75">Điểm TB</p>
              <p className="mt-1 text-2xl font-bold">{avgScore.toFixed(1)}</p>
              <p className="text-[11px] text-white/70">{examsTaken} bài thi</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/75">Ví học phí</p>
              <p className="mt-1 text-lg font-bold">{walletBalance.toLocaleString("vi-VN")}đ</p>
              <p className="text-[11px] text-white/70">Sẵn sàng thanh toán</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate(s.link)}
            className={cn(
              "group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-left text-white transition-all hover:shadow-lg",
              s.bg
            )}
          >
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.iconBg)}>
              <s.icon className={cn("h-6 w-6", s.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-white/90 transition-colors group-hover:text-white" />
          </button>
        ))}
      </div>

      {/* TODO(BE): weekly study goal not modeled — widget removed (no endpoint). */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Upcoming schedule */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Lịch học sắp tới
              </h3>
              <button
                onClick={() => navigate("/student/schedule")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-3">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : (
                upcomingSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/70"
                  >
                    {s.tutorAvatar ? (
                      <img src={s.tutorAvatar} alt="" className="h-11 w-11 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{s.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.tutorName} • {s.date} • {s.time}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{s.subject}</p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-medium",
                        s.format === "online"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      )}
                    >
                      {s.format === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                ))
              )}

              {!sessionsLoading && upcomingSessions.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Không có buổi học nào sắp tới
                </p>
              )}
            </div>
          </div>

          {/* Progress chart */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Tiến độ điểm số
            </h3>

            {/* TODO(BE): GET /Students/me/progress-series for the GPA/study-hours chart */}
            <div className="flex h-[220px] w-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Chưa có dữ liệu
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <button
            onClick={() => navigate("/student/wallet")}
            className="group w-full rounded-3xl border border-emerald-200/40 bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-left text-white transition-all hover:shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4 text-white/90" />
                Ví học phí
              </h3>
              <ChevronRight className="h-4 w-4 text-white/80 group-hover:text-white" />
            </div>
            <p className="text-2xl font-bold">{walletBalance.toLocaleString("vi-VN")}đ</p>
            <p className="mt-1 text-[10px] text-white/80">
              Tạm giữ: {escrowBalance.toLocaleString("vi-VN")}đ • Nhấn để xem chi tiết
            </p>
          </button>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              Tiến độ lớp học
            </h3>

            <div className="space-y-3">
              {classesLoading ? (
                <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : (
                classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate("/student/classes")}
                    className="group w-full rounded-2xl bg-muted/40 p-3 text-left transition-colors hover:bg-muted/70"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      {c.tutorAvatar ? (
                        <img src={c.tutorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.tutorName}</p>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {c.totalSessions > 0
                          ? Math.round((c.completedSessions / c.totalSessions) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={c.totalSessions > 0 ? (c.completedSessions / c.totalSessions) * 100 : 0}
                      className="h-1.5"
                    />
                  </button>
                ))
              )}

              {!classesLoading && classes.length === 0 && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  Chưa có lớp đang hoạt động
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardCheck className="h-4 w-4 text-amber-600" />
              Kết quả gần nhất
            </h3>

            {submissionsLoading ? (
              <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
              </div>
            ) : (
              latestSubmissions.map((r) => (
                <div key={r.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-muted/40 p-3 last:mb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                    {r.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{r.examTitle}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.correctCount}/{r.totalQuestions} đúng •{" "}
                      {formatSessionDate(r.submissionDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {r.score}/{r.scoreScale}
                  </span>
                </div>
              ))
            )}

            {!submissionsLoading && latestSubmissions.length === 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">Chưa có dữ liệu</p>
            )}

            <button
              onClick={() => navigate("/student/results")}
              className="mt-3 w-full text-xs font-medium text-primary hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Truy cập nhanh</h3>

            {[
              { label: "Tìm gia sư mới", link: "/student/find-tutor", icon: Search },
              { label: "Thi thử THPTQG", link: "/student/mock-exam", icon: ClipboardCheck },
              { label: "Xem báo cáo", link: "/student/report", icon: BarChart3 },
              { label: "Ví học phí", link: "/student/wallet", icon: Wallet },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.link)}
                className="group mb-2 flex w-full items-center gap-3 rounded-2xl bg-muted/40 p-3 text-left transition-colors last:mb-0 hover:bg-muted/70"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-xs font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
