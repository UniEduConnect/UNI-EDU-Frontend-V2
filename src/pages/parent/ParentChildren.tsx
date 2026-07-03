import {
  Users,
  BookOpen,
  CheckCircle2,
  CalendarDays,
  ClipboardList,
  Clock,
  GraduationCap,
  UserPlus,
  X as XIcon,
  Star,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useParentChildren,
  useLinkChild,
  useChildExams,
  useFundChild,
} from "@/hooks/useParentChildren";
import { useClasses } from "@/hooks/useClasses";
import { useMySchedule } from "@/hooks/useSchedule";
import { useConfirmSession, useApproveAbsence, useRejectAbsence } from "@/hooks/useSessions";
import { useSearchParams } from "react-router-dom";
import type { ClassItem, SessionResponse } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatSessionClock } from "@/lib/sessionTime";
import SessionStatusBadge from "@/components/schedule/SessionStatusBadge";
import WeeklyCalendarBoard, { type CalendarBoardSession } from "@/components/schedule/WeeklyCalendarBoard";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// "HH:mm:ss" -> "HH:mm"
const hm = (t: string) => (t ? t.slice(0, 5) : t);

const slotsLabel = (slots: ClassItem["weeklySlots"]) =>
  (slots ?? [])
    .map(s => `${DAY_LABELS[s.dayOfWeek] ?? `?${s.dayOfWeek}`} ${hm(s.startTime)}-${hm(s.endTime)}`)
    .join(" • ");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });

const ParentChildren = () => {
  const { children, isLoading, isError } = useParentChildren();
  const { classes, isLoading: classesLoading } = useClasses();
  const { sessions, isLoading: sessionsLoading } = useMySchedule();
  const confirmSession = useConfirmSession();
  const approveAbsence = useApproveAbsence();
  const rejectAbsence = useRejectAbsence();
  const linkChild = useLinkChild();
  const [params, setParams] = useSearchParams();
  const absenceId = params.get("absence");
  const fundChild = useFundChild();
  const [selectedChild, setSelectedChild] = useState("");
  const [tab, setTab] = useState<"overview" | "schedule" | "tests" | "attendance">("overview");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [selectedSession, setSelectedSession] = useState<ViewSession | null>(null);

  // Exam submissions for the currently-selected child (only fetched when a child is selected).
  const { submissions: childExams, isLoading: examsLoading } = useChildExams(selectedChild || undefined);

  const handleLinkChild = () => {
    const email = linkEmail.trim();
    if (!email) {
      toast.error("Vui lòng nhập email tài khoản học sinh của con.");
      return;
    }
    linkChild.mutate(email, {
      onSuccess: () => {
        toast.success("Đã gửi yêu cầu liên kết. Vui lòng chờ con xác nhận.");
        setLinkOpen(false);
        setLinkEmail("");
      },
      onError: e => toast.error(e instanceof Error ? e.message : "Gửi yêu cầu thất bại"),
    });
  };

  const FUND_QUICK_AMOUNTS = [200000, 500000, 1000000, 2000000];

  const handleFundChild = (childId: string) => {
    const amount = Number(fundAmount);
    if (!childId) {
      toast.error("Không xác định được con để nạp tiền.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (lớn hơn 0).");
      return;
    }
    fundChild.mutate(
      { childId, amount },
      {
        onSuccess: () => {
          toast.success("Đã nạp tiền cho con thành công.");
          setFundOpen(false);
          setFundAmount("");
        },
        onError: e =>
          toast.error(
            e instanceof Error ? e.message : "Nạp tiền thất bại (kiểm tra số dư ví của bạn)."
          ),
      }
    );
  };

  // Reusable "connect child" button + dialog, shown both in the empty state and
  // the populated page header so a parent can always add another child.
  const linkChildUI = (
    <>
      <button
        type="button"
        onClick={() => setLinkOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <UserPlus className="h-4 w-4" />
        Kết nối con
      </button>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kết nối con</DialogTitle>
            <DialogDescription>
              Nhập email tài khoản học sinh của con. Con bạn sẽ nhận thông báo để xác nhận liên kết.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={linkEmail}
              onChange={e => setLinkEmail(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleLinkChild();
              }}
              className="rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleLinkChild}
              disabled={linkChild.isPending || linkEmail.trim().length === 0}
              className="rounded-xl"
            >
              {linkChild.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Keep the selected child valid as the list loads.
  useEffect(() => {
    if (children.length > 0 && !children.some(c => c.id === selectedChild)) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const child = children.find(c => c.id === selectedChild);

  // classId -> ClassItem, so sessions (which only carry classId) can be joined.
  const classMap = useMemo(() => {
    const m = new Map<string, ClassItem>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  // studentId -> their classes.
  const classesByChild = useMemo(() => {
    const m = new Map<string, ClassItem[]>();
    for (const c of classes) {
      const arr = m.get(c.studentId) ?? [];
      arr.push(c);
      m.set(c.studentId, arr);
    }
    return m;
  }, [classes]);

  const childClasses = selectedChild ? classesByChild.get(selectedChild) ?? [] : [];
  const childClassIds = useMemo(() => new Set(childClasses.map(c => c.id)), [childClasses]);

  // Sessions belonging to the selected child's classes, enriched with class info.
  type ViewSession = SessionResponse & {
    time: string;
    className: string;
    tutorName: string;
    subject: string;
  };

  const childSessions: ViewSession[] = useMemo(
    () =>
      sessions
        .filter(s => childClassIds.has(s.classId))
        .map(s => {
          const cls = classMap.get(s.classId);
          return {
            ...s,
            time: `${formatSessionClock(s.startAt)}-${formatSessionClock(s.endAt)}`,
            className: cls?.name ?? "Lớp học",
            tutorName: cls?.tutorName ?? "—",
            subject: cls?.subject ?? "",
          };
        })
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [sessions, childClassIds, classMap]
  );

  const childBoardSessions: CalendarBoardSession[] = useMemo(
    () =>
      childSessions.map(s => ({
        id: s.id,
        startAt: s.startAt,
        endAt: s.endAt,
        status: s.status,
        title: s.className,
        subtitle: s.tutorName,
        format: s.format,
      })),
    [childSessions]
  );

  const upcomingSessions = childSessions.filter(s => s.status === "scheduled" || s.status === "in_progress");
  const completedSessions = childSessions.filter(s => s.status === "completed");
  const missedSessions = childSessions.filter(s => s.status === "missed");
  const pendingSessions = childSessions.filter(s => s.status === "pending_confirm" || s.status === "scheduled");
  const homeworkSessions = childSessions.filter(s => s.homework && s.homework.trim().length > 0);

  // Tutor-reported absences awaiting this parent's confirmation.
  const pendingAbsences = childSessions.filter(
    s =>
      s.absenceRequestedBy === "tutor" &&
      (s.absenceApproved === null || s.absenceApproved === undefined)
  );

  // ---- Header stats (aggregated across all linked children) ----
  const allChildClassIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of children) {
      for (const cls of classesByChild.get(c.id) ?? []) ids.add(cls.id);
    }
    return ids;
  }, [children, classesByChild]);

  const allChildSessions = useMemo(
    () => sessions.filter(s => allChildClassIds.has(s.classId)),
    [sessions, allChildClassIds]
  );
  const totalCompleted = allChildSessions.filter(s => s.status === "completed").length;
  const totalMissed = allChildSessions.filter(s => s.status === "missed").length;
  const totalPending = allChildSessions.filter(s => s.status === "pending_confirm").length;
  const avgAttendance =
    totalCompleted + totalMissed > 0
      ? Math.round((totalCompleted / (totalCompleted + totalMissed)) * 100)
      : null;

  const handleConfirmAttendance = (sessionId: string) => {
    confirmSession.mutate(sessionId, {
      onSuccess: () => toast.success("Đã xác nhận buổi học."),
      onError: e => toast.error(e instanceof Error ? e.message : "Xác nhận thất bại"),
    });
  };

  const handleApproveAbsence = (sessionId: string) => {
    approveAbsence.mutate(sessionId, {
      onSuccess: () => toast.success("Đã xác nhận báo vắng"),
      onError: () => toast.error("Thao tác thất bại"),
    });
  };

  const handleRejectAbsence = (sessionId: string) => {
    rejectAbsence.mutate(sessionId, {
      onSuccess: () => toast.success("Đã từ chối cho vắng"),
      onError: () => toast.error("Thao tác thất bại"),
    });
  };

  // Session targeted by the ?absence=<sessionId> deep link (from the absence
  // notification). Searches across ALL children's sessions (not just the selected
  // child) so the popup opens regardless of the current selection. Only surfaces
  // while it's still a pending tutor request.
  const absenceSession = useMemo(() => {
    if (!absenceId) return undefined;
    const s = sessions.find(
      x =>
        x.id === absenceId &&
        x.absenceRequestedBy === "tutor" &&
        (x.absenceApproved === null || x.absenceApproved === undefined)
    );
    if (!s) return undefined;
    const cls = classMap.get(s.classId);
    return {
      ...s,
      time: `${formatSessionClock(s.startAt)}-${formatSessionClock(s.endAt)}`,
      className: cls?.name ?? "Lớp học",
      tutorName: cls?.tutorName ?? "—",
      subject: cls?.subject ?? "",
    };
  }, [absenceId, sessions, classMap]);

  const closeAbsenceDialog = () => {
    const next = new URLSearchParams(params);
    next.delete("absence");
    setParams(next);
  };

  const handleApproveAbsenceFromDialog = (sessionId: string) => {
    approveAbsence.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Đã xác nhận báo vắng");
        closeAbsenceDialog();
      },
      onError: () => toast.error("Thao tác thất bại"),
    });
  };

  const handleRejectAbsenceFromDialog = (sessionId: string) => {
    rejectAbsence.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Đã từ chối cho vắng");
        closeAbsenceDialog();
      },
      onError: () => toast.error("Thao tác thất bại"),
    });
  };

  const absenceMutating = approveAbsence.isPending || rejectAbsence.isPending;

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: Users },
    { key: "schedule", label: "Lịch học", icon: CalendarDays },
    { key: "tests", label: "Bài kiểm tra", icon: ClipboardList },
    { key: "attendance", label: "Điểm danh", icon: CheckCircle2 },
  ] as const;

  const noData = (text = "Chưa có dữ liệu") => (
    <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
  );

  const perChildLoading = classesLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải danh sách con em...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-20 text-center text-muted-foreground">
        Không tải được danh sách con em. Vui lòng thử lại.
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-20 text-center text-muted-foreground">
        <p>Chưa có con em nào được liên kết.</p>
        {linkChildUI}
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Con em của tôi</h2>
          <p className="text-xs text-muted-foreground">Theo dõi tiến độ học tập của các con</p>
        </div>
        {linkChildUI}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Số con",
            value: children.length,
            sub: "Đã liên kết",
            color: "from-blue-500 to-indigo-500",
            icon: Users,
          },
          {
            label: "Chuyên cần TB",
            value: avgAttendance === null ? "—" : `${avgAttendance}%`,
            sub: avgAttendance === null ? "Chưa có buổi học" : `${totalCompleted}/${totalCompleted + totalMissed} buổi`,
            color: "from-amber-500 to-orange-500",
            icon: CheckCircle2,
          },
          {
            label: "Buổi hoàn thành",
            value: totalCompleted,
            sub: `${allChildClassIds.size} lớp đang theo`,
            color: "from-emerald-500 to-teal-500",
            icon: BookOpen,
          },
          {
            label: "Chờ xác nhận",
            value: totalPending,
            sub: "Điểm danh",
            color: "from-rose-500 to-pink-500",
            icon: Clock,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={cn(
              "group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white transition-all hover:shadow-lg",
              s.color
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CHILD SELECTOR */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Chọn con em</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Xem chi tiết tiến độ học tập theo từng học sinh
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedChild(c.id);
                setTab("overview");
              }}
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                selectedChild === c.id
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border bg-muted/30 hover:bg-muted/60"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  Lớp {c.grade} • {c.school}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="flex w-fit gap-1 rounded-2xl bg-muted p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW — child's classes with progress + recent homework/ratings */}
      {tab === "overview" && child && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted shrink-0">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold">{child.fullName}</p>
              <p className="text-sm text-muted-foreground">
                Lớp {child.grade} • {child.school}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setFundAmount("");
                setFundOpen(true);
              }}
              className="rounded-xl shrink-0"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Nạp tiền cho con
            </Button>
          </div>

          {perChildLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải lớp học...
            </div>
          ) : childClasses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chưa có lớp học nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {childClasses.map(c => {
                const pct =
                  c.totalSessions > 0
                    ? Math.round((c.completedSessions / c.totalSessions) * 100)
                    : 0;
                return (
                  <div key={c.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.subject} • GV {c.tutorName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {slotsLabel(c.weeklySlots) || "Chưa có lịch cố định"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Tiến độ</span>
                        <span>
                          {c.completedSessions}/{c.totalSessions} buổi ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE — real, dated weekly calendar of the child's sessions (all statuses) */}
      {tab === "schedule" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            Thời khóa biểu - {child?.fullName}
          </h3>
          {perChildLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải lịch học...
            </div>
          ) : (
            <WeeklyCalendarBoard
              sessions={childBoardSessions}
              onSelect={s => {
                const full = childSessions.find(x => x.id === s.id);
                if (full) setSelectedSession(full);
              }}
              emptyMessage="Không có buổi học nào trong tuần này"
            />
          )}
        </div>
      )}

      {/* TESTS — exam submissions for the child */}
      {tab === "tests" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-primary" />
            Bài kiểm tra - {child?.fullName}
          </h3>
          {examsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải kết quả...
            </div>
          ) : childExams.length === 0 ? (
            noData("Chưa có bài kiểm tra")
          ) : (
            <div className="space-y-2">
              {childExams.map(sub => (
                <div key={sub.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sub.examTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Đúng {sub.correctCount}/{sub.totalQuestions} câu • {fmtDate(sub.submissionDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">
                      {sub.score}
                      <span className="text-xs font-normal text-muted-foreground">/{sub.scoreScale}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE — pending confirmations + completed/missed history + homework */}
      {tab === "attendance" && (
        <div className="space-y-4">
          {/* TUTOR-REPORTED ABSENCES awaiting the parent's confirmation */}
          {!perChildLoading && pendingAbsences.length > 0 && (
            <div className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-6 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Gia sư báo vắng - cần xác nhận
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Gia sư đã báo con bạn vắng các buổi sau. Vui lòng xác nhận để cập nhật điểm danh.
              </p>
              <div className="space-y-2">
                {pendingAbsences.map(s => (
                  <div
                    key={s.id}
                    className="flex items-start gap-4 rounded-xl border border-amber-500/30 bg-card p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.className}{s.subject ? ` • ${s.subject}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.tutorName} • {fmtDate(s.startAt)} • {s.time}
                      </p>
                      {s.absenceReason && (
                        <p className="mt-1 text-xs text-amber-700">
                          Lý do: {s.absenceReason}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                        disabled={absenceMutating}
                        onClick={() => handleApproveAbsence(s.id)}
                      >
                        {approveAbsence.isPending && approveAbsence.variables === s.id && (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        )}
                        Xác nhận báo vắng
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={absenceMutating}
                        onClick={() => handleRejectAbsence(s.id)}
                      >
                        {rejectAbsence.isPending && rejectAbsence.variables === s.id && (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        )}
                        Từ chối
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              Chờ xác nhận - {child?.fullName}
            </h3>
            {perChildLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
              </div>
            ) : pendingSessions.length === 0 ? (
              noData("Không có buổi nào cần xác nhận")
            ) : (
              <div className="space-y-2">
                {pendingSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.tutorName} • {fmtDate(s.startAt)} • {s.time}
                      </p>
                    </div>
                    <SessionStatusBadge status={s.status} />
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={confirmSession.isPending}
                      onClick={() => handleConfirmAttendance(s.id)}
                    >
                      {confirmSession.isPending && confirmSession.variables === s.id && (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      )}
                      Xác nhận
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance summary + history */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Lịch sử điểm danh - {child?.fullName}</h3>
            {perChildLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
              </div>
            ) : completedSessions.length + missedSessions.length === 0 ? (
              noData("Chưa có buổi học nào diễn ra")
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Đã hoàn thành</p>
                      <p className="text-base font-bold">{completedSessions.length} buổi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <XIcon className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Vắng mặt</p>
                      <p className="text-base font-bold">{missedSessions.length} buổi</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[...completedSessions, ...missedSessions]
                    .sort((a, b) => b.startAt.localeCompare(a.startAt))
                    .slice(0, 15)
                    .map(s => (
                      <div key={s.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {s.className}{s.content ? ` - ${s.content}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.tutorName} • {fmtDate(s.startAt)} • {s.time}
                          </p>
                        </div>
                        {s.rating ? (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[...Array(s.rating)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-current text-amber-500" />
                            ))}
                          </div>
                        ) : null}
                        <SessionStatusBadge status={s.status} />
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Homework assigned across the child's sessions */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-primary" />
              Bài tập về nhà - {child?.fullName}
            </h3>
            {perChildLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
              </div>
            ) : homeworkSessions.length === 0 ? (
              noData("Chưa có bài tập về nhà")
            ) : (
              <div className="space-y-2">
                {homeworkSessions
                  .sort((a, b) => b.startAt.localeCompare(a.startAt))
                  .slice(0, 15)
                  .map(s => (
                    <div key={s.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{s.className}</p>
                        <p className="text-xs text-muted-foreground shrink-0">{fmtDate(s.startAt)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{s.homework}</p>
                      {s.homeworkFiles && s.homeworkFiles.length > 0 && (
                        <p className="mt-1 text-[11px] text-primary">
                          {s.homeworkFiles.length} tệp đính kèm
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REMAINING GAP — rich analytics (skills radar, GPA trend chart) not yet available from BE */}
      {tab === "overview" && child && (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Phân tích kỹ năng & biểu đồ điểm GPA theo thời gian: Chưa có dữ liệu
          </p>
        </div>
      )}

      {/* SESSION DETAIL — read-only, opened by clicking a session on the schedule calendar */}
      <Dialog open={!!selectedSession} onOpenChange={open => !open && setSelectedSession(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedSession.className}
                  <SessionStatusBadge status={selectedSession.status} />
                </DialogTitle>
                <DialogDescription>
                  {selectedSession.subject ? selectedSession.subject : "Chi tiết buổi học"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Gia sư</span>
                    <span className="font-medium">{selectedSession.tutorName}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Môn học</span>
                    <span className="font-medium">{selectedSession.subject || "—"}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Ngày</span>
                    <span className="font-medium">{fmtDate(selectedSession.startAt)}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Giờ</span>
                    <span className="font-medium">{selectedSession.time}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl col-span-2">
                    <span className="text-xs text-muted-foreground block">Hình thức</span>
                    <span className="font-medium">
                      {selectedSession.format === "online"
                        ? "Online"
                        : selectedSession.format === "offline"
                          ? "Offline"
                          : selectedSession.format || "—"}
                    </span>
                  </div>
                </div>
                {selectedSession.content && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block mb-1">Nội dung</span>
                    <p className="text-sm">{selectedSession.content}</p>
                  </div>
                )}
                {selectedSession.notes && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block mb-1">Nhận xét</span>
                    <p className="text-sm">{selectedSession.notes}</p>
                  </div>
                )}
                {selectedSession.homework && (
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="text-xs text-muted-foreground block mb-1">BTVN</span>
                    <p className="text-sm font-medium">{selectedSession.homework}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ABSENCE REQUEST — auto-opens from the ?absence=<sessionId> notification deep link */}
      <Dialog
        open={!!absenceSession}
        onOpenChange={open => {
          if (!open) closeAbsenceDialog();
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yêu cầu báo vắng từ gia sư</DialogTitle>
            <DialogDescription>
              Gia sư đã báo con bạn vắng buổi học dưới đây. Vui lòng quyết định cho phép hoặc từ chối.
            </DialogDescription>
          </DialogHeader>

          {absenceSession && (
            <div className="space-y-3 py-2">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-sm font-semibold">
                  {absenceSession.className}
                  {absenceSession.subject ? ` • ${absenceSession.subject}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {absenceSession.tutorName} • {fmtDate(absenceSession.startAt)} • {absenceSession.time}
                </p>
                <div className="mt-3 rounded-lg bg-card p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Lý do gia sư báo vắng</p>
                  <p className="mt-0.5 text-sm text-amber-700">
                    {absenceSession.absenceReason?.trim() || "Gia sư không cung cấp lý do."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {absenceSession && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={absenceMutating}
                  onClick={() => handleRejectAbsenceFromDialog(absenceSession.id)}
                >
                  {rejectAbsence.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Từ chối
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                  disabled={absenceMutating}
                  onClick={() => handleApproveAbsenceFromDialog(absenceSession.id)}
                >
                  {approveAbsence.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cho phép vắng
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FUND CHILD WALLET — top up the selected child's wallet from the parent's wallet */}
      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nạp tiền cho con{child ? ` - ${child.fullName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Nạp tiền từ ví của bạn vào ví của con để đóng học phí/đặt lớp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Số tiền (VND)"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && child) handleFundChild(child.id);
              }}
              className="rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {FUND_QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFundAmount(String(amt))}
                  className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {amt.toLocaleString("vi-VN")}đ
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => child && handleFundChild(child.id)}
              disabled={
                fundChild.isPending ||
                !child ||
                !(Number(fundAmount) > 0)
              }
              className="rounded-xl"
            >
              {fundChild.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Nạp tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentChildren;
