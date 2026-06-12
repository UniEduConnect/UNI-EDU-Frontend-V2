import { BookOpen, CheckCircle2, Search, X, FileText, AlertTriangle, ChevronLeft, ChevronRight, Flag, Eye, Ban, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useClasses } from "@/hooks/useClasses";
import { useOpenClassRequests } from "@/hooks/useClassRequests";
import { useTrials, useAcceptTrial, useRejectTrial } from "@/hooks/useTrials";
import { useExams, useExam, useSubmitExam, useMySubmissions } from "@/hooks/useExams";
import type { ClassItem, TrialItem, WeeklySlotDto, QuestionResponse, SubmissionResponse } from "@/types/api";

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
const escrowLabels: Record<string, string> = { pending: "Chờ bắt đầu", in_progress: "Đang học", completed: "Hoàn thành", refunded: "Đã hoàn tiền" };

const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23e2e8f0'/%3E%3C/svg%3E";

const PASS_THRESHOLD = 70; // percent

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const formatLabels: Record<string, string> = { online: "Online", offline: "Offline", hybrid: "Kết hợp" };

// Build a human schedule string from the class's weeklySlots.
function buildSchedule(slots: WeeklySlotDto[]): string {
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

const passedOf = (s: SubmissionResponse) =>
  s.scoreScale > 0 ? (s.score / s.scoreScale) * 100 >= PASS_THRESHOLD : false;
const percentOf = (s: SubmissionResponse) =>
  s.scoreScale > 0 ? Math.round((s.score / s.scoreScale) * 100) : 0;

const TutorClasses = () => {
  const navigate = useNavigate();
  const { classes, isLoading: classesLoading } = useClasses();
  const { requests: seekingRequests, isLoading: seekingLoading } = useOpenClassRequests({ Page: 1 });
  const { trials, isLoading: trialsLoading } = useTrials();
  const acceptTrial = useAcceptTrial();
  const rejectTrial = useRejectTrial();

  // Exams API: available tutor-test exams + this tutor's submission history.
  const { exams, isLoading: examsLoading } = useExams({ Status: "open" });
  const tutorTests = useMemo(() => exams.filter((e) => e.type === "tutor-test"), [exams]);
  const { submissions, isLoading: submissionsLoading } = useMySubmissions();

  const [activeTab, setActiveTab] = useState("my-classes");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Test state
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const { data: examDetail, isLoading: examDetailLoading } = useExam(selectedExamId ?? undefined);
  const submitExam = useSubmitExam();
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testFlagged, setTestFlagged] = useState<Set<number>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testResult, setTestResult] = useState<SubmissionResponse | null>(null);

  // Trial detail & rejection
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);
  const trialDetail = selectedTrial ? trials.find((t) => t.id === selectedTrial) : null;
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Test results view
  const [viewSubmissionId, setViewSubmissionId] = useState<number | null>(null);
  const selectedSubmission = viewSubmissionId != null ? submissions.find((r) => r.id === viewSubmissionId) : null;

  // Subject filter list derives from the fetched classes.
  const subjects = useMemo(() => [...new Set(classes.map((c) => c.subject))], [classes]);

  const filteredClasses = classes.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && statusToBadge[c.status] !== filterStatus) return false;
    if (filterSubject !== "all" && c.subject !== filterSubject) return false;
    return true;
  });

  const filteredTrials = trials.filter((t) => {
    if (search && !t.studentName.toLowerCase().includes(search.toLowerCase()) && !(t.subjectName ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const closeTest = () => {
    setSelectedExamId(null);
    setTestAnswers({});
    setTestFlagged(new Set());
    setCurrentQuestion(0);
    setTestResult(null);
  };

  const openTest = (examId: number) => {
    setSelectedExamId(examId);
    setTestAnswers({});
    setTestFlagged(new Set());
    setCurrentQuestion(0);
    setTestResult(null);
  };

  const currentTestQuestions: QuestionResponse[] = examDetail?.questions ?? [];
  const currentQ = currentTestQuestions[currentQuestion];
  const answeredCount = Object.keys(testAnswers).length;

  const submitTest = () => {
    if (selectedExamId == null) return;
    const answers = currentTestQuestions
      .filter((q) => testAnswers[q.id] !== undefined)
      .map((q) => ({ questionId: q.id, selectedOption: testAnswers[q.id] }));
    submitExam.mutate(
      { id: selectedExamId, payload: { answers } },
      {
        onSuccess: (res) => setTestResult(res),
        onError: () => toast.error("Nộp bài thất bại. Vui lòng thử lại."),
      }
    );
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    rejectTrial.mutate(
      { id: rejectDialog, note: rejectReason },
      {
        onSuccess: () => {
          toast.info("Đã từ chối với lý do.");
          setRejectDialog(null);
          setRejectReason("");
        },
        onError: () => toast.error("Không thể từ chối yêu cầu."),
      }
    );
  };

  const handleConfirmTrial = (id: string) => {
    acceptTrial.mutate(id, {
      onSuccess: () => toast.success("Đã xác nhận!"),
      onError: () => toast.error("Không thể xác nhận yêu cầu."),
    });
  };

  const trialStatusColors: Record<string, string> = {
    pending: "bg-amber-100 text-warning dark:bg-amber-900/30 dark:text-amber-400",
    confirmed: "bg-primary/10 text-primary",
    accepted: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    completed: "bg-emerald-100 text-success dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  const trialStatusLabels: Record<string, string> = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", accepted: "Đã xác nhận", rejected: "Đã từ chối", completed: "Hoàn thành" };

  return (
    <div className="p-6 space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex gap-2">
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-xl text-sm">
            <option value="all">Tất cả môn</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {activeTab === "my-classes" && (
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-xl text-sm">
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ bắt đầu</option>
              <option value="in_progress">Đang học</option>
              <option value="completed">Hoàn thành</option>
            </select>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="my-classes" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Lớp của tôi ({classes.length})</TabsTrigger>
          <TabsTrigger value="seeking" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Đang tìm gia sư ({seekingRequests.length})</TabsTrigger>
          <TabsTrigger value="trials" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Yêu cầu học thử ({trials.filter(t => t.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="test-results" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Bài test ({submissions.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: My Classes */}
        <TabsContent value="my-classes" className="mt-4">
          {classesLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lớp học...
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClasses.map((c: ClassItem) => {
              const badge = statusToBadge[c.status] ?? "pending";
              const schedule = buildSchedule(c.weeklySlots);
              return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-elevated transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.subject} • {formatLabels[c.format] ?? c.format}</p>
                  </div>
                  <span className={cn("text-[11px] font-medium px-2 py-1 rounded-lg", escrowColors[badge])}>{escrowLabels[badge]}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={PLACEHOLDER_AVATAR} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm text-foreground">{c.studentName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{c.completedSessions}/{c.totalSessions} buổi</span>
                  <span>{c.fee.toLocaleString("vi-VN")}đ</span>
                </div>
                <Progress value={c.totalSessions ? (c.completedSessions / c.totalSessions) * 100 : 0} className="h-1.5" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{schedule}</span>
                  <button onClick={() => navigate(`/tutor/classes/${c.id}`)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    Chi tiết <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );})}
            {filteredClasses.length === 0 && (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Không tìm thấy lớp học nào</p>
              </div>
            )}
          </div>
          )}
        </TabsContent>

        {/* Tab 2: Seeking — real open class requests (students looking for a tutor) */}
        <TabsContent value="seeking" className="mt-4">
          <div className="mb-4 p-3 bg-warning/15 dark:bg-amber-900/10 border border-warning/30 dark:border-warning/40 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <p className="text-xs text-warning dark:text-amber-400">Nhận lớp cần làm bài test AI (≥80%) cho đúng môn. Bấm "Nhận lớp" để làm test.</p>
          </div>
          {seekingLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải yêu cầu...
            </div>
          ) : seekingRequests.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Hiện chưa có học sinh nào đang tìm gia sư</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {seekingRequests.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-elevated transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground font-semibold shrink-0">
                      {(r.studentName?.trim()?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground">{r.subject} • Lớp {r.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{r.preferredSchedule || "Lịch linh hoạt"}</span>
                    <span className="font-semibold text-foreground">
                      {r.budget != null ? `${r.budget.toLocaleString("vi-VN")}đ/buổi` : "Thỏa thuận"}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/tutor/find-students")}
                    className="w-full text-xs font-medium text-primary-foreground bg-primary hover:bg-[#1E69E7] rounded-xl py-2 transition-colors"
                  >
                    Nhận lớp (làm bài test)
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Trials */}
        <TabsContent value="trials" className="mt-4">
          {trialsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải yêu cầu...
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTrials.map((t: TrialItem) => {
              const requestedDate = t.requestedAt ? new Date(t.requestedAt).toLocaleString("vi-VN") : "";
              return (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <img src={PLACEHOLDER_AVATAR} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-foreground">{t.studentName}</p>
                      <span className={cn("text-[11px] font-medium px-2 py-1 rounded-lg", trialStatusColors[t.status] ?? "bg-muted text-muted-foreground")}>{trialStatusLabels[t.status] ?? t.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.subjectName} • {requestedDate}</p>
                  </div>
                </div>
                {t.note && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.note}</p>}
                {t.reviewNote && (
                  <div className="mt-2 p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                    <p className="text-xs text-destructive"><strong>Lý do từ chối:</strong> {t.reviewNote}</p>
                  </div>
                )}
                {t.feedback && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Phản hồi: {t.feedback}</p>
                    {t.rating != null && <div className="flex items-center gap-0.5 mt-1">{[...Array(5)].map((_, i) => <span key={i} className={cn("text-xs", i < (t.rating ?? 0) ? "text-amber-400" : "text-muted-foreground/30")}>★</span>)}</div>}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setSelectedTrial(t.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80">
                    <Eye className="w-4 h-4" /> Chi tiết
                  </button>
                  {t.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleConfirmTrial(t.id)}
                        disabled={acceptTrial.isPending}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Xác nhận
                      </button>
                      <button onClick={() => setRejectDialog(t.id)} className="px-3 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20">
                        <Ban className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );})}
            {filteredTrials.length === 0 && (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Không có yêu cầu học thử</p>
              </div>
            )}
          </div>
          )}
        </TabsContent>

        {/* Tab 4: Test (tutor qualification) */}
        {/* TODO(BE): SubmissionResponse needs passed/passThreshold; per-question explanations; monthly attempt eligibility for tutor-test */}
        <TabsContent value="test-results" className="mt-4 space-y-6">
          {/* Available tutor-test exams to take */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Bài test năng lực khả dụng</p>
            {examsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải bài test...
              </div>
            ) : tutorTests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hiện chưa có bài test năng lực nào.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {tutorTests.map((e) => (
                  <div key={e.id} className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-base font-semibold text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.subject} • {e.questionCount} câu • {e.duration} phút</p>
                    <button
                      onClick={() => openTest(e.id)}
                      className="mt-3 w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                    >
                      Làm bài
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission history */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Lịch sử làm bài</p>
            {submissionsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có bài test nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {submissions.map((r) => {
                  const passed = passedOf(r);
                  const pct = percentOf(r);
                  return (
                    <div key={r.id} className={cn("bg-card border rounded-2xl p-5", passed ? "border-success/30 dark:border-success/40" : "border-destructive/20")}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">{r.examTitle}</p>
                          <p className="text-xs text-muted-foreground">{r.submissionDate ? new Date(r.submissionDate).toLocaleDateString("vi-VN") : ""}</p>
                        </div>
                        <div className={cn("text-2xl font-bold", passed ? "text-success" : "text-destructive")}>{pct}%</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-lg", passed ? "bg-emerald-100 text-success dark:bg-emerald-900/30" : "bg-destructive/10 text-destructive")}>
                          {passed ? "✓ Đạt" : "✗ Không đạt"}
                        </span>
                        <button onClick={() => setViewSubmissionId(r.id)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Trial Detail Dialog */}
      <Dialog open={!!selectedTrial} onOpenChange={() => setSelectedTrial(null)}>
        <DialogContent className="max-w-lg">
          {trialDetail && (
            <>
              <DialogHeader><DialogTitle>Chi tiết yêu cầu học thử</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <img src={PLACEHOLDER_AVATAR} alt="" className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <p className="text-base font-semibold text-foreground">{trialDetail.studentName}</p>
                    <p className="text-sm text-muted-foreground">{trialDetail.subjectName}</p>
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-lg mt-1 inline-block", trialStatusColors[trialDetail.status] ?? "bg-muted text-muted-foreground")}>{trialStatusLabels[trialDetail.status] ?? trialDetail.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Môn học</span><span className="font-medium">{trialDetail.subjectName}</span></div>
                  <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Ngày yêu cầu</span><span className="font-medium">{trialDetail.requestedAt ? new Date(trialDetail.requestedAt).toLocaleString("vi-VN") : "—"}</span></div>
                  {trialDetail.currentLevel && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block">Trình độ</span><span className="font-medium">{trialDetail.currentLevel}</span></div>}
                </div>
                {trialDetail.goals && <div className="p-3 bg-primary/5 rounded-xl border border-primary/10"><span className="text-xs text-muted-foreground block mb-1">Mục tiêu</span><p className="text-sm font-medium">{trialDetail.goals}</p></div>}
                {trialDetail.note && <div className="p-3 bg-muted/50 rounded-xl"><span className="text-xs text-muted-foreground block mb-1">Ghi chú</span><p className="text-sm">{trialDetail.note}</p></div>}
                {trialDetail.reviewNote && (
                  <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10">
                    <span className="text-xs text-muted-foreground block mb-1">Lý do từ chối</span>
                    <p className="text-sm text-destructive">{trialDetail.reviewNote}</p>
                  </div>
                )}
                {trialDetail.feedback && (
                  <div className="p-3 bg-success/15 dark:bg-emerald-900/10 rounded-xl">
                    <span className="text-xs text-muted-foreground block mb-1">Phản hồi</span>
                    <p className="text-sm">{trialDetail.feedback}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Từ chối yêu cầu học thử</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Vui lòng nêu lý do từ chối để phụ huynh hiểu.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm h-24 resize-none" placeholder="Lý do từ chối..." />
            <button onClick={handleReject} disabled={!rejectReason.trim() || rejectTrial.isPending} className="w-full py-2.5 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50">Xác nhận từ chối</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={selectedExamId != null} onOpenChange={() => closeTest()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExamId != null && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Bài kiểm tra{examDetail ? ` - ${examDetail.title}` : ""}</span>
                  {!testResult && <span className="text-sm font-normal text-muted-foreground">{answeredCount}/{currentTestQuestions.length}</span>}
                </DialogTitle>
              </DialogHeader>

              {examDetailLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải bài test...
                </div>
              ) : !testResult ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentTestQuestions.map((q, i) => (
                      <button key={q.id} onClick={() => setCurrentQuestion(i)} className={cn(
                        "w-9 h-9 rounded-lg text-xs font-semibold border transition-all relative",
                        i === currentQuestion ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-md" :
                        testAnswers[q.id] !== undefined ? "bg-emerald-100 text-emerald-700 border-emerald-400" :
                        "bg-card text-muted-foreground border-border hover:border-primary/50"
                      )}>
                        {i + 1}
                        {testFlagged.has(q.id) && <Flag className="w-2.5 h-2.5 text-warning absolute -top-1 -right-1" />}
                      </button>
                    ))}
                  </div>
                  {currentQ && (
                    <div className="p-5 bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-700">Câu {currentQuestion + 1}/{currentTestQuestions.length}</p>
                        <button onClick={() => {
                          const f = new Set(testFlagged);
                          if (f.has(currentQ.id)) f.delete(currentQ.id); else f.add(currentQ.id);
                          setTestFlagged(f);
                        }} className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium", testFlagged.has(currentQ.id) ? "bg-amber-100 text-warning" : "bg-muted text-muted-foreground")}>
                          <Flag className="w-3 h-3" /> {testFlagged.has(currentQ.id) ? "Đã đánh dấu" : "Đánh dấu"}
                        </button>
                      </div>
                      <p className="text-base font-bold text-slate-800 mb-4">{currentQ.content}</p>
                      <div className="space-y-2">
                        {currentQ.options.map((opt, oi) => (
                          <button key={oi} onClick={() => setTestAnswers(prev => ({ ...prev, [currentQ.id]: oi }))} className={cn(
                            "w-full text-left p-3 rounded-lg border text-sm font-medium transition-all hover:scale-[1.01]",
                            testAnswers[currentQ.id] === oi ? "bg-blue-600 text-white border-blue-600" : "bg-white border-border text-slate-700 hover:border-blue-300"
                          )}>
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(p => p - 1)} className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm disabled:opacity-50">
                      <ChevronLeft className="w-4 h-4" /> Câu trước
                    </button>
                    {currentQuestion < currentTestQuestions.length - 1 ? (
                      <button onClick={() => setCurrentQuestion(p => p + 1)} className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm shadow hover:shadow-lg transition">
                        Câu tiếp <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={submitTest} disabled={answeredCount < currentTestQuestions.length || submitExam.isPending} className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50">
                        Nộp bài ({answeredCount}/{currentTestQuestions.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  {(() => {
                    const passed = passedOf(testResult);
                    const pct = percentOf(testResult);
                    return (
                      <>
                        <div className={cn("p-8 rounded-2xl", passed ? "bg-success/15 dark:bg-emerald-900/10" : "bg-destructive/5")}>
                          <p className={cn("text-5xl font-bold mb-2", passed ? "text-success" : "text-destructive")}>{pct}%</p>
                          <p className="text-sm text-muted-foreground">{passed ? "🎉 Đạt yêu cầu!" : "😔 Chưa đạt yêu cầu (≥70%)."}</p>
                          <p className="text-xs text-muted-foreground mt-2">{testResult.correctCount}/{testResult.totalQuestions} câu đúng</p>
                        </div>
                        {/* GAP: SubmissionResponse exposes no per-question breakdown/explanation, so we cannot show an answer review here. */}
                        <button onClick={() => closeTest()} className={cn("w-full py-3 rounded-xl font-medium", passed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          Đóng
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Result Detail Dialog */}
      <Dialog open={viewSubmissionId != null} onOpenChange={() => setViewSubmissionId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Kết quả bài test - {selectedSubmission.examTitle}</span>
                  <span className={cn("text-2xl font-bold", passedOf(selectedSubmission) ? "text-success" : "text-destructive")}>{percentOf(selectedSubmission)}%</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="p-3 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground">Ngày làm</p><p className="font-medium">{selectedSubmission.submissionDate ? new Date(selectedSubmission.submissionDate).toLocaleDateString("vi-VN") : "—"}</p></div>
                  <div className="p-3 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground">Số câu đúng</p><p className="font-medium">{selectedSubmission.correctCount}/{selectedSubmission.totalQuestions}</p></div>
                  <div className={cn("p-3 rounded-xl", passedOf(selectedSubmission) ? "bg-success/15 dark:bg-emerald-900/10" : "bg-destructive/5")}><p className="text-xs text-muted-foreground">Kết quả</p><p className="font-medium">{passedOf(selectedSubmission) ? "Đạt" : "Không đạt"}</p></div>
                </div>
                {selectedSubmission.aiFeedback && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Nhận xét</p>
                    <p className="text-sm">{selectedSubmission.aiFeedback}</p>
                  </div>
                )}
                {/* GAP: SubmissionResponse has no per-question answers/explanations, so a question-by-question review is not available. */}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorClasses;
