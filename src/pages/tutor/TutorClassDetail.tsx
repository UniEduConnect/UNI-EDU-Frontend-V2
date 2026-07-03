import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, BookOpen, Clock, CheckCircle2, Play, Square, Users, Wallet, Upload, Plus, Trash2, AlertTriangle, Monitor, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerateExamWithAiDialog } from "@/components/exams/GenerateExamWithAiDialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useClass } from "@/hooks/useClasses";
import { useClassSessions, useStartSession, useEndSession, useConfirmSession, useCompleteSession, useCreateSession, useRequestAbsence } from "@/hooks/useSessions";
import { useClassMaterials, useAddClassMaterial, useDeleteClassMaterial } from "@/hooks/useMaterials";
import { formatSessionDate, formatSessionClock } from "@/lib/sessionTime";
import SessionStatusBadge from "@/components/schedule/SessionStatusBadge";
import type { WeeklySlotDto } from "@/types/api";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const buildSchedule = (slots: WeeklySlotDto[]): string =>
  slots
    .map(s => `${DAY_LABELS[s.dayOfWeek] ?? `?${s.dayOfWeek}`} ${s.startTime.slice(0, 5)}-${s.endTime.slice(0, 5)}`)
    .join(", ");

const sessionDate = (iso?: string | null): string => formatSessionDate(iso);
const sessionTime = (start?: string | null, end?: string | null): string =>
  `${formatSessionClock(start)}-${formatSessionClock(end)}`;

const TutorClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const { data: cls, isLoading } = useClass(classId);
  const { sessions } = useClassSessions(classId);
  const { materials } = useClassMaterials(classId);

  const startSession = useStartSession();
  const endSession = useEndSession();
  const completeSession = useCompleteSession();
  const createSessionM = useCreateSession();
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({ date: "", start: "19:00", end: "21:00", format: "online" });

  const handleAddSession = () => {
    if (!classId || !newSession.date) return;
    createSessionM.mutate(
      {
        classId,
        payload: {
          startAt: `${newSession.date}T${newSession.start}:00`,
          endAt: `${newSession.date}T${newSession.end}:00`,
          format: newSession.format,
        },
      },
      {
        onSuccess: () => { toast.success("Đã thêm buổi dạy!"); setAddSessionOpen(false); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể thêm buổi dạy"),
      }
    );
  };

  const handleComplete = (id: string) =>
    completeSession.mutate(id, {
      onSuccess: () => toast.success("Đã hoàn thành buổi học!"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể hoàn thành buổi học"),
    });
  const confirmSession = useConfirmSession();
  const requestAbsence = useRequestAbsence();
  const addMaterial = useAddClassMaterial(classId ?? "");
  const deleteMaterial = useDeleteClassMaterial(classId ?? "");

  const [sessionDialog, setSessionDialog] = useState<{ sessionId: string; mode: "start" | "end" | "absence" } | null>(null);
  const [endForm, setEndForm] = useState({ content: "", notes: "", homework: "" });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [newHomeworkUrl, setNewHomeworkUrl] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [absenceReason, setAbsenceReason] = useState("");
  const [materialDialog, setMaterialDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", type: "pdf" as "pdf" | "doc" | "image" | "video" | "link", url: "" });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lớp học...
    </div>
  );

  if (!cls) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Không tìm thấy lớp học</p>
      <button onClick={() => navigate("/tutor/classes")} className="mt-4 text-primary text-sm">← Quay lại</button>
    </div>
  );

  const schedule = buildSchedule(cls.weeklySlots);
  const completedSessions = sessions.filter(s => s.status === "completed");
  const scheduledSessions = sessions.filter(s => s.status === "scheduled");
  const pendingConfirmSessions = sessions.filter(s => s.status === "pending_confirm");
  const missedCount = sessions.filter(s => s.status === "missed").length;
  const attendanceRate = sessions.length > 0 ? Math.round((completedSessions.length / Math.max(1, completedSessions.length + missedCount)) * 100) : 0;
  const sessionDetail = selectedSession ? sessions.find(s => s.id === selectedSession) ?? null : null;
  const escrowPct = cls.escrowAmount > 0 ? Math.round((cls.escrowReleased / cls.escrowAmount) * 100) : 0;

  const handleStart = () => {
    if (!sessionDialog) return;
    startSession.mutate(sessionDialog.sessionId, {
      onSuccess: () => toast.success("Đã bắt đầu buổi học!"),
      onError: () => toast.error("Không thể bắt đầu buổi học"),
    });
    setSessionDialog(null);
  };

  const handleEnd = () => {
    if (!sessionDialog) return;
    endSession.mutate(
      { id: sessionDialog.sessionId, payload: { content: endForm.content, notes: endForm.notes, homework: endForm.homework, homeworkFiles: uploadedFiles } },
      {
        onSuccess: () => toast.success("Đã gửi yêu cầu xác nhận hoàn thành đến phụ huynh!"),
        onError: () => toast.error("Không thể gửi xác nhận"),
      }
    );
    setSessionDialog(null);
    setEndForm({ content: "", notes: "", homework: "" });
    setUploadedFiles([]);
  };

  const handleConfirm = (sessionId: string) => {
    confirmSession.mutate(sessionId, {
      onSuccess: () => toast.success("Phụ huynh đã xác nhận! Buổi học hoàn thành."),
      onError: () => toast.error("Không thể xác nhận buổi học"),
    });
  };

  const handleAbsence = () => {
    if (!sessionDialog || !absenceReason) return;
    requestAbsence.mutate(
      { id: sessionDialog.sessionId, payload: { reason: absenceReason, requestedBy: "tutor" } },
      {
        onSuccess: () => toast.info("Đã gửi yêu cầu báo vắng, chờ phụ huynh xác nhận."),
        onError: () => toast.error("Không thể gửi yêu cầu báo vắng"),
      }
    );
    setSessionDialog(null);
    setAbsenceReason("");
  };

  // No file-upload endpoint yet (backend-gaps GAP-10) — the tutor pastes a real link
  // (Google Drive, etc.) to the homework file instead of uploading bytes.
  const handleAddHomeworkLink = () => {
    const url = newHomeworkUrl.trim();
    if (!url) return;
    setUploadedFiles(prev => [...prev, url]);
    setNewHomeworkUrl("");
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.url.trim()) return;
    addMaterial.mutate(
      // size is unknown without an upload endpoint (GAP-10) — omit it rather than fabricate.
      { name: newMaterial.name, type: newMaterial.type, url: newMaterial.url.trim() },
      {
        onSuccess: () => toast.success("Đã thêm tài liệu!"),
        onError: () => toast.error("Không thể thêm tài liệu"),
      }
    );
    setNewMaterial({ name: "", type: "pdf", url: "" });
    setMaterialDialog(false);
  };

  const handleRemoveMaterial = (matId: string) => {
    deleteMaterial.mutate(matId, {
      onSuccess: () => toast.info("Đã xóa tài liệu"),
      onError: () => toast.error("Không thể xóa tài liệu"),
    });
  };

  const typeIcons: Record<string, string> = { pdf: "📄", doc: "📝", image: "🖼️", video: "🎬", link: "🔗" };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/tutor/classes")} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{cls.name}</h2>
          <p className="text-sm text-muted-foreground">{cls.subject} • {cls.format === "online" ? "Online" : cls.format === "offline" ? "Offline" : "Kết hợp"}{schedule ? ` • ${schedule}` : ""}</p>
        </div>
        <span className={cn("text-xs font-medium px-3 py-1.5 rounded-lg",
          cls.escrowStatus === "completed" ? "bg-emerald-100 text-success dark:bg-emerald-900/30 dark:text-emerald-400" :
          cls.escrowStatus === "in_progress" ? "bg-primary/10 text-primary" : "bg-amber-100 text-warning"
        )}>
          {cls.escrowStatus === "completed" ? "Hoàn thành" : cls.escrowStatus === "in_progress" ? "Đang học" : "Chờ bắt đầu"}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{cls.completedSessions}/{cls.totalSessions}</p>
          <p className="text-xs text-muted-foreground">Buổi hoàn thành</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
          <p className="text-xs text-muted-foreground">Chuyên cần</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Wallet className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-success">{escrowPct}%</p>
          <p className="text-xs text-muted-foreground">Giải ngân</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{cls.studentName}</p>
          <p className="text-xs text-muted-foreground">PH: {cls.parentName}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Wallet className="w-5 h-5 text-warning mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{cls.fee.toLocaleString("vi-VN")}đ</p>
          <p className="text-xs text-muted-foreground">Học phí</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Tiến độ</h3>
          <span className="text-xs text-muted-foreground">{cls.totalSessions > 0 ? Math.round((cls.completedSessions / cls.totalSessions) * 100) : 0}%</span>
        </div>
        <Progress value={cls.totalSessions > 0 ? (cls.completedSessions / cls.totalSessions) * 100 : 0} className="h-3 mb-3" />
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="font-semibold text-foreground">{cls.escrowAmount.toLocaleString("vi-VN")}đ</p>
            <p className="text-muted-foreground">Tổng Escrow</p>
          </div>
          <div className="p-2 bg-success/15 dark:bg-emerald-900/20 rounded-lg">
            <p className="font-semibold text-success">{cls.escrowReleased.toLocaleString("vi-VN")}đ</p>
            <p className="text-muted-foreground">Đã giải ngân</p>
          </div>
          <div className="p-2 bg-primary/5 rounded-lg">
            <p className="font-semibold text-primary">{(cls.escrowAmount - cls.escrowReleased).toLocaleString("vi-VN")}đ</p>
            <p className="text-muted-foreground">Còn giữ</p>
          </div>
        </div>
      </div>

      {/* Sessions & Materials Tabs */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">Tất cả ({sessions.length})</TabsTrigger>
          <TabsTrigger value="scheduled" className="rounded-lg">Sắp tới ({scheduledSessions.length})</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">Chờ XN ({pendingConfirmSessions.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">Đã xong ({completedSessions.length})</TabsTrigger>
          <TabsTrigger value="materials" className="rounded-lg">Tài liệu ({materials.length})</TabsTrigger>
        </TabsList>
        <button onClick={() => setAddSessionOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium shrink-0">
          <Plus className="w-3 h-3" /> Thêm buổi dạy
        </button>
        </div>

        {["all", "scheduled", "pending", "completed"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            {sessions
              .filter(s => tab === "all" ? true : tab === "pending" ? s.status === "pending_confirm" || s.status === "in_progress" : s.status === tab)
              .map(s => (
              <div key={s.id} className={cn("p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all",
                s.status === "scheduled" ? "border-primary/20 bg-primary/5" :
                s.status === "in_progress" ? "border-amber-300 bg-warning/15 dark:bg-amber-900/10" :
                s.status === "pending_confirm" ? "border-warning/30 bg-warning/15/50 dark:bg-amber-900/5" :
                "border-border bg-card"
              )} onClick={() => setSelectedSession(s.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      s.status === "completed" ? "bg-emerald-100 text-success dark:bg-emerald-900/30" :
                      s.status === "in_progress" ? "bg-amber-100 text-warning" :
                      s.status === "pending_confirm" ? "bg-amber-100 text-warning" :
                      "bg-primary/10 text-primary"
                    )}>
                      {sessions.indexOf(s) + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{sessionDate(s.startAt)} • {sessionTime(s.startAt, s.endAt)}</p>
                        {s.format && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5",
                            s.format === "online" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {s.format === "online" ? <Monitor className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                            {s.format === "online" ? "ONL" : "OFF"}
                          </span>
                        )}
                      </div>
                      {s.content && <p className="text-xs text-muted-foreground">{s.content}</p>}
                      {s.absenceReason && <p className="text-xs text-warning">⚠ Báo vắng: {s.absenceReason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "pending_confirm" && (
                      <button onClick={e => { e.stopPropagation(); handleConfirm(s.id); }} className="flex items-center gap-1 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" /> PH Xác nhận
                      </button>
                    )}
                    {s.status === "scheduled" && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setSessionDialog({ sessionId: s.id, mode: "absence" }); }} className="text-xs text-warning hover:underline">Báo vắng</button>
                        <button onClick={e => { e.stopPropagation(); setSessionDialog({ sessionId: s.id, mode: "start" }); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                          <Play className="w-3 h-3" /> Bắt đầu
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleComplete(s.id); }} disabled={completeSession.isPending} className="flex items-center gap-1 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </button>
                      </>
                    )}
                    {s.status === "in_progress" && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setSessionDialog({ sessionId: s.id, mode: "end" }); }} className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium">
                          <Square className="w-3 h-3" /> Kết thúc & ghi chú
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleComplete(s.id); }} disabled={completeSession.isPending} className="flex items-center gap-1 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </button>
                      </>
                    )}
                    {s.status === "completed" && <CheckCircle2 className="w-4 h-4 text-success" />}
                    {s.status === "pending_confirm" && <Clock className="w-4 h-4 text-warning" />}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        ))}

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Tài liệu & bài tập</h3>
            <div className="flex items-center gap-2">
              <GenerateExamWithAiDialog buttonVariant="outline" triggerLabel="Tạo bài tập AI" />
              <button onClick={() => setMaterialDialog(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                <Plus className="w-3 h-3" /> Thêm tài liệu
              </button>
            </div>
          </div>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có tài liệu nào</p>
          ) : materials.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <span className="text-xl">{typeIcons[m.type]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">{m.type.toUpperCase()} • {m.size || "N/A"} • {m.uploadedAt.slice(0, 10)}</p>
              </div>
              <a href={m.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><ExternalLink className="w-3.5 h-3.5" /></a>
              <button onClick={() => handleRemoveMaterial(m.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-md">
          {sessionDetail && (
            <>
              <DialogHeader><DialogTitle>Buổi {sessions.indexOf(sessionDetail) + 1} - {sessionDate(sessionDetail.startAt)}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Thời gian</span><span className="font-medium">{sessionTime(sessionDetail.startAt, sessionDetail.endAt)}</span></div>
                  <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Trạng thái</span><span className="font-medium"><SessionStatusBadge status={sessionDetail.status} /></span></div>
                  {sessionDetail.format && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Hình thức</span><span className="font-medium">{sessionDetail.format === "online" ? "Online" : "Offline"}</span></div>}
                  {sessionDetail.startedAt && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Bắt đầu</span><span className="font-medium">{formatSessionClock(sessionDetail.startedAt)}</span></div>}
                  {sessionDetail.endedAt && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Kết thúc</span><span className="font-medium">{formatSessionClock(sessionDetail.endedAt)}</span></div>}
                </div>
                {sessionDetail.content && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block mb-1">Nội dung</span><p className="text-sm">{sessionDetail.content}</p></div>}
                {sessionDetail.notes && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block mb-1">Nhận xét</span><p className="text-sm">{sessionDetail.notes}</p></div>}
                {sessionDetail.homework && <div className="p-3 bg-primary/5 rounded-xl border border-primary/10"><span className="text-xs text-muted-foreground block mb-1">Bài tập về nhà</span><p className="text-sm font-medium">{sessionDetail.homework}</p></div>}
                {sessionDetail.homeworkFiles && sessionDetail.homeworkFiles.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block mb-1">File đính kèm</span>
                    {sessionDetail.homeworkFiles.map((f, i) => <p key={i} className="text-xs text-primary">📎 {f}</p>)}
                  </div>
                )}
                {sessionDetail.absenceReason && (
                  <div className="p-3 bg-warning/15 dark:bg-amber-900/10 rounded-xl border border-warning/30">
                    <span className="text-xs text-muted-foreground block mb-1">Lý do vắng</span>
                    <p className="text-sm">{sessionDetail.absenceReason}</p>
                    <p className="text-[10px] text-warning mt-1">{sessionDetail.absenceApproved ? "✓ Đã được duyệt" : "⏳ Chờ phụ huynh duyệt"}</p>
                  </div>
                )}
                {sessionDetail.rating && (
                  <div className="p-3 bg-warning/15 dark:bg-amber-900/10 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">{[...Array(5)].map((_, i) => <span key={i} className={cn("text-sm", i < sessionDetail.rating! ? "text-amber-400" : "text-muted-foreground/30")}>★</span>)}</div>
                    {sessionDetail.ratingComment && <p className="text-xs text-muted-foreground">{sessionDetail.ratingComment}</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Start/End/Absence Session Dialog */}
      <Dialog open={!!sessionDialog} onOpenChange={() => setSessionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>
            {sessionDialog?.mode === "start" ? "Bắt đầu buổi học" : sessionDialog?.mode === "end" ? "Xác nhận hoàn thành" : "Báo vắng"}
          </DialogTitle></DialogHeader>
          {sessionDialog?.mode === "start" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Hệ thống sẽ ghi nhận thời gian bắt đầu.</p>
              <button onClick={handleStart} disabled={startSession.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">Xác nhận bắt đầu</button>
            </div>
          ) : sessionDialog?.mode === "end" ? (
            <div className="space-y-3">
              <div className="p-3 bg-warning/15 dark:bg-amber-900/10 rounded-xl border border-warning/30 text-xs text-warning">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Buổi học sẽ ở trạng thái "Chờ xác nhận" cho đến khi phụ huynh/học sinh xác nhận tham gia.
              </div>
              <div><label className="text-xs font-medium text-foreground">Nội dung đã dạy *</label><input value={endForm.content} onChange={e => setEndForm(p => ({ ...p, content: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" /></div>
              <div><label className="text-xs font-medium text-foreground">Nhận xét</label><textarea value={endForm.notes} onChange={e => setEndForm(p => ({ ...p, notes: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm h-20 resize-none" /></div>
              <div><label className="text-xs font-medium text-foreground">Bài tập về nhà</label><input value={endForm.homework} onChange={e => setEndForm(p => ({ ...p, homework: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" /></div>
              <div>
                <label className="text-xs font-medium text-foreground">File bài tập (tùy chọn)</label>
                <div className="mt-1 space-y-2">
                  {/* No upload endpoint yet (GAP-10) — paste a link to the homework file (Google Drive, etc.) */}
                  <div className="flex items-center gap-2">
                    <input
                      value={newHomeworkUrl}
                      onChange={e => setNewHomeworkUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddHomeworkLink(); } }}
                      placeholder="Dán link file bài tập (https://...)"
                      className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm"
                    />
                    <button onClick={handleAddHomeworkLink} disabled={!newHomeworkUrl.trim()} className="flex items-center gap-1 px-3 py-2 bg-muted border border-border rounded-xl text-xs hover:bg-primary/5 disabled:opacity-50">
                      <Upload className="w-3 h-3" /> Thêm
                    </button>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {uploadedFiles.map((f, i) => (
                        <a key={i} href={f} target="_blank" rel="noopener noreferrer" className="text-xs text-primary bg-primary/5 px-2 py-1 rounded-lg flex items-center gap-1 hover:underline">
                          📎 {f.length > 32 ? f.slice(0, 32) + "…" : f}
                          <button onClick={(e) => { e.preventDefault(); setUploadedFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-destructive">×</button>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleEnd} disabled={!endForm.content || endSession.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">Gửi xác nhận hoàn thành</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Yêu cầu báo vắng sẽ cần phụ huynh xác nhận.</p>
              <div><label className="text-xs font-medium text-foreground">Lý do *</label><textarea value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm h-20 resize-none" placeholder="Nhập lý do vắng..." /></div>
              <button onClick={handleAbsence} disabled={!absenceReason || requestAbsence.isPending} className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-medium disabled:opacity-50">Gửi yêu cầu báo vắng</button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={materialDialog} onOpenChange={setMaterialDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Thêm tài liệu</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-foreground">Tên tài liệu *</label><input value={newMaterial.name} onChange={e => setNewMaterial(p => ({ ...p, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" /></div>
            <div><label className="text-xs font-medium text-foreground">Loại</label>
              <select value={newMaterial.type} onChange={e => setNewMaterial(p => ({ ...p, type: e.target.value as typeof newMaterial.type }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm">
                <option value="pdf">PDF</option><option value="doc">Document</option><option value="image">Hình ảnh</option><option value="video">Video</option><option value="link">Link</option>
              </select>
            </div>
            <div>
              {/* TODO(BE): file-upload endpoint for class materials (currently URL only) */}
              <label className="text-xs font-medium text-foreground">Đường dẫn (URL)</label>
              <input value={newMaterial.url} onChange={e => setNewMaterial(p => ({ ...p, url: e.target.value }))} placeholder="https://..." className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
            </div>
            <button onClick={handleAddMaterial} disabled={!newMaterial.name || !newMaterial.url.trim() || addMaterial.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">Thêm tài liệu</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add teaching session */}
      <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Thêm buổi dạy</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground">Ngày *</label>
              <input type="date" value={newSession.date} onChange={e => setNewSession(p => ({ ...p, date: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Giờ bắt đầu</label>
                <input type="time" value={newSession.start} onChange={e => setNewSession(p => ({ ...p, start: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Giờ kết thúc</label>
                <input type="time" value={newSession.end} onChange={e => setNewSession(p => ({ ...p, end: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Hình thức</label>
              <select value={newSession.format} onChange={e => setNewSession(p => ({ ...p, format: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <button onClick={handleAddSession} disabled={!newSession.date || newSession.end <= newSession.start || createSessionM.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">
              {createSessionM.isPending ? "Đang thêm..." : "Thêm buổi dạy"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorClassDetail;
