import {
  BookOpen,
  CheckCircle2,
  Star,
  Video,
  MapPin,
  ChevronRight,
  Search,
  X,
  X as XIcon,
  Sparkles,
  CalendarDays,
  AlertTriangle,
  Save,
  Edit2,
  Monitor,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useClasses } from "@/hooks/useClasses";
import {
  useClassSessions,
  useRateSession,
  useApproveAbsence,
  useRejectAbsence,
} from "@/hooks/useSessions";
import { useMySchedule } from "@/hooks/useSchedule";
import {
  useMyStudentAvailability,
  useUpdateMyStudentAvailability,
  useCommonSlots,
  useAiSlots,
} from "@/hooks/useStudents";
import { WeeklyTimetable } from "@/components/schedule/WeeklyTimetable";
import { slotKey, normalizeDay } from "@/lib/scheduleUtils";
import { formatSessionDate, formatSessionClock } from "@/lib/sessionTime";
import SessionStatusBadge from "@/components/schedule/SessionStatusBadge";
import WeeklyCalendarBoard, {
  type CalendarBoardSession,
} from "@/components/schedule/WeeklyCalendarBoard";
import type {
  AvailableSlotDto,
  ClassItem,
  SessionResponse,
  WeeklySlotDto,
} from "@/types/api";

const STUDENT_TUTOR_AVATAR_PLACEHOLDER = "/placeholder.svg";

type ViewSession = SessionResponse & {
  date: string;
  time: string;
  className: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
};

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Build a human-readable schedule string from the class's weekly slots. */
function formatSchedule(slots: WeeklySlotDto[]): string {
  if (!slots || slots.length === 0) return "Chưa có lịch";
  const days = slots
    .map((s) => DAY_LABELS[s.dayOfWeek] ?? `T${s.dayOfWeek}`)
    .join(", ");
  const time = `${(slots[0].startTime ?? "").slice(0, 5)}-${(slots[0].endTime ?? "").slice(0, 5)}`;
  return `${days} • ${time}`;
}

/** Active = active or still searching for a tutor; completed = completed. */
function isActive(status: string): boolean {
  return status === "active" || status === "searching";
}

const StudentClasses = () => {
  const navigate = useNavigate();
  const { classes, isLoading } = useClasses();

  const [ratingModal, setRatingModal] = useState<{ classId: string } | null>(
    null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");

  const rateSession = useRateSession();
  // Sessions for the class whose rating modal is open (used to pick which session to rate).
  const { sessions: modalSessions } = useClassSessions(ratingModal?.classId);
  const completedSessions = modalSessions.filter(
    (s) => s.status === "completed",
  );

  // --- Thời khóa biểu / lịch rảnh (merged in from the former "Lịch học" page) ---
  const { sessions, isLoading: sessionsLoading } = useMySchedule();
  const approveAbsence = useApproveAbsence();
  const rejectAbsence = useRejectAbsence();

  // Smart timetable: free slots + edit + common-slot suggestion with a tutor.
  const { slots: myAvail } = useMyStudentAvailability();
  const updateAvail = useUpdateMyStudentAvailability();
  const [availEdit, setAvailEdit] = useState(false);
  const [availDraft, setAvailDraft] = useState<AvailableSlotDto[]>([]);
  const [suggestTutorId, setSuggestTutorId] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [selectedSession, setSelectedSession] = useState<ViewSession | null>(
    null,
  );
  const [params, setParams] = useSearchParams();

  const tutorOptions = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach((c) => {
      if (c.tutorId) m.set(c.tutorId, c.tutorName);
    });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [classes]);

  const { slots: commonSlots } = useCommonSlots(suggestTutorId || undefined);
  const { slots: aiSlots, isLoading: aiSlotsLoading } = useAiSlots(
    suggestTutorId || undefined,
    sessionsPerWeek,
  );
  // Highlight the AI's chosen sessions on the grid when available; otherwise show the raw overlap.
  const suggested = useMemo(
    () =>
      new Set(
        (aiSlots.length > 0 ? aiSlots : commonSlots).map((s) =>
          slotKey(normalizeDay(s.day), s.time),
        ),
      ),
    [aiSlots, commonSlots],
  );

  const toggleAvailSlot = (day: string, slot: string) =>
    setAvailDraft((prev) => {
      const exists = prev.some(
        (s) => normalizeDay(s.day) === day && s.time === slot,
      );
      return exists
        ? prev.filter((s) => !(normalizeDay(s.day) === day && s.time === slot))
        : [...prev, { day, time: slot }];
    });

  const startEditAvail = () => {
    setAvailDraft(myAvail.map((s) => ({ day: normalizeDay(s.day), time: s.time })));
    setAvailEdit(true);
  };

  const saveAvail = () =>
    updateAvail.mutate(
      { slots: availDraft },
      {
        onSuccess: () => {
          setAvailEdit(false);
          toast.success("Đã cập nhật lịch rảnh!");
        },
        onError: () => toast.error("Không thể cập nhật lịch rảnh"),
      },
    );

  // Per-session class/tutor info is NOT on SessionResponse (only classId); join client-side.
  const classMap = useMemo(() => {
    const m = new Map<string, ClassItem>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  const allSessions: ViewSession[] = useMemo(
    () =>
      sessions
        .map((s) => {
          const cls = classMap.get(s.classId);
          return {
            ...s,
            date: formatSessionDate(s.startAt),
            time: `${formatSessionClock(s.startAt)}-${formatSessionClock(s.endAt)}`,
            className: cls?.name ?? "Lớp học",
            tutorName: cls?.tutorName ?? "—",
            tutorAvatar: cls?.tutorAvatar ?? STUDENT_TUTOR_AVATAR_PLACEHOLDER,
            subject: cls?.subject ?? "",
          };
        })
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [sessions, classMap],
  );

  const boardSessions: CalendarBoardSession[] = useMemo(
    () =>
      allSessions.map((s) => ({
        id: s.id,
        startAt: s.startAt,
        endAt: s.endAt,
        status: s.status,
        title: s.className,
        subtitle: s.tutorName,
        format: s.format,
      })),
    [allSessions],
  );

  const pendingTutorAbsences = useMemo(
    () =>
      allSessions.filter(
        (s) =>
          s.absenceRequestedBy === "tutor" &&
          (s.absenceApproved === null || s.absenceApproved === undefined),
      ),
    [allSessions],
  );

  const confirmAbsence = (sessionId: string) => {
    approveAbsence.mutate(sessionId, {
      onSuccess: () => toast.success("Đã xác nhận báo vắng"),
      onError: () => toast.error("Thao tác thất bại"),
    });
  };

  const rejectAbsenceFn = (sessionId: string) => {
    rejectAbsence.mutate(sessionId, {
      onSuccess: () => toast.success("Đã từ chối cho vắng"),
      onError: () => toast.error("Thao tác thất bại"),
    });
  };

  // Auto-open popup driven by ?absence={sessionId} (notification deep-links).
  const absenceId = params.get("absence");
  const absenceSession = useMemo(
    () => (absenceId ? allSessions.find((s) => s.id === absenceId) ?? null : null),
    [absenceId, allSessions],
  );
  const closeAbsenceDialog = () => setParams({});

  const filtered = classes.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tutorName.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active"
        ? isActive(c.status)
        : c.status === "completed");
    return matchSearch && matchStatus;
  });

  const activeClasses = filtered.filter((c) => isActive(c.status));
  const completedClasses = filtered.filter((c) => c.status === "completed");

  const closeRating = () => {
    setRatingModal(null);
    setSelectedSessionId(null);
    setRatingValue(5);
    setRatingComment("");
  };

  const handleRate = () => {
    if (!selectedSessionId) return;
    rateSession.mutate(
      {
        id: selectedSessionId,
        payload: { rating: ratingValue, comment: ratingComment },
      },
      { onSuccess: closeRating },
    );
  };

  const formatSessionDateTime = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const date = start.toLocaleDateString("vi-VN");
    const time = `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}-${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    return `${date} • ${time}`;
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-3">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Quản lý lớp học
            </div>
            <h2 className="mt-3 text-2xl font-bold">
              Theo dõi toàn bộ lớp học của bạn
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Xem tiến độ, lịch học tiếp theo và đánh giá các buổi học đã hoàn thành.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[320px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/75">Đang học</p>
              <p className="mt-1 text-2xl font-bold">
                {classes.filter((c) => isActive(c.status)).length}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/75">Hoàn thành</p>
              <p className="mt-1 text-2xl font-bold">
                {classes.filter((c) => c.status === "completed").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm lớp học, gia sư, môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl border-border bg-background pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "active", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-medium transition-all",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "all"
                  ? "Tất cả"
                  : s === "active"
                    ? "Đang học"
                    : "Hoàn thành"}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Rating Modal */}
      {ratingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeRating}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Đánh giá buổi học
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chia sẻ cảm nhận của bạn về buổi học này
                </p>
              </div>
              <button
                onClick={closeRating}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pick which completed session to rate */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Chọn buổi học
              </p>
              {completedSessions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  Chưa có buổi học nào đã hoàn thành để đánh giá
                </p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {completedSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-all",
                        selectedSessionId === s.id
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {formatSessionDateTime(s.startAt, s.endAt)}
                      </span>
                      {s.rating != null && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                          {s.rating}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setRatingValue(v)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8",
                      v <= ratingValue
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Nhận xét của bạn..."
              className="mb-5 h-24 w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
            />

            <div className="flex gap-3">
              <Button
                className="flex-1 rounded-2xl"
                onClick={handleRate}
                disabled={!selectedSessionId || rateSession.isPending}
              >
                {rateSession.isPending ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={closeRating}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải lớp học...
        </div>
      ) : (
        <>
          {/* Active Classes */}
          {activeClasses.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Lớp đang học ({activeClasses.length})
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeClasses.map((c: ClassItem) => {
                  const total = c.totalSessions || 0;
                  const done = c.completedSessions || 0;
                  const percent =
                    total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/student/classes/${c.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/student/classes/${c.id}`);
                        }
                      }}
                      className="group cursor-pointer rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="mb-4 flex items-start gap-4">
                        <img
                          src={c.tutorAvatar}
                          alt=""
                          className="h-14 w-14 rounded-2xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-foreground">
                                {c.name}
                              </h4>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {c.tutorName}
                              </p>
                            </div>

                            <Badge className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                              {c.status === "searching"
                                ? "Đang tìm gia sư"
                                : "Đang học"}
                            </Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="gap-1 rounded-full border-border px-2.5 py-1 text-[10px]"
                            >
                              {c.format === "online" ? (
                                <>
                                  <Video className="h-3 w-3" /> Online
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-3 w-3" /> Tại nhà
                                </>
                              )}
                            </Badge>

                            <span className="text-[10px] text-muted-foreground">
                              {c.subject}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              •
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatSchedule(c.weeklySlots)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 rounded-2xl bg-muted/35 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            Tiến độ lớp học
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {done}/{total} buổi
                          </span>
                        </div>
                        <Progress value={percent} className="h-2.5" />
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          Hoàn thành {percent}%
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-2xl text-xs"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingModal({ classId: c.id });
                          }}
                        >
                          <Star className="mr-1 h-3.5 w-3.5" /> Đánh giá buổi
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-2xl text-xs"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/classes/${c.id}`);
                          }}
                        >
                          Chi tiết <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Classes */}
          {completedClasses.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Đã hoàn thành ({completedClasses.length})
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {completedClasses.map((c: ClassItem) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/student/classes/${c.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/student/classes/${c.id}`);
                      }
                    }}
                    className="cursor-pointer rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={c.tutorAvatar}
                        alt=""
                        className="h-12 w-12 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {c.name}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.tutorName} • {c.totalSessions} buổi
                        </p>
                      </div>

                      <Badge className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Hoàn thành
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      className="mt-4 w-full rounded-2xl text-xs"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/classes/${c.id}`);
                      }}
                    >
                      Chi tiết lớp học{" "}
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                <Search className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Không tìm thấy lớp học nào
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thử tìm bằng tên lớp, tên gia sư hoặc môn học
              </p>
            </div>
          )}

          {/* Pending tutor-absence confirmations */}
          {pendingTutorAbsences.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">
                  Gia sư báo vắng cần xác nhận ({pendingTutorAbsences.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pendingTutorAbsences.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/70 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        {s.className}
                      </p>
                      <p className="text-xs text-amber-700">
                        {s.tutorName} • {s.date} • {s.time}
                      </p>
                      {s.absenceReason && (
                        <p className="mt-1 text-xs text-amber-700">
                          Lý do: {s.absenceReason}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl bg-amber-600 text-xs text-white hover:bg-amber-700"
                        disabled={approveAbsence.isPending || rejectAbsence.isPending}
                        onClick={() => confirmAbsence(s.id)}
                      >
                        Xác nhận báo vắng
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-amber-300 text-xs text-amber-800 hover:bg-amber-100"
                        disabled={approveAbsence.isPending || rejectAbsence.isPending}
                        onClick={() => rejectAbsenceFn(s.id)}
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thời khóa biểu — the one real, dated weekly calendar for this student's actual sessions */}
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải buổi học...
            </div>
          ) : (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" /> Thời khóa biểu (
                {allSessions.length})
              </h3>
              <WeeklyCalendarBoard
                sessions={boardSessions}
                onSelect={(s) => {
                  const full = allSessions.find((x) => x.id === s.id);
                  if (full) setSelectedSession(full);
                }}
              />
            </div>
          )}

          {/* Smart timetable: free/busy + edit free slots + suggest common slots with a tutor */}
          <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Lịch rảnh / bận & gợi
                ý giờ học thông minh
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {!availEdit && tutorOptions.length > 0 && (
                  <select
                    value={suggestTutorId}
                    onChange={(e) => setSuggestTutorId(e.target.value)}
                    className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                  >
                    <option value="">Gợi ý giờ chung với gia sư…</option>
                    {tutorOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                {!availEdit && suggestTutorId && (
                  <select
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                    className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                    title="Số buổi học mỗi tuần"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} buổi/tuần
                      </option>
                    ))}
                  </select>
                )}
                {availEdit ? (
                  <>
                    <button
                      onClick={saveAvail}
                      disabled={updateAvail.isPending}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
                    >
                      <Save className="h-3 w-3" /> Lưu
                    </button>
                    <button
                      onClick={() => setAvailEdit(false)}
                      className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <XIcon className="h-3 w-3" /> Hủy
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditAvail}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    <Edit2 className="h-3 w-3" /> Sửa lịch rảnh
                  </button>
                )}
              </div>
            </div>

            <WeeklyTimetable
              availability={availEdit ? availDraft : myAvail}
              sessions={allSessions}
              editMode={availEdit}
              onToggle={toggleAvailSlot}
              suggested={availEdit ? undefined : suggested}
            />

            {!availEdit && suggestTutorId && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs">
                {commonSlots.length > 0 ? (
                  <span className="text-foreground">
                    ★ <span className="font-medium">{commonSlots.length}</span>{" "}
                    khung giờ phù hợp với{" "}
                    {tutorOptions.find((t) => t.id === suggestTutorId)?.name}:{" "}
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      {commonSlots.map((s) => `${s.day} ${s.time}`).join(" · ")}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Chưa có khung giờ chung. Bạn và gia sư cần khai báo lịch rảnh
                    trùng nhau (ô xanh lá).
                  </span>
                )}
              </div>
            )}

            {!availEdit &&
              suggestTutorId &&
              (aiSlotsLoading || aiSlots.length > 0) && (
                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> AI sắp xếp {sessionsPerWeek}{" "}
                    buổi/tuần tối ưu (lịch rảnh của bạn ∩ gia sư)
                  </div>
                  {aiSlotsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang phân
                      tích…
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {aiSlots.map((s, i) => (
                        <div
                          key={`${s.day}-${s.time}-${i}`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground">
                              {s.day} · {s.time}
                            </span>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {s.reason}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[11px]"
                          >
                            {s.score}đ
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>
        </>
      )}

      {/* Session Detail Dialog */}
      <Dialog
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <DialogContent className="max-w-md">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedSession.className}
                  <SessionStatusBadge status={selectedSession.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="block text-xs text-muted-foreground">
                      Ngày
                    </span>
                    <span className="font-medium">{selectedSession.date}</span>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="block text-xs text-muted-foreground">
                      Giờ
                    </span>
                    <span className="font-medium">{selectedSession.time}</span>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="block text-xs text-muted-foreground">
                      Gia sư
                    </span>
                    <span className="font-medium">
                      {selectedSession.tutorName}
                    </span>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="block text-xs text-muted-foreground">
                      Môn học
                    </span>
                    <span className="font-medium">
                      {selectedSession.subject || "—"}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="block text-xs text-muted-foreground">
                    Hình thức
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    {selectedSession.format === "online" ? (
                      <>
                        <Monitor className="h-3 w-3 text-primary" /> Online
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3" /> Offline
                      </>
                    )}
                  </span>
                </div>
                {selectedSession.content && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Nội dung
                    </span>
                    <p className="text-sm">{selectedSession.content}</p>
                  </div>
                )}
                {selectedSession.notes && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Nhận xét
                    </span>
                    <p className="text-sm">{selectedSession.notes}</p>
                  </div>
                )}
                {selectedSession.homework && (
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                    <span className="mb-1 block text-xs text-muted-foreground">
                      BTVN
                    </span>
                    <p className="text-sm font-medium">
                      {selectedSession.homework}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Auto-opening absence review popup (?absence={sessionId}) */}
      <Dialog
        open={!!absenceSession}
        onOpenChange={(open) => {
          if (!open) closeAbsenceDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Yêu cầu báo vắng từ gia sư
            </DialogTitle>
            <DialogDescription>
              Gia sư đã gửi yêu cầu báo vắng cho buổi học này. Vui lòng xem chi
              tiết và phản hồi.
            </DialogDescription>
          </DialogHeader>
          {absenceSession && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <p className="text-xs text-amber-700">Lớp học</p>
                <p className="text-sm font-semibold text-amber-900">
                  {absenceSession.className}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Gia sư</p>
                <p className="text-sm font-medium text-amber-900">
                  {absenceSession.tutorName}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Thời gian</p>
                <p className="text-sm font-medium text-amber-900">
                  {absenceSession.date} • {absenceSession.time}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Lý do</p>
                <p className="text-sm text-amber-900">
                  {absenceSession.absenceReason || "Không có lý do cụ thể"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-amber-300 text-xs text-amber-800 hover:bg-amber-100"
              disabled={approveAbsence.isPending || rejectAbsence.isPending}
              onClick={() => {
                if (!absenceSession) return;
                rejectAbsence.mutate(absenceSession.id, {
                  onSuccess: () => {
                    toast.success("Đã từ chối cho vắng");
                    closeAbsenceDialog();
                  },
                  onError: () => toast.error("Thao tác thất bại"),
                });
              }}
            >
              Từ chối
            </Button>
            <Button
              className="rounded-xl bg-amber-600 text-xs text-white hover:bg-amber-700"
              disabled={approveAbsence.isPending || rejectAbsence.isPending}
              onClick={() => {
                if (!absenceSession) return;
                approveAbsence.mutate(absenceSession.id, {
                  onSuccess: () => {
                    toast.success("Đã xác nhận báo vắng");
                    closeAbsenceDialog();
                  },
                  onError: () => toast.error("Thao tác thất bại"),
                });
              }}
            >
              Cho phép vắng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentClasses;
