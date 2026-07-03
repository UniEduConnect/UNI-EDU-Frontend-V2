import { CalendarDays, Clock, CheckCircle2, X as XIcon, Star, Loader2, AlertTriangle, Save, Edit2, Sparkles, Monitor, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMySchedule } from "@/hooks/useSchedule";
import { useClasses } from "@/hooks/useClasses";
import { useApproveAbsence, useRejectAbsence } from "@/hooks/useSessions";
import { useMyStudentAvailability, useUpdateMyStudentAvailability, useCommonSlots, useAiSlots } from "@/hooks/useStudents";
import { WeeklyTimetable } from "@/components/schedule/WeeklyTimetable";
import { slotKey, normalizeDay } from "@/lib/scheduleUtils";
import { formatSessionDate, formatSessionClock, vietnamToday } from "@/lib/sessionTime";
import SessionStatusBadge from "@/components/schedule/SessionStatusBadge";
import WeeklyCalendarBoard, { type CalendarBoardSession } from "@/components/schedule/WeeklyCalendarBoard";
import type { AvailableSlotDto, ClassItem, SessionResponse } from "@/types/api";

const STUDENT_TUTOR_AVATAR_PLACEHOLDER = "/placeholder.svg";

const getWeekRange = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

const formatWeekLabel = (monday: Date, sunday: Date) => {
  const fmt = (d: Date) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${fmt(monday)} - ${fmt(sunday)}/${sunday.getFullYear()}`;
};

const StudentSchedule = () => {
  useAuth(); // logged-in identity is resolved server-side for /me/sessions
  const { sessions, isLoading } = useMySchedule();
  const { classes } = useClasses();
  const approveAbsence = useApproveAbsence();
  const rejectAbsence = useRejectAbsence();

  // --- Smart timetable: free slots + edit + common-slot suggestion with a tutor ---
  const { slots: myAvail } = useMyStudentAvailability();
  const updateAvail = useUpdateMyStudentAvailability();
  const [availEdit, setAvailEdit] = useState(false);
  const [availDraft, setAvailDraft] = useState<AvailableSlotDto[]>([]);
  const [suggestTutorId, setSuggestTutorId] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);

  const tutorOptions = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach(c => { if (c.tutorId) m.set(c.tutorId, c.tutorName); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [classes]);

  const { slots: commonSlots } = useCommonSlots(suggestTutorId || undefined);
  const { slots: aiSlots, isLoading: aiSlotsLoading } = useAiSlots(suggestTutorId || undefined, sessionsPerWeek);
  // Highlight the AI's chosen sessions on the grid when available; otherwise show the raw overlap.
  const suggested = useMemo(
    () => new Set((aiSlots.length > 0 ? aiSlots : commonSlots).map(s => slotKey(normalizeDay(s.day), s.time))),
    [aiSlots, commonSlots]
  );

  const toggleAvailSlot = (day: string, slot: string) =>
    setAvailDraft(prev => {
      const exists = prev.some(s => normalizeDay(s.day) === day && s.time === slot);
      return exists
        ? prev.filter(s => !(normalizeDay(s.day) === day && s.time === slot))
        : [...prev, { day, time: slot }];
    });

  const startEditAvail = () => {
    setAvailDraft(myAvail.map(s => ({ day: normalizeDay(s.day), time: s.time })));
    setAvailEdit(true);
  };

  const saveAvail = () =>
    updateAvail.mutate(
      { slots: availDraft },
      {
        onSuccess: () => { setAvailEdit(false); toast.success("Đã cập nhật lịch rảnh!"); },
        onError: () => toast.error("Không thể cập nhật lịch rảnh"),
      }
    );
  const [params, setParams] = useSearchParams();
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeek = useMemo(() => {
    const now = vietnamToday();
    now.setDate(now.getDate() + weekOffset * 7);
    return getWeekRange(now);
  }, [weekOffset]);

  // Per-session class/tutor info is NOT on SessionResponse (only classId); join client-side.
  // TODO(BE): include className/tutorName/subject on GET /me/sessions to avoid a client-side join
  const classMap = useMemo(() => {
    const m = new Map<string, ClassItem>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  type ViewSession = SessionResponse & {
    date: string;
    time: string;
    className: string;
    tutorName: string;
    tutorAvatar: string;
    subject: string;
  };

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
    [sessions, classMap]
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
    [allSessions]
  );

  const [selectedSession, setSelectedSession] = useState<ViewSession | null>(null);

  const weekSessions = useMemo(() => {
    return allSessions.filter(s => {
      const d = new Date(s.date);
      return d >= currentWeek.monday && d <= currentWeek.sunday;
    });
  }, [allSessions, currentWeek]);

  const pendingTutorAbsences = useMemo(
    () =>
      allSessions.filter(
        s => s.absenceRequestedBy === "tutor" && (s.absenceApproved === null || s.absenceApproved === undefined)
      ),
    [allSessions]
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

  // Auto-open popup driven by ?absence={sessionId}
  const absenceId = params.get("absence");
  const absenceSession = useMemo(
    () => (absenceId ? allSessions.find(s => s.id === absenceId) ?? null : null),
    [absenceId, allSessions]
  );
  const closeAbsenceDialog = () => setParams({});

  const completed = allSessions.filter(s => s.status === "completed");
  const missed = allSessions.filter(s => s.status === "missed");
  const totalWeekSessions = weekSessions.filter(s => s.status === "scheduled" || s.status === "in_progress").length;
  const totalWeekHours = weekSessions.length * 2;
  const attendanceRate = completed.length + missed.length > 0 ? Math.round((completed.length / (completed.length + missed.length)) * 100) : 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lịch học...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Buổi sắp tới</p>
            <p className="text-xl font-bold text-foreground">{totalWeekSessions}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Clock className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng giờ sắp tới</p>
            <p className="text-xl font-bold text-foreground">{totalWeekHours}h</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
            <p className="text-xl font-bold text-foreground">{completed.length} buổi</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <XIcon className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vắng mặt</p>
            <p className="text-xl font-bold text-foreground">{missed.length} buổi</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Star className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tỷ lệ chuyên cần</p>
            <p className="text-xl font-bold text-foreground">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Smart timetable: free/busy + edit free slots + suggest common slots with a tutor */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Lịch rảnh / bận & gợi ý giờ học thông minh
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {!availEdit && tutorOptions.length > 0 && (
              <select
                value={suggestTutorId}
                onChange={e => setSuggestTutorId(e.target.value)}
                className="text-xs rounded-lg border border-border bg-card px-2 py-1.5"
              >
                <option value="">Gợi ý giờ chung với gia sư…</option>
                {tutorOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            {!availEdit && suggestTutorId && (
              <select
                value={sessionsPerWeek}
                onChange={e => setSessionsPerWeek(Number(e.target.value))}
                className="text-xs rounded-lg border border-border bg-card px-2 py-1.5"
                title="Số buổi học mỗi tuần"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} buổi/tuần</option>)}
              </select>
            )}
            {availEdit ? (
              <>
                <button onClick={saveAvail} disabled={updateAvail.isPending} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-60"><Save className="w-3 h-3" /> Lưu</button>
                <button onClick={() => setAvailEdit(false)} className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium"><XIcon className="w-3 h-3" /> Hủy</button>
              </>
            ) : (
              <button onClick={startEditAvail} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium"><Edit2 className="w-3 h-3" /> Sửa lịch rảnh</button>
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
          <div className="text-xs rounded-lg bg-muted/40 p-3">
            {commonSlots.length > 0 ? (
              <span className="text-foreground">
                ★ <span className="font-medium">{commonSlots.length}</span> khung giờ phù hợp với{" "}
                {tutorOptions.find(t => t.id === suggestTutorId)?.name}:{" "}
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {commonSlots.map(s => `${s.day} ${s.time}`).join(" · ")}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Chưa có khung giờ chung. Bạn và gia sư cần khai báo lịch rảnh trùng nhau (ô xanh lá).
              </span>
            )}
          </div>
        )}

        {!availEdit && suggestTutorId && (aiSlotsLoading || aiSlots.length > 0) && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> AI sắp xếp {sessionsPerWeek} buổi/tuần tối ưu (lịch rảnh của bạn ∩ gia sư)
            </div>
            {aiSlotsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang phân tích…</div>
            ) : (
              <div className="space-y-1.5">
                {aiSlots.map((s, i) => (
                  <div key={`${s.day}-${s.time}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-3 py-2">
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground">{s.day} · {s.time}</span>
                      <p className="text-[11px] text-muted-foreground truncate">{s.reason}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[11px]">{s.score}đ</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending tutor-absence confirmations */}
      {pendingTutorAbsences.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">
              Gia sư báo vắng cần xác nhận ({pendingTutorAbsences.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingTutorAbsences.map(s => (
              <div
                key={s.id}
                className="bg-white/70 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">{s.className}</p>
                  <p className="text-xs text-amber-700">{s.tutorName} • {s.date} • {s.time}</p>
                  {s.absenceReason && (
                    <p className="text-xs text-amber-700 mt-1">Lý do: {s.absenceReason}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={approveAbsence.isPending || rejectAbsence.isPending}
                    onClick={() => confirmAbsence(s.id)}
                  >
                    Xác nhận báo vắng
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
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
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" /> Thời khóa biểu ({allSessions.length})
        </h3>
        <WeeklyCalendarBoard
          sessions={boardSessions}
          onSelect={(s) => {
            const full = allSessions.find((x) => x.id === s.id);
            if (full) setSelectedSession(full);
          }}
        />
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
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
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Ngày</span>
                    <span className="font-medium">{selectedSession.date}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Giờ</span>
                    <span className="font-medium">{selectedSession.time}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Gia sư</span>
                    <span className="font-medium">{selectedSession.tutorName}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Môn học</span>
                    <span className="font-medium">{selectedSession.subject || "—"}</span>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <span className="text-xs text-muted-foreground block">Hình thức</span>
                  <span className="font-medium flex items-center gap-1">
                    {selectedSession.format === "online" ? (
                      <>
                        <Monitor className="w-3 h-3 text-primary" /> Online
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3" /> Offline
                      </>
                    )}
                  </span>
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

      {/* Auto-opening absence review popup (?absence={sessionId}) */}
      <Dialog open={!!absenceSession} onOpenChange={(open) => { if (!open) closeAbsenceDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Yêu cầu báo vắng từ gia sư
            </DialogTitle>
            <DialogDescription>
              Gia sư đã gửi yêu cầu báo vắng cho buổi học này. Vui lòng xem chi tiết và phản hồi.
            </DialogDescription>
          </DialogHeader>
          {absenceSession && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <p className="text-xs text-amber-700">Lớp học</p>
                <p className="text-sm font-semibold text-amber-900">{absenceSession.className}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Gia sư</p>
                <p className="text-sm font-medium text-amber-900">{absenceSession.tutorName}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Thời gian</p>
                <p className="text-sm font-medium text-amber-900">{absenceSession.date} • {absenceSession.time}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Lý do</p>
                <p className="text-sm text-amber-900">{absenceSession.absenceReason || "Không có lý do cụ thể"}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="rounded-xl text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
              disabled={approveAbsence.isPending || rejectAbsence.isPending}
              onClick={() => {
                if (!absenceSession) return;
                rejectAbsence.mutate(absenceSession.id, {
                  onSuccess: () => { toast.success("Đã từ chối cho vắng"); closeAbsenceDialog(); },
                  onError: () => toast.error("Thao tác thất bại"),
                });
              }}
            >
              Từ chối
            </Button>
            <Button
              className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white"
              disabled={approveAbsence.isPending || rejectAbsence.isPending}
              onClick={() => {
                if (!absenceSession) return;
                approveAbsence.mutate(absenceSession.id, {
                  onSuccess: () => { toast.success("Đã xác nhận báo vắng"); closeAbsenceDialog(); },
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

export default StudentSchedule;
