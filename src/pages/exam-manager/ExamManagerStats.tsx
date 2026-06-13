import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, TrendingUp, Users, Loader2, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState } from "react";
import { useExamDashboard } from "@/hooks/useDashboard";
import { useExams, useExamStats, useExamAttempts } from "@/hooks/useExams";

const ExamManagerStats = () => {
  const { data: dashboard, isLoading: dashLoading } = useExamDashboard();
  const { exams, isLoading: examsLoading } = useExams();
  // GET /Exams/stats is untyped on the wire; render defensively.
  const { data: stats } = useExamStats();
  const aggregateStats = (stats ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);

  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedExamId, setSelectedExamId] = useState<number | "all">("all");

  const isLoading = dashLoading || examsLoading;

  const subjects = [...new Set(exams.map((e) => e.subject))];
  const filteredExams = selectedSubject === "all" ? exams : exams.filter((e) => e.subject === selectedSubject);

  // Per-subject attempt counts come straight off each exam item.
  const subjectData = subjects.map((s) => {
    const subExams = exams.filter((e) => e.subject === s);
    return { name: s, attempts: subExams.reduce((sum, e) => sum + (e.attempts ?? 0), 0) };
  });

  // Drill into one exam's attempts (GET /Exams/{id}/attempts) when a subject is picked.
  const drillExamId = selectedExamId === "all" ? undefined : selectedExamId;
  const { data: attemptsPage, isLoading: attemptsLoading } = useExamAttempts(drillExamId);
  const attempts = ((attemptsPage?.items ?? []) as Record<string, unknown>[]);

  const totalAttempts =
    num(aggregateStats.totalAttempts) ??
    dashboard?.totalAttempts ??
    filteredExams.reduce((s, e) => s + (e.attempts ?? 0), 0);
  const totalExams = dashboard?.totalExams ?? exams.length;
  const totalQuestions = dashboard?.totalQuestions ?? filteredExams.reduce((s, e) => s + (e.questionCount ?? 0), 0);
  const avgScore = num(aggregateStats.avgScore) ?? dashboard?.avgScore ?? 0;

  // TODO(BE): type /Exams/stats + add score-distribution/time-series
  const scoreDistribution: { name: string; value: number }[] = [];
  const monthlyTrend: { month: string; attempts: number }[] = [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải thống kê...
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={selectedSubject}
          onValueChange={(v) => {
            setSelectedSubject(v);
            setSelectedExamId("all");
          }}
        >
          <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả môn</SelectItem>
            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(selectedExamId)} onValueChange={(v) => setSelectedExamId(v === "all" ? "all" : Number(v))}>
          <SelectTrigger className="w-56 rounded-xl"><SelectValue placeholder="Chọn đề thi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả đề thi</SelectItem>
            {filteredExams.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng lượt thi", value: totalAttempts.toLocaleString("vi-VN"), icon: FileText },
          { label: "Tổng đề thi", value: totalExams.toLocaleString("vi-VN"), icon: BookOpen },
          { label: "Tổng câu hỏi", value: totalQuestions.toLocaleString("vi-VN"), icon: Users },
          { label: "Điểm TB", value: avgScore.toFixed(1), icon: TrendingUp },
        ].map((s, i) => (
          <Card key={s.label} className="border-0 text-white shadow-lg" style={{ backgroundImage: ["linear-gradient(to right, #2563eb, #3b82f6)", "linear-gradient(to right, #10b981, #14b8a6)", "linear-gradient(to right, #f59e0b, #f97316)", "linear-gradient(to right, #a855f7, #d946ef)"][i % 4] }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-white/80 mt-1">{s.label}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Lượt thi theo môn</CardTitle></CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="attempts" name="Lượt thi" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Phân bố điểm</CardTitle></CardHeader>
          <CardContent>
            {/* TODO(BE): type /Exams/stats + add score-distribution/time-series */}
            {scoreDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượt" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Số đề thi theo môn</CardTitle></CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjects.map((s) => ({ name: s, count: exams.filter((e) => e.subject === s).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số đề" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base">Lượt thi theo thời gian</CardTitle></CardHeader>
          <CardContent>
            {/* TODO(BE): type /Exams/stats + add score-distribution/time-series */}
            {monthlyTrend.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attempts" stroke="hsl(var(--chart-1))" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="text-base">Lịch sử thi gần đây</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {drillExamId == null ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Chọn một đề thi để xem lịch sử thi</div>
          ) : attemptsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải lịch sử...
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Chưa có dữ liệu</div>
          ) : (
            attempts.map((a, i) => {
              const studentName = (a.studentName ?? a.userName ?? a.fullname) as string | undefined;
              const score = num(a.score);
              const completedAt = (a.completedAt ?? a.submittedAt ?? a.createdAt) as string | undefined;
              return (
                <div key={(a.id as string | number) ?? i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{studentName ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${(score ?? 0) >= 5 ? "text-success" : "text-red-600"}`}>
                      {score != null ? `${score} điểm` : "—"}
                    </p>
                    {completedAt && <p className="text-[10px] text-muted-foreground">{completedAt}</p>}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamManagerStats;
