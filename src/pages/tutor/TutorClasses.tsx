import {
  BookOpen,
  CheckCircle2,
  Search,
  X,
  ChevronRight,
  Loader2,
  Clock,
  CalendarDays,
  Edit2,
  Save,
  Eye,
  Monitor,
  MapPin,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/hooks/useClasses";
import { useMySchedule } from "@/hooks/useSchedule";
import { useTutorAvailability, useUpdateMyAvailability } from "@/hooks/useTutors";
import type { AvailableSlotDto, ClassItem, SessionResponse, WeeklySlotDto } from "@/types/api";

// Map ClassStatus → the escrow/status badge buckets the UI styles below.
// ClassItem carries no escrow fields, so we derive a badge from `status`.
const statusToBadge: Record<string, string> = {
  searching: "pending",
  active: "in_progress",
  completed: "completed",
  cancelled: "refunded",
  paused: "pending",
};
const escrowColors: Record<string, string> = {
  pending: "bg-amber-100 text-warning dark:bg-amber-900/30 dark:text-amber-400",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-success dark:bg-emerald-900/30 dark:text-emerald-400",
  refunded: "bg-destructive/10 text-destructive",
};
const escrowLabels: Record<string, string> = {
  pending: "Chờ bắt đầu",
  in_progress: "Đang học",
  completed: "Hoàn thành",
  refunded: "Đã hoàn tiền",
};

const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23e2e8f0'/%3E%3C/svg%3E";

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const formatLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  hybrid: "Kết hợp",
};

// Build a human schedule string from the class's weeklySlots.
function buildClassSchedule(slots: WeeklySlotDto[]): string {
  if (!slots || slots.length === 0) return "Chưa có lịch";
  return slots
    .map((s) => {
      const day = dayLabels[s.dayOfWeek] ?? `T${s.dayOfWeek}`;
      const start = (s.startTime ?? "").slice(0, 5);
      const end = (s.endTime ?? "").slice(0, 5);
      return `${day} ${start}-${end}`;
    })
    .join(", ");
}

// "Đang dạy" = anything not finished/cancelled (searching/active/paused); everything else
// (completed/cancelled) is grouped under "Hoàn thành".
function isOngoing(status: string): boolean {
  return status !== "completed" && status !== "cancelled";
}

// ---------------------------------------------------------------------------
// Timetable/availability helpers (merged in from the former "Lịch dạy" page).
// ---------------------------------------------------------------------------
const allDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const timeSlots = ["7:00-9:00", "9:00-11:00", "14:00-16:00", "17:00-19:00", "19:00-21:00"];
const dayMap: Record<string, number> = { "Thứ 2": 1, "Thứ 3": 2, "Thứ 4": 3, "Thứ 5": 4, "Thứ 6": 5, "Thứ 7": 6, "Chủ nhật": 0 };

// "2026-06-05T19:00:00Z" -> "19:00"
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const STUDENT_AVATAR_PLACEHOLDER = "/placeholder.svg";

// Convert flat AvailableSlotDto[] -> grouped { day, slots[] } shape the grid edits with.
const groupSlots = (flat: AvailableSlotDto[]): { day: string; slots: string[] }[] => {
  const byDay = new Map<string, string[]>();
  for (const s of flat) {
    const list = byDay.get(s.day) ?? [];
    if (!list.includes(s.time)) list.push(s.time);
    byDay.set(s.day, list);
  }
  return Array.from(byDay, ([day, slots]) => ({ day, slots }));
};

// Flatten grouped -> AvailableSlotDto[] for the save mutation.
const flattenSlots = (grouped: { day: string; slots: string[] }[]): AvailableSlotDto[] =>
  grouped.flatMap((g) => g.slots.map((time) => ({ day: g.day, time })));

const TutorClasses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { classes, isLoading: classesLoading } = useClasses();
  const { sessions, isLoading: sessionsLoading } = useMySchedule();
  const { data: availability } = useTutorAvailability(user?.id);
  const updateAvailability = useUpdateMyAvailability();

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const [editMode, setEditMode] = useState(false);
  const [editAvail, setEditAvail] = useState<{ day: string; slots: string[] }[]>([]);
  const [selectedSession, setSelectedSession] = useState<ViewSession | null>(null);

  // Subject filter list derives from the fetched classes.
  const subjects = useMemo(() => [...new Set(classes.map((c) => c.subject))], [classes]);

  const filteredClasses = classes.filter((c) => {
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.studentName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterSubject !== "all" && c.subject !== filterSubject) return false;
    return true;
  });

  const activeClasses = filteredClasses.filter((c) => isOngoing(c.status));
  const completedClasses = filteredClasses.filter((c) => !isOngoing(c.status));

  // ---- Timetable / availability (merged from the former Lịch dạy page) ----
  const groupedAvail = useMemo(() => groupSlots(availability ?? []), [availability]);

  // Per-session class/student info is NOT on SessionResponse (only classId); join client-side.
  const classMap = useMemo(() => {
    const m = new Map<string, ClassItem>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  type ViewSessionInner = SessionResponse & {
    date: string;
    time: string;
    className: string;
    studentName: string;
    studentAvatar: string;
    subject: string;
    meetingLink?: string;
  };

  const allSessions: ViewSessionInner[] = useMemo(
    () =>
      sessions
        .map((s) => {
          const cls = classMap.get(s.classId);
          return {
            ...s,
            date: s.startAt.slice(0, 10),
            time: `${hhmm(s.startAt)}-${hhmm(s.endAt)}`,
            className: cls?.name ?? "Lớp học",
            studentName: cls?.studentName ?? "—",
            studentAvatar: STUDENT_AVATAR_PLACEHOLDER,
            subject: cls?.subject ?? "",
          };
        })
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [sessions, classMap],
  );

  const upcoming = allSessions.filter((s) => s.status === "scheduled" || s.status === "in_progress");
  const completedSessions = allSessions.filter((s) => s.status === "completed").reverse();

  const toggleSlot = (day: string, slot: string) => {
    setEditAvail((prev) => {
      const dayEntry = prev.find((a) => a.day === day);
      if (dayEntry) {
        const hasSlot = dayEntry.slots.includes(slot);
        return prev.map((a) =>
          a.day === day ? { ...a, slots: hasSlot ? a.slots.filter((s) => s !== slot) : [...a.slots, slot] } : a,
        );
      }
      return [...prev, { day, slots: [slot] }];
    });
  };

  const saveAvailability = () => {
    const slots = flattenSlots(editAvail.filter((a) => a.slots.length > 0));
    updateAvailability.mutate(
      { slots },
      {
        onSuccess: () => {
          setEditMode(false);
          toast.success("Đã cập nhật lịch rảnh!");
        },
        onError: () => toast.error("Không thể cập nhật lịch rảnh"),
      },
    );
  };

  const isSlotAvailable = (day: string, slot: string) => {
    const source = editMode ? editAvail : groupedAvail;
    return source.find((a) => a.day === day)?.slots.includes(slot) || false;
  };

  const getSessionsForDayTime = (day: string, time: string) =>
    upcoming.filter((s) => {
      const dayOfWeek = new Date(s.startAt).getDay();
      return dayMap[day] === dayOfWeek && s.time === time;
    });

  return (
    <div className="p-6 space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm"
        >
          <option value="all">Tất cả môn</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {classesLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lớp học...
        </div>
      ) : (
        <>
          {/* Lớp đang dạy */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="w-4 h-4 text-primary" /> Lớp đang dạy ({activeClasses.length})
            </h3>
            {activeClasses.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-border">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Không có lớp nào đang dạy</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeClasses.map((c: ClassItem) => (
                  <ClassCard key={c.id} c={c} onOpen={() => navigate(`/tutor/classes/${c.id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* Lớp hoàn thành */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" /> Lớp hoàn thành ({completedClasses.length})
            </h3>
            {completedClasses.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-border">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có lớp nào hoàn thành</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedClasses.map((c: ClassItem) => (
                  <ClassCard key={c.id} c={c} onOpen={() => navigate(`/tutor/classes/${c.id}`)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Thời khóa biểu & Lịch rảnh (merged in from the former "Lịch dạy" page) */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Thời khóa biểu & Lịch rảnh
          </h3>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={saveAvailability}
                  disabled={updateAvailability.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-60"
                >
                  <Save className="w-3 h-3" /> Lưu
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium"
                >
                  <X className="w-3 h-3" /> Hủy
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditMode(true);
                  setEditAvail(groupSlots(availability ?? []));
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium"
              >
                <Edit2 className="w-3 h-3" /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="text-[11px] text-muted-foreground font-medium p-2 text-left w-24">Giờ</th>
                {allDays.map((day) => (
                  <th key={day} className="text-[11px] text-muted-foreground font-medium p-2 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time} className="border-t border-border/50">
                  <td className="text-[11px] text-muted-foreground p-2 font-medium">{time}</td>
                  {allDays.map((day) => {
                    const available = isSlotAvailable(day, time);
                    const daySessions = getSessionsForDayTime(day, time);
                    return (
                      <td key={day} className="p-1 text-center">
                        {editMode ? (
                          <button
                            onClick={() => toggleSlot(day, time)}
                            className={cn(
                              "w-full h-12 rounded-lg text-[10px] font-medium transition-all",
                              available
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted/30 text-muted-foreground/50 border border-transparent hover:border-primary/20",
                            )}
                          >
                            {available ? "✓" : "+"}
                          </button>
                        ) : daySessions.length > 0 ? (
                          <button
                            onClick={() => setSelectedSession(daySessions[0])}
                            className="w-full p-1.5 bg-primary/10 border border-primary/20 rounded-lg text-left"
                          >
                            <p className="text-[10px] font-medium text-primary truncate">{daySessions[0].className}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{daySessions[0].studentName}</p>
                            <span
                              className={cn(
                                "text-[8px] px-1 py-0.5 rounded mt-0.5 inline-flex items-center gap-0.5",
                                daySessions[0].format === "online"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {daySessions[0].format === "online" ? <Monitor className="w-2 h-2" /> : <MapPin className="w-2 h-2" />}
                              {daySessions[0].format === "online" ? "ONL" : "OFF"}
                            </span>
                          </button>
                        ) : available ? (
                          <div className="w-full h-12 rounded-lg bg-success/15 dark:bg-emerald-900/10 border border-success/30/50 dark:border-success/40/50 flex items-center justify-center">
                            <span className="text-[10px] text-success">Rảnh</span>
                          </div>
                        ) : (
                          <div className="w-full h-12" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" /> Rảnh
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-primary/10 border border-primary/20" /> Có lớp
          </span>
          <span className="flex items-center gap-1">
            <Monitor className="w-3 h-3 text-primary" /> Online
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted-foreground" /> Offline
          </span>
        </div>
      </div>

      {sessionsLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải buổi học...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Buổi học sắp tới ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Không có buổi nào sắp tới</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => (
                  <div key={s.id} className="w-full flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{s.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.date} • {s.time}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5",
                        s.format === "online" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.format === "online" ? <Monitor className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                      {s.format === "online" ? "ONL" : "OFF"}
                    </span>
                    <button onClick={() => setSelectedSession(s)} className="p-1">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed sessions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Buổi đã hoàn thành
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground">Lớp học</th>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground">Ngày giờ</th>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground">Hình thức</th>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground">Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className="border-t border-border hover:bg-muted/20 cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium text-foreground">{s.className}</p>
                        <p className="text-[11px] text-muted-foreground">{s.content || "N/A"}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {s.date} • {s.startedAt ? hhmm(s.startedAt) : hhmm(s.startAt)}-{s.endedAt ? hhmm(s.endedAt) : hhmm(s.endAt)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-1 rounded-lg",
                            s.format === "online" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {s.format === "online" ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{s.rating ? `${s.rating}/5` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-md">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSession.className}</DialogTitle>
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
                    <span className="text-xs text-muted-foreground block">Học sinh</span>
                    <span className="font-medium">{selectedSession.studentName}</span>
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
                {selectedSession.format === "online" && selectedSession.meetingLink && (
                  <button
                    onClick={() => {
                      const link = selectedSession.meetingLink!;
                      setSelectedSession(null);
                      navigate(link);
                    }}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" /> Mở lớp học online
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Local alias so the Session Detail Dialog's prop type reads clean.
type ViewSession = SessionResponse & {
  date: string;
  time: string;
  className: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  meetingLink?: string;
};

function ClassCard({ c, onOpen }: { c: ClassItem; onOpen: () => void }) {
  const badge = statusToBadge[c.status] ?? "pending";
  const schedule = buildClassSchedule(c.weeklySlots);
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-elevated transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-base font-semibold text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground">
            {c.subject} • {formatLabels[c.format] ?? c.format}
          </p>
        </div>
        <span className={cn("text-[11px] font-medium px-2 py-1 rounded-lg", escrowColors[badge])}>
          {escrowLabels[badge]}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <img src={PLACEHOLDER_AVATAR} alt="" className="w-8 h-8 rounded-full object-cover" />
        <div>
          <p className="text-sm text-foreground">{c.studentName}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>
          {c.completedSessions}/{c.totalSessions} buổi
        </span>
        <span>{c.fee.toLocaleString("vi-VN")}đ</span>
      </div>
      <Progress value={c.totalSessions ? (c.completedSessions / c.totalSessions) * 100 : 0} className="h-1.5" />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{schedule}</span>
        <button onClick={onOpen} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Chi tiết <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default TutorClasses;
