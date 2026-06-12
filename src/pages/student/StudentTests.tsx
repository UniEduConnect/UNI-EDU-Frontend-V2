import { useMemo, useState } from "react";
import {
  useExams,
  useExam,
  useSubmitExam,
  useMySubmissions,
} from "@/hooks/useExams";
import type { SubmissionResponse } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Search,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Clock3,
  TrendingUp,
  Star,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ITEMS_PER_PAGE = 10;

type TestRunnerState = {
  testId: number;
  answers: Record<number, number>;
  currentIndex: number;
};

const PIE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(160, 84%, 39%)",
  "hsl(32, 95%, 44%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
];

// SubmissionResponse has no `passed` field — compute it client-side.
const percentOf = (s: SubmissionResponse) =>
  s.scoreScale > 0 ? Math.round((s.score / s.scoreScale) * 100) : 0;
const passedOf = (s: SubmissionResponse) => percentOf(s) >= 50;

const StudentTests = () => {
  // Exams API: student-facing exams + this student's submission history.
  const { exams, isLoading: examsLoading } = useExams();
  const tests = useMemo(
    () => exams.filter((e) => e.type === "student-test"),
    [exams]
  );
  const { submissions: examResults, isLoading: resultsLoading } =
    useMySubmissions();

  const [tab, setTab] = useState<"assignments" | "tests" | "results">(
    "assignments"
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [activeTestId, setActiveTestId] = useState<number | null>(null);
  const [testRunner, setTestRunner] = useState<TestRunnerState | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("Tất cả");

  // The exam the runner is loading questions for.
  const { data: runningExam, isLoading: runningExamLoading } = useExam(
    testRunner?.testId
  );
  const submitExam = useSubmitExam();

  const subjects = useMemo(
    () => ["Tất cả", ...Array.from(new Set(examResults.map((r) => r.examTitle)))],
    [examResults]
  );

  const testsFiltered = useMemo(
    () =>
      tests.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.subject.toLowerCase().includes(search.toLowerCase())
      ),
    [search, tests]
  );

  const resultsFiltered = useMemo(
    () =>
      examResults.filter((r) => {
        const matchSearch =
          !search ||
          r.examTitle.toLowerCase().includes(search.toLowerCase());

        const matchSubject =
          subjectFilter === "Tất cả" || r.examTitle === subjectFilter;

        return matchSearch && matchSubject;
      }),
    [examResults, search, subjectFilter]
  );

  const source =
    tab === "tests" ? testsFiltered : tab === "results" ? resultsFiltered : [];

  const pageCount = Math.max(1, Math.ceil(source.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pagedData = source.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalExams = examResults.length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          examResults.reduce((sum, result) => sum + percentOf(result), 0) /
            totalExams
        )
      : 0;

  const passedCount = examResults.filter((r) => passedOf(r)).length;
  const highestScore =
    totalExams > 0 ? Math.max(...examResults.map((r) => percentOf(r))) : 0;

  const runningQuestions = runningExam?.questions ?? [];
  const currentQuestion =
    testRunner != null ? runningQuestions[testRunner.currentIndex] : null;

  const currentOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return currentQuestion.options.map((opt, idx) => ({
      label: String.fromCharCode(65 + idx),
      text: opt,
    }));
  }, [currentQuestion]);

  const handleChangeTab = (
    nextTab: "assignments" | "tests" | "results"
  ) => {
    setTab(nextTab);
    setPage(1);
    setSearch("");
    if (nextTab !== "results") {
      setSubjectFilter("Tất cả");
    }
  };

  const handleStartTest = (testId: number) => {
    if (!cameraEnabled) return;

    setActiveTestId(null);
    setTestRunner({
      testId,
      answers: {},
      currentIndex: 0,
    });
  };

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (!testRunner) return;

    setTestRunner({
      ...testRunner,
      answers: {
        ...testRunner.answers,
        [questionId]: optionIndex,
      },
    });
  };

  const handleFinishTest = () => {
    if (!testRunner || runningQuestions.length === 0) return;

    const examId = testRunner.testId;
    const answers = runningQuestions
      .filter((q) => testRunner.answers[q.id] !== undefined)
      .map((q) => ({ questionId: q.id, selectedOption: testRunner.answers[q.id] }));

    submitExam.mutate(
      { id: examId, payload: { answers } },
      {
        onSuccess: () => {
          setActiveTestId(examId);
          setTestRunner(null);
          setTab("results");
          setPage(1);
          toast.success("Đã nộp bài kiểm tra thành công!");
        },
        onError: () => toast.error("Nộp bài thất bại. Vui lòng thử lại."),
      }
    );
  };

  const answeredCount = testRunner
    ? runningQuestions.filter(
        (q) => testRunner.answers[q.id] !== undefined
      ).length
    : 0;

  const topStats = [
    {
      label: "Bài kiểm tra",
      value: tests.length,
      desc: `${examResults.length} bài đã nộp`,
      icon: ClipboardCheck,
      className: "from-emerald-500 to-teal-500",
    },
    {
      label: "Điểm trung bình",
      value: `${avgScore}%`,
      desc: `${passedCount}/${Math.max(totalExams, 1)} bài đạt`,
      icon: TrendingUp,
      className: "from-amber-500 to-orange-500",
    },
    {
      label: "Điểm cao nhất",
      value: `${highestScore}%`,
      desc: "Kết quả tốt nhất hiện tại",
      icon: Star,
      className: "from-violet-600 to-indigo-700",
    },
  ];

  const scoreBarData = useMemo(
    () =>
      examResults.slice(0, 6).map((item, idx) => ({
        name: `Bài ${idx + 1}`,
        score: percentOf(item),
      })),
    [examResults]
  );

  const subjectPieData = useMemo(() => {
    const grouped = examResults.reduce<Record<string, number>>((acc, item) => {
      acc[item.examTitle] = (acc[item.examTitle] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [examResults]);

  return (
    <div className="px-4 sm:px-6 pt-3 pb-6 space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((item, index) => (
          <div
            key={index}
            className={cn(
              "rounded-3xl bg-gradient-to-r p-5 text-white shadow-sm",
              item.className
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-white/80">{item.label}</p>
                <p className="mt-2 text-3xl font-bold">{item.value}</p>
                <p className="mt-2 text-[11px] text-white/75">{item.desc}</p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <item.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleChangeTab("assignments")}
              className={cn(
                "rounded-2xl px-4 py-2 text-xs font-medium transition-all",
                tab === "assignments"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Bài tập
            </button>

            <button
              onClick={() => handleChangeTab("tests")}
              className={cn(
                "rounded-2xl px-4 py-2 text-xs font-medium transition-all",
                tab === "tests"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Bài kiểm tra
            </button>

            <button
              onClick={() => handleChangeTab("results")}
              className={cn(
                "rounded-2xl px-4 py-2 text-xs font-medium transition-all",
                tab === "results"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Kết quả
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-2xl pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={tab === "results" ? "Tìm kết quả..." : "Tìm bài học..."}
              />
            </div>

            {tab === "results" && (
              <div className="flex gap-2 flex-wrap">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSubjectFilter(subject);
                      setPage(1);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-full text-xs font-medium transition-colors",
                      subjectFilter === subject
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {tab === "tests" && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Bật camera trước khi làm bài kiểm tra</p>
                <p className="text-xs text-muted-foreground">
                  Hệ thống sẽ dùng camera để tăng độ tin cậy cho bài làm.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant={cameraEnabled ? "outline" : "default"}
              className="rounded-2xl"
              onClick={() => setCameraEnabled((v) => !v)}
            >
              {cameraEnabled ? "Đã bật camera" : "Bật camera"}
            </Button>
          </div>
        )}

        {tab === "assignments" && (
          // TODO(BE): student assignments endpoint (only session.homework exists)
          <div className="rounded-3xl border border-dashed border-border bg-card py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
              <BookOpen className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Chưa có dữ liệu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tính năng bài tập đang được phát triển.
            </p>
          </div>
        )}

        {tab === "tests" && (
          <div className="space-y-3">
            {examsLoading ? (
              <div className="flex items-center justify-center py-14 text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải bài kiểm tra...
              </div>
            ) : (
              <>
                {pagedData.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/35 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.subject} • {item.questionCount} câu • {item.duration} phút
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300">
                        {item.difficulty || "Chưa làm"}
                      </Badge>

                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleStartTest(item.id)}
                        disabled={!cameraEnabled}
                      >
                        Làm bài
                      </Button>
                    </div>
                  </div>
                ))}

                {pagedData.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-border bg-card py-14 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                      <Search className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Chưa có dữ liệu
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Thử thay đổi từ khóa tìm kiếm hoặc chuyển tab khác
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "results" && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    Điểm số các bài gần đây
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Biểu đồ cột thể hiện điểm từng bài kiểm tra
                  </p>
                </div>

                <div className="h-[300px]">
                  {scoreBarData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Chưa có dữ liệu
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={scoreBarData}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border/50"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 12,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{
                            fontSize: 12,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="score"
                          radius={[8, 8, 0, 0]}
                          fill="hsl(221, 83%, 53%)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    Tỉ lệ kết quả theo bài
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Biểu đồ tròn phân bổ số lần làm theo từng bài
                  </p>
                </div>

                {subjectPieData.length === 0 ? (
                  <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-[260px] w-full md:w-[260px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subjectPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {subjectPieData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      {subjectPieData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <p className="text-sm font-medium text-foreground">
                              {item.name}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.value} bài
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Chi tiết kết quả
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[11px] text-muted-foreground font-medium p-3">
                        Bài thi
                      </th>
                      <th className="text-center text-[11px] text-muted-foreground font-medium p-3">
                        Điểm
                      </th>
                      <th className="text-center text-[11px] text-muted-foreground font-medium p-3">
                        Đúng
                      </th>
                      <th className="text-center text-[11px] text-muted-foreground font-medium p-3">
                        Ngày
                      </th>
                      <th className="text-center text-[11px] text-muted-foreground font-medium p-3">
                        Kết quả
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedData.map((result: any) => {
                      const pct = percentOf(result);
                      const passed = passedOf(result);
                      return (
                        <tr
                          key={result.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3 text-sm font-medium text-foreground">
                            {result.examTitle}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={cn(
                                "text-sm font-bold",
                                pct >= 50 ? "text-foreground" : "text-destructive"
                              )}
                            >
                              {pct}%
                            </span>
                          </td>
                          <td className="p-3 text-center text-sm text-muted-foreground">
                            {result.correctCount}/{result.totalQuestions}
                          </td>
                          <td className="p-3 text-center text-xs text-muted-foreground">
                            {result.submissionDate
                              ? new Date(result.submissionDate).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              className={cn(
                                "text-[10px]",
                                passed
                                  ? "bg-muted text-foreground"
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {passed ? "Đạt" : "Chưa đạt"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {resultsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải kết quả...
                </div>
              ) : (
                pagedData.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Chưa có dữ liệu
                  </p>
                )
              )}
            </div>
          </>
        )}

        {pageCount > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>

              {Array.from({ length: pageCount }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === idx + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(idx + 1);
                    }}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(pageCount, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {activeTestId != null && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Đã nộp bài kiểm tra thành công cho mã {activeTestId}.
        </div>
      )}

      {/* TODO(BE): exam purchase state, community average score, per-user attempt history not modeled */}

      {testRunner && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {runningExam?.title ?? "Bài kiểm tra"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {runningExam?.subject ?? "—"} • Câu{" "}
                  {Math.min(testRunner.currentIndex + 1, Math.max(runningQuestions.length, 1))}/
                  {runningQuestions.length}
                </p>
              </div>

              <button
                onClick={() => setTestRunner(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {runningExamLoading || !currentQuestion ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                {runningExamLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải bài kiểm tra...
                  </>
                ) : (
                  "Bài kiểm tra này chưa có câu hỏi."
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
                <div className="p-6 space-y-5">
                  <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-primary">
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          Câu {testRunner.currentIndex + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {runningExam?.duration ?? 0} phút
                      </div>
                    </div>

                    <p className="text-sm md:text-base font-medium text-foreground leading-7">
                      {currentQuestion.content}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {currentOptions.map((option, idx) => {
                      const selected =
                        testRunner.answers[currentQuestion.id] === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(currentQuestion.id, idx)}
                          className={cn(
                            "w-full text-left rounded-2xl border p-4 transition-all",
                            selected
                              ? "border-primary bg-primary/8 shadow-sm"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                selected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              {option.label}
                            </div>
                            <p className="text-sm text-foreground leading-6">
                              {option.text}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      disabled={testRunner.currentIndex === 0}
                      onClick={() =>
                        setTestRunner({
                          ...testRunner,
                          currentIndex: Math.max(0, testRunner.currentIndex - 1),
                        })
                      }
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Câu trước
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      Đã trả lời {answeredCount}/{runningQuestions.length} câu
                    </div>

                    {testRunner.currentIndex < runningQuestions.length - 1 ? (
                      <Button
                        className="rounded-2xl"
                        onClick={() =>
                          setTestRunner({
                            ...testRunner,
                            currentIndex: Math.min(
                              runningQuestions.length - 1,
                              testRunner.currentIndex + 1
                            ),
                          })
                        }
                      >
                        Câu tiếp
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleFinishTest}
                        disabled={submitExam.isPending}
                      >
                        Nộp bài
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t lg:border-t-0 lg:border-l border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Danh sách câu hỏi
                  </p>

                  <div className="grid grid-cols-5 gap-2">
                    {runningQuestions.map((q, idx) => {
                      const answered = q.id in testRunner.answers;
                      const active = idx === testRunner.currentIndex;

                      return (
                        <button
                          key={q.id}
                          onClick={() =>
                            setTestRunner({
                              ...testRunner,
                              currentIndex: idx,
                            })
                          }
                          className={cn(
                            "h-10 rounded-xl text-xs font-semibold transition-all",
                            active
                              ? "bg-primary text-primary-foreground"
                              : answered
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Câu hiện tại</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="text-muted-foreground">Đã chọn đáp án</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-muted-foreground">Chưa trả lời</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/20 p-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Giám sát qua camera
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTests;
