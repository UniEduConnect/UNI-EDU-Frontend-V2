import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  GraduationCap,
  School,
  CalendarClock,
  Clock,
  Wallet,
  StickyNote,
  XCircle,
  Megaphone,
  Plus,
  MapPin,
  Eye,
  UserCheck,
  Sparkles,
  Ban,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AiTestDialog } from "@/components/AiTestDialog";
import WeeklySchedulePicker, { useWeeklySchedule } from "@/components/schedule/WeeklySchedulePicker";
import { useOpenClassRequests, useAcceptClassRequest } from "@/hooks/useClassRequests";
import {
  useCreateTutorPost,
  useMyTutorPosts,
  useCloseTutorPost,
  useTutorPostApplications,
  useAcceptTutorPostApplication,
} from "@/hooks/useTutorPosts";
import { useTrials, useAcceptTrial, useRejectTrial } from "@/hooks/useTrials";
import { useExams, useExam, useSubmitExam, useMySubmissions } from "@/hooks/useExams";
import { useSubjects } from "@/hooks/useSubjects";
import type {
  ClassRequestResponse,
  QuestionResponse,
  SubmissionResponse,
  TrialItem,
  TutorPostApplicationResponse,
} from "@/types/api";

const ALL_SUBJECTS = "__all__";
const PASS_THRESHOLD = 70; // percent

const formatVnd = (v?: number | null) =>
  v == null ? "Thỏa thuận" : `${v.toLocaleString("vi-VN")}đ`;

const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23e2e8f0'/%3E%3C/svg%3E";

const passedOf = (s: SubmissionResponse) =>
  s.scoreScale > 0 ? (s.score / s.scoreScale) * 100 >= PASS_THRESHOLD : false;
const percentOf = (s: SubmissionResponse) =>
  s.scoreScale > 0 ? Math.round((s.score / s.scoreScale) * 100) : 0;

const TutorFindStudents = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- Filters (seeded once from URL params) -----------------------------
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  // The URL `subject` param carries the subject NAME; the filter state stores
  // either a subject id (from the in-page <Select>) or — when seeded from the
  // URL — the raw name. `resolveSubjectParam` handles both shapes below.
  const [subject, setSubject] = useState(
    () => searchParams.get("subject") ?? ALL_SUBJECTS,
  );
  const gradeParam = searchParams.get("grade");

  // Which tab is active — deep-linkable via ?tab=seeking|trials|exams (e.g. from
  // notification clicks in TutorLayout/TeacherLayout).
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "seeking");

  // Re-sync filters whenever the URL query changes — e.g. the "Tìm học sinh khác"
  // popup navigates here with new params while we're already on this page.
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setSubject(searchParams.get("subject") ?? ALL_SUBJECTS);
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  const { subjects } = useSubjects();
  const { requests, isLoading } = useOpenClassRequests({
    Search: search.trim() || undefined,
    Subject: subject === ALL_SUBJECTS ? undefined : resolveSubjectParam(subjects, subject),
    Page: 1,
  });

  // Optional client-side grade filter from the `grade` URL param.
  const visibleRequests = useMemo(() => {
    if (!gradeParam) return requests;
    const g = Number(gradeParam);
    if (Number.isNaN(g)) return requests;
    return requests.filter((r) => r.grade === g);
  }, [requests, gradeParam]);

  // ---- Accept dialog state ----------------------------------------------
  const [activeRequest, setActiveRequest] = useState<ClassRequestResponse | null>(null);

  // ---- Detail dialog state ----------------------------------------------
  const [detailRequest, setDetailRequest] = useState<ClassRequestResponse | null>(null);

  // ---- "Post an ad" (tutor looking for students) ------------------------
  const [postOpen, setPostOpen] = useState(false);

  // ---- Trials (yêu cầu học thử) -------------------------------------------
  const { trials, isLoading: trialsLoading } = useTrials();
  const acceptTrial = useAcceptTrial();
  const rejectTrial = useRejectTrial();
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);
  const trialDetail = selectedTrial ? trials.find((t) => t.id === selectedTrial) : null;
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingTrials = trials.filter((t) => t.status === "pending").length;

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
      },
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
  const trialStatusLabels: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    accepted: "Đã xác nhận",
    rejected: "Đã từ chối",
    completed: "Hoàn thành",
  };

  // ---- Exams / tutor qualification tests ----------------------------------
  const { exams, isLoading: examsLoading } = useExams({ Status: "open" });
  const tutorTests = useMemo(() => exams.filter((e) => e.type === "tutor-test"), [exams]);
  const { submissions, isLoading: submissionsLoading } = useMySubmissions();

  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const { data: examDetail, isLoading: examDetailLoading } = useExam(selectedExamId ?? undefined);
  const submitExam = useSubmitExam();
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testFlagged, setTestFlagged] = useState<Set<number>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testResult, setTestResult] = useState<SubmissionResponse | null>(null);
  const [viewSubmissionId, setViewSubmissionId] = useState<number | null>(null);
  const selectedSubmission =
    viewSubmissionId != null ? submissions.find((r) => r.id === viewSubmissionId) : null;

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
      },
    );
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Tìm học sinh
          </h1>
          <p className="text-sm text-muted-foreground">
            Học sinh đang tìm gia sư. Nhận lớp bằng cách hoàn thành bài test gia sư.
          </p>
        </div>
        <Button onClick={() => setPostOpen(true)} className="rounded-xl shrink-0">
          <Megaphone className="w-4 h-4 mr-2" /> Đăng tin tìm học sinh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="seeking" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Tìm học sinh ({visibleRequests.length})
          </TabsTrigger>
          <TabsTrigger value="trials" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Yêu cầu học thử ({pendingTrials})
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Bài test ({submissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Seeking — browse open class requests + my posts/applications */}
        <TabsContent value="seeking" className="mt-4 space-y-6">
          {/* Students who registered on my posts ("đăng ký học") — accept via AI test */}
          <TutorPostApplications />

          {/* My tutor posts ("Tìm học sinh" ads) */}
          <MyTutorPosts />

          {/* Search & subject filter */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc môn học..."
                  className="pl-10 rounded-xl"
                />
              </div>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full sm:w-52 rounded-xl">
                  <SelectValue placeholder="Tất cả môn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SUBJECTS}>Tất cả môn</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách...
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <GraduationCap className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="text-sm">Chưa có học sinh nào đang tìm gia sư</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleRequests.map((r) => (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-elevated transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-foreground font-semibold shrink-0">
                      {(r.studentName?.trim()?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground truncate">{r.studentName}</h3>
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">
                          Lớp {r.grade}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {r.subject}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />
                      {r.school || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {r.preferredSchedule || "Linh hoạt"}
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground col-span-2">
                      {r.budget != null ? `${r.budget.toLocaleString("vi-VN")}đ/buổi` : "Học phí: thỏa thuận"}
                    </div>
                    {r.durationMonths != null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                        <CalendarClock className="w-3 h-3" />
                        Học trong {r.durationMonths} tháng
                      </div>
                    )}
                  </div>

                  {r.note && <div className="mb-3 text-[11px] text-muted-foreground line-clamp-2">{r.note}</div>}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => setDetailRequest(r)}
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                    </Button>
                    <Button size="sm" className="flex-1 rounded-xl text-xs" onClick={() => setActiveRequest(r)}>
                      Nhận lớp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail dialog */}
          <DetailDialog
            request={detailRequest}
            onClose={() => setDetailRequest(null)}
            onAccept={(r) => {
              setDetailRequest(null);
              setActiveRequest(r);
            }}
          />

          {/* Accept-with-test dialog */}
          <AcceptDialog request={activeRequest} onClose={() => setActiveRequest(null)} />
        </TabsContent>

        {/* Tab 2: Trials (yêu cầu học thử) */}
        <TabsContent value="trials" className="mt-4">
          {trialsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải yêu cầu...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {trials.map((t: TrialItem) => {
                const requestedDate = t.requestedAt ? new Date(t.requestedAt).toLocaleString("vi-VN") : "";
                return (
                  <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                      <img src={PLACEHOLDER_AVATAR} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-foreground">{t.studentName}</p>
                          <span
                            className={cn(
                              "text-[11px] font-medium px-2 py-1 rounded-lg",
                              trialStatusColors[t.status] ?? "bg-muted text-muted-foreground",
                            )}
                          >
                            {trialStatusLabels[t.status] ?? t.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.subjectName} • {requestedDate}
                        </p>
                      </div>
                    </div>
                    {t.note && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.note}</p>}
                    {t.reviewNote && (
                      <div className="mt-2 p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                        <p className="text-xs text-destructive">
                          <strong>Lý do từ chối:</strong> {t.reviewNote}
                        </p>
                      </div>
                    )}
                    {t.feedback && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Phản hồi: {t.feedback}</p>
                        {t.rating != null && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "text-xs",
                                  i < (t.rating ?? 0) ? "text-amber-400" : "text-muted-foreground/30",
                                )}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setSelectedTrial(t.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80"
                      >
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
                          <button
                            onClick={() => setRejectDialog(t.id)}
                            className="px-3 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {trials.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Không có yêu cầu học thử</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Exams (bài test năng lực gia sư) */}
        <TabsContent value="exams" className="mt-4 space-y-6">
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.subject} • {e.questionCount} câu • {e.duration} phút
                    </p>
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
                    <div
                      key={r.id}
                      className={cn(
                        "bg-card border rounded-2xl p-5",
                        passed ? "border-success/30 dark:border-success/40" : "border-destructive/20",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">{r.examTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.submissionDate ? new Date(r.submissionDate).toLocaleDateString("vi-VN") : ""}
                          </p>
                        </div>
                        <div className={cn("text-2xl font-bold", passed ? "text-success" : "text-destructive")}>
                          {pct}%
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-1 rounded-lg",
                            passed
                              ? "bg-emerald-100 text-success dark:bg-emerald-900/30"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {passed ? "✓ Đạt" : "✗ Không đạt"}
                        </span>
                        <button
                          onClick={() => setViewSubmissionId(r.id)}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
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

      <CreatePostDialog open={postOpen} onClose={() => setPostOpen(false)} subjects={subjects} />

      {/* Trial Detail Dialog */}
      <Dialog open={!!selectedTrial} onOpenChange={() => setSelectedTrial(null)}>
        <DialogContent className="max-w-lg">
          {trialDetail && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết yêu cầu học thử</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <img src={PLACEHOLDER_AVATAR} alt="" className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <p className="text-base font-semibold text-foreground">{trialDetail.studentName}</p>
                    <p className="text-sm text-muted-foreground">{trialDetail.subjectName}</p>
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-lg mt-1 inline-block",
                        trialStatusColors[trialDetail.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {trialStatusLabels[trialDetail.status] ?? trialDetail.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Môn học</span>
                    <span className="font-medium">{trialDetail.subjectName}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block">Ngày yêu cầu</span>
                    <span className="font-medium">
                      {trialDetail.requestedAt ? new Date(trialDetail.requestedAt).toLocaleString("vi-VN") : "—"}
                    </span>
                  </div>
                  {trialDetail.currentLevel && (
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <span className="text-xs text-muted-foreground block">Trình độ</span>
                      <span className="font-medium">{trialDetail.currentLevel}</span>
                    </div>
                  )}
                </div>
                {trialDetail.goals && (
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="text-xs text-muted-foreground block mb-1">Mục tiêu</span>
                    <p className="text-sm font-medium">{trialDetail.goals}</p>
                  </div>
                )}
                {trialDetail.note && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground block mb-1">Ghi chú</span>
                    <p className="text-sm">{trialDetail.note}</p>
                  </div>
                )}
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

      {/* Reject trial dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu học thử</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Vui lòng nêu lý do từ chối để phụ huynh hiểu.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm h-24 resize-none"
              placeholder="Lý do từ chối..."
            />
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectTrial.isPending}
              className="w-full py-2.5 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50"
            >
              Xác nhận từ chối
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutor-test taking dialog */}
      <Dialog open={selectedExamId != null} onOpenChange={() => closeTest()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExamId != null && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Bài kiểm tra{examDetail ? ` - ${examDetail.title}` : ""}</span>
                  {!testResult && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {answeredCount}/{currentTestQuestions.length}
                    </span>
                  )}
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
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestion(i)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-xs font-semibold border transition-all relative",
                          i === currentQuestion
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-md"
                            : testAnswers[q.id] !== undefined
                              ? "bg-emerald-100 text-emerald-700 border-emerald-400"
                              : "bg-card text-muted-foreground border-border hover:border-primary/50",
                        )}
                      >
                        {i + 1}
                        {testFlagged.has(q.id) && (
                          <Flag className="w-2.5 h-2.5 text-warning absolute -top-1 -right-1" />
                        )}
                      </button>
                    ))}
                  </div>
                  {currentQ && (
                    <div className="p-5 bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Câu {currentQuestion + 1}/{currentTestQuestions.length}
                        </p>
                        <button
                          onClick={() => {
                            const f = new Set(testFlagged);
                            if (f.has(currentQ.id)) f.delete(currentQ.id);
                            else f.add(currentQ.id);
                            setTestFlagged(f);
                          }}
                          className={cn(
                            "flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium",
                            testFlagged.has(currentQ.id) ? "bg-amber-100 text-warning" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Flag className="w-3 h-3" /> {testFlagged.has(currentQ.id) ? "Đã đánh dấu" : "Đánh dấu"}
                        </button>
                      </div>
                      <p className="text-base font-bold text-slate-800 mb-4">{currentQ.content}</p>
                      <div className="space-y-2">
                        {currentQ.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setTestAnswers((prev) => ({ ...prev, [currentQ.id]: oi }))}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border text-sm font-medium transition-all hover:scale-[1.01]",
                              testAnswers[currentQ.id] === oi
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white border-border text-slate-700 hover:border-blue-300",
                            )}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      disabled={currentQuestion === 0}
                      onClick={() => setCurrentQuestion((p) => p - 1)}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" /> Câu trước
                    </button>
                    {currentQuestion < currentTestQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestion((p) => p + 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm shadow hover:shadow-lg transition"
                      >
                        Câu tiếp <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={submitTest}
                        disabled={answeredCount < currentTestQuestions.length || submitExam.isPending}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                      >
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
                          <p className="text-sm text-muted-foreground">
                            {passed ? "🎉 Đạt yêu cầu!" : "😔 Chưa đạt yêu cầu (≥70%)."}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {testResult.correctCount}/{testResult.totalQuestions} câu đúng
                          </p>
                        </div>
                        <button
                          onClick={() => closeTest()}
                          className={cn(
                            "w-full py-3 rounded-xl font-medium",
                            passed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
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
                  <span className={cn("text-2xl font-bold", passedOf(selectedSubmission) ? "text-success" : "text-destructive")}>
                    {percentOf(selectedSubmission)}%
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">Ngày làm</p>
                    <p className="font-medium">
                      {selectedSubmission.submissionDate
                        ? new Date(selectedSubmission.submissionDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">Số câu đúng</p>
                    <p className="font-medium">
                      {selectedSubmission.correctCount}/{selectedSubmission.totalQuestions}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      passedOf(selectedSubmission) ? "bg-success/15 dark:bg-emerald-900/10" : "bg-destructive/5",
                    )}
                  >
                    <p className="text-xs text-muted-foreground">Kết quả</p>
                    <p className="font-medium">{passedOf(selectedSubmission) ? "Đạt" : "Không đạt"}</p>
                  </div>
                </div>
                {selectedSubmission.aiFeedback && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Nhận xét</p>
                    <p className="text-sm">{selectedSubmission.aiFeedback}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail dialog ("Xem chi tiết")
// ---------------------------------------------------------------------------
interface DetailDialogProps {
  request: ClassRequestResponse | null;
  onClose: () => void;
  onAccept: (r: ClassRequestResponse) => void;
}

const DetailDialog = ({ request, onClose, onAccept }: DetailDialogProps) => {
  const open = !!request;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-foreground">
                <span className="w-12 h-12 rounded-xl bg-muted text-foreground font-semibold flex items-center justify-center shrink-0">
                  {(request.studentName?.trim()?.[0] ?? "?").toUpperCase()}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{request.studentName}</span>
                  <span className="mt-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {request.subject}
                    </Badge>
                  </span>
                </span>
              </DialogTitle>
              <DialogDescription>Thông tin chi tiết yêu cầu tìm gia sư</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4 shrink-0" /> Lớp {request.grade}
              </div>
              {request.school && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" /> {request.school}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="w-4 h-4 shrink-0" />
                {request.preferredSchedule || "Linh hoạt"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="w-4 h-4 shrink-0" />
                <span className="font-medium text-foreground">
                  {formatVnd(request.budget)}
                  {request.budget != null ? "/buổi" : ""}
                </span>
              </div>
              {request.durationMonths != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="w-4 h-4 shrink-0" />
                  Học trong {request.durationMonths} tháng
                </div>
              )}
              {request.note && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{request.note}</span>
                </div>
              )}
            </div>

            <Button onClick={() => onAccept(request)} className="w-full rounded-xl">
              Nhận lớp
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Accept flow — AI test gate (class request)
// ---------------------------------------------------------------------------
interface AcceptDialogProps {
  request: ClassRequestResponse | null;
  onClose: () => void;
}

const AcceptDialog = ({ request, onClose }: AcceptDialogProps) => {
  const acceptRequest = useAcceptClassRequest();

  const handlePassed = (attemptId: string) => {
    if (!request) return;
    acceptRequest.mutate(
      { id: request.id, payload: { aiTestAttemptId: attemptId } },
      {
        onSuccess: () => {
          toast.success("Đã nhận lớp thành công!");
          onClose();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Nhận lớp thất bại"),
      },
    );
  };

  return (
    <AiTestDialog
      open={!!request}
      onOpenChange={(o) => !o && onClose()}
      subjectId={request?.subjectId ?? ""}
      subjectName={request?.subject}
      grade={request?.grade}
      onPassed={handlePassed}
      accepting={acceptRequest.isPending}
    />
  );
};

// ---------------------------------------------------------------------------
// Applications to my posts — students who clicked "Đăng ký học"
// ---------------------------------------------------------------------------
const TutorPostApplications = () => {
  const { applications, isLoading } = useTutorPostApplications();
  const acceptApp = useAcceptTutorPostApplication();
  const [active, setActive] = useState<TutorPostApplicationResponse | null>(null);

  const pending = useMemo(
    () => applications.filter((a) => a.status === "pending"),
    [applications],
  );

  const handlePassed = (attemptId: string) => {
    if (!active) return;
    acceptApp.mutate(
      { appId: active.id, payload: { aiTestAttemptId: attemptId } },
      {
        onSuccess: () => {
          toast.success("Đã nhận học sinh thành công!");
          setActive(null);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Nhận học sinh thất bại"),
      },
    );
  };

  if (isLoading || pending.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          Học sinh đăng ký học
          <Badge variant="secondary" className="ml-2">{pending.length}</Badge>
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Học sinh đã đăng ký vào tin của bạn. Làm bài test AI (≥80%) cho đúng môn để nhận.
      </p>

      <div className="space-y-3">
        {pending.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-border p-4 bg-muted/40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-foreground font-semibold shrink-0">
                {(a.studentName?.trim()?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{a.studentName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{a.subject}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
            <Button size="sm" className="rounded-xl shrink-0" onClick={() => setActive(a)}>
              <Sparkles className="w-4 h-4 mr-1.5" /> Làm test & nhận
            </Button>
          </div>
        ))}
      </div>

      <AiTestDialog
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        subjectId={active?.subjectId ?? ""}
        subjectName={active?.subject}
        onPassed={handlePassed}
        accepting={acceptApp.isPending}
      />
    </Card>
  );
};

// ---------------------------------------------------------------------------
// "Đăng tin tìm học sinh" — create-post dialog
// ---------------------------------------------------------------------------
interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  subjects: { id: string; name: string }[];
}

const CreatePostDialog = ({ open, onClose, subjects }: CreatePostDialogProps) => {
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [gradeLevels, setGradeLevels] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const schedule = useWeeklySchedule();
  const [durationMonths, setDurationMonths] = useState("1");
  const [note, setNote] = useState("");

  const createPost = useCreateTutorPost();

  const reset = () => {
    setSubjectId(undefined);
    setGradeLevels("");
    setHourlyRate("");
    schedule.reset();
    setDurationMonths("1");
    setNote("");
  };

  const handleSubmit = () => {
    if (!subjectId) return;
    const duration = Number(durationMonths);
    if (!duration || duration < 1) {
      toast.error("Thời lượng dạy tối thiểu là 1 tháng");
      return;
    }
    createPost.mutate(
      {
        subjectId,
        gradeLevels: gradeLevels.trim() || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        preferredSchedule: schedule.scheduleString || undefined,
        durationMonths: duration,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Đã đăng tin tìm học sinh");
          reset();
          onClose();
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Đăng tin thất bại"),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Megaphone className="w-5 h-5 text-primary" /> Đăng tin tìm học sinh
          </DialogTitle>
          <DialogDescription>
            Đăng tin để học sinh có thể tìm thấy và liên hệ với bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">
              Môn học <span className="text-destructive">*</span>
            </Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn môn học" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Trình độ / Lớp dạy</Label>
            <Input
              value={gradeLevels}
              onChange={(e) => setGradeLevels(e.target.value)}
              placeholder="VD: Lớp 10-12"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Học phí mỗi giờ (VND)</Label>
            <Input
              type="number"
              min={0}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="VD: 150000"
              className="rounded-xl"
            />
          </div>

          <WeeklySchedulePicker
            label="Lịch có thể dạy"
            days={schedule.days}
            times={schedule.times}
            onToggleDay={schedule.toggleDay}
            onChangeTime={schedule.setTime}
          />

          <div className="space-y-1.5">
            <Label className="text-sm">Thời lượng dạy tối thiểu (tháng)</Label>
            <Input
              type="number"
              min={1}
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              placeholder="VD: 1"
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">Cam kết dạy tối thiểu 1 tháng.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Ghi chú</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Giới thiệu ngắn về phương pháp dạy, kinh nghiệm..."
              className="rounded-xl min-h-24"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!subjectId || createPost.isPending}
            className="w-full rounded-xl"
          >
            {createPost.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Plus className="w-4 h-4 mr-2" /> Đăng tin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// "Tin tìm học sinh của tôi" — the tutor's own posts
// ---------------------------------------------------------------------------
const MyTutorPosts = () => {
  const { posts, isLoading } = useMyTutorPosts();
  const closePost = useCloseTutorPost();

  const handleClose = (id: string) => {
    closePost.mutate(id, {
      onSuccess: () => toast.success("Đã đóng tin"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Đóng tin thất bại"),
    });
  };

  if (isLoading) return null;

  return (
    <Card className="rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          Tin tìm học sinh của tôi
        </h2>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Bạn chưa đăng tin nào. Nhấn "Đăng tin tìm học sinh" để học sinh có thể tìm thấy bạn.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border p-4 bg-muted/40 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{p.subject}</Badge>
                  {p.status === "open" ? (
                    <Badge variant="secondary">Đang hiển thị</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Đã đóng
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1 text-sm text-muted-foreground">
                  {p.gradeLevels && (
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 shrink-0" />
                      <span>{p.gradeLevels}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span className="font-medium text-foreground">
                      {formatVnd(p.hourlyRate)}
                      {p.hourlyRate != null ? "/giờ" : ""}
                    </span>
                  </div>
                  {p.preferredSchedule && (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 shrink-0" />
                      <span>{p.preferredSchedule}</span>
                    </div>
                  )}
                  {p.durationMonths != null && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Dạy tối thiểu {p.durationMonths} tháng</span>
                    </div>
                  )}
                  {p.note && (
                    <div className="flex items-start gap-2">
                      <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{p.note}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Đăng ngày {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              {p.status === "open" && (
                <Button
                  onClick={() => handleClose(p.id)}
                  disabled={closePost.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-xl shrink-0"
                >
                  {closePost.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <XCircle className="w-4 h-4 mr-1.5" /> Đóng tin
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// Resolve the filter value to the backend `Subject` query param, which expects
// the Vietnamese subject name (see CLAUDE.md tutor search). The value may be a
// subject id (from the in-page <Select>) or already a subject name (when seeded
// from the `subject` URL param) — handle both.
function resolveSubjectParam(
  subjects: { id: string; name: string }[],
  value: string,
): string | undefined {
  const byId = subjects.find((s) => s.id === value);
  if (byId) return byId.name;
  const byName = subjects.find((s) => s.name === value);
  if (byName) return byName.name;
  return value || undefined;
}

export default TutorFindStudents;
