import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  Video,
  MapPin,
  Wallet,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClass } from "@/hooks/useClasses";
import { useClassSessions } from "@/hooks/useSessions";
import { formatSessionDate, formatSessionClock } from "@/lib/sessionTime";
import type { WeeklySlotDto } from "@/types/api";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const buildSchedule = (slots: WeeklySlotDto[]): string =>
  slots
    .map((s) => `${DAY_LABELS[s.dayOfWeek] ?? `?${s.dayOfWeek}`} ${s.startTime.slice(0, 5)}-${s.endTime.slice(0, 5)}`)
    .join(", ");

const sessionDate = (iso?: string | null): string => formatSessionDate(iso);
const sessionTime = (start?: string | null, end?: string | null): string =>
  `${formatSessionClock(start)}-${formatSessionClock(end)}`;

const StudentClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const { data: cls, isLoading } = useClass(classId);
  const { sessions } = useClassSessions(classId);

  // TODO(BE): structured assignments endpoint (submission, score, feedback, attachments) — only session.homework exists today
  const [detailHomeworkSessionId, setDetailHomeworkSessionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lớp học...
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm font-medium text-foreground">Không tìm thấy lớp học.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lớp có thể đã bị xóa hoặc đường dẫn không đúng.
          </p>
        </div>
      </div>
    );
  }

  const schedule = buildSchedule(cls.weeklySlots);
  const isOnline = cls.format === "online";
  const progress = cls.totalSessions > 0 ? (cls.completedSessions / cls.totalSessions) * 100 : 0;

  // The only per-session "assignment" data that exists is session.homework + session.homeworkFiles.
  const homeworkSessions = sessions.filter((s) => s.homework || s.homeworkFiles.length > 0);
  const detailSession = detailHomeworkSessionId
    ? sessions.find((s) => s.id === detailHomeworkSessionId) ?? null
    : null;

  return (
    <div className="px-6 pt-2 pb-6 space-y-3">
      <button
        onClick={() => navigate("/student/classes")}
        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại lớp học
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Chi tiết lớp học
            </div>

            <h2 className="mt-3 text-2xl font-bold">{cls.name}</h2>
            <p className="mt-1 text-sm text-white/80">
              {cls.tutorName}{schedule ? ` • ${schedule}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] text-white hover:bg-white/15">
                {isOnline ? (
                  <>
                    <Video className="mr-1 h-3 w-3" /> Online
                  </>
                ) : (
                  <>
                    <MapPin className="mr-1 h-3 w-3" /> Offline
                  </>
                )}
              </Badge>

              <Badge className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] text-white hover:bg-white/15">
                <GraduationCap className="mr-1 h-3 w-3" />
                {cls.subject}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/75">Tiến độ</p>
              <p className="mt-1 text-2xl font-bold">{Math.round(progress)}%</p>
              <p className="text-[11px] text-white/70">
                {cls.completedSessions}/{cls.totalSessions} buổi
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/75">Học phí</p>
              <p className="mt-1 text-lg font-bold">
                {cls.fee.toLocaleString("vi-VN")}đ
              </p>
              <p className="text-[11px] text-white/70">Tổng khóa học</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/20">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <p className="text-xs text-muted-foreground">Môn học</p>
          <p className="mt-1 text-base font-semibold text-foreground">{cls.subject}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <p className="text-xs text-muted-foreground">Buổi đã học</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {cls.completedSessions}/{cls.totalSessions}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/20">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          </div>
          <p className="text-xs text-muted-foreground">Buổi có bài tập</p>
          <p className="mt-1 text-base font-semibold text-foreground">{homeworkSessions.length}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/20">
            <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-300" />
          </div>
          <p className="text-xs text-muted-foreground">Học phí</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {cls.fee.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tổng quan lớp học</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Theo dõi tiến độ hoàn thành của khóa học
            </p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
            {Math.round(progress)}% hoàn thành
          </Badge>
        </div>

        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tiến độ khóa học</span>
            <span className="text-xs font-semibold text-foreground">
              {cls.completedSessions}/{cls.totalSessions} buổi
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/35 p-4">
            <p className="text-[11px] text-muted-foreground">Gia sư</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{cls.tutorName}</p>
          </div>

          <div className="rounded-2xl bg-muted/35 p-4">
            <p className="text-[11px] text-muted-foreground">Lịch học</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{schedule || "Chưa có lịch"}</p>
          </div>

          <div className="rounded-2xl bg-muted/35 p-4">
            <p className="text-[11px] text-muted-foreground">Hình thức</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Homework (only session.homework exists — no structured assignments endpoint yet) */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-amber-600" />
              Bài tập trong lớp
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Bài tập gia sư giao theo từng buổi học
            </p>
          </div>

          <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300">
            {homeworkSessions.length} bài tập
          </Badge>
        </div>

        {homeworkSessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-3">
            {homeworkSessions.map((s) => {
              const index = sessions.indexOf(s);
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Bài tập buổi {index + 1}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sessionDate(s.startAt)} • {s.homework || "(Xem file đính kèm)"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {s.homeworkFiles.length > 0 && (
                      <Badge className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {s.homeworkFiles.length} file
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setDetailHomeworkSessionId(s.id)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/student/classes")}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Xem các lớp khác <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Homework Detail Modal */}
      {detailSession && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Bài tập buổi {sessions.indexOf(detailSession) + 1}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Buổi học: {sessionDate(detailSession.startAt)} • {sessionTime(detailSession.startAt, detailSession.endAt)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailHomeworkSessionId(null)}
                className="rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Homework content */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Nội dung bài tập</h3>
                <p className="text-sm text-muted-foreground">
                  {detailSession.homework || "Không có mô tả."}
                </p>
              </div>

              {/* Attached files */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">File đính kèm</h3>
                {detailSession.homeworkFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có file đính kèm.</p>
                ) : (
                  <div className="space-y-2">
                    {detailSession.homeworkFiles.map((file, idx) => (
                      <a
                        key={idx}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium text-primary truncate">{file}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Tutor notes */}
              {detailSession.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Nhận xét từ gia sư</h3>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/20">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {detailSession.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassDetail;
