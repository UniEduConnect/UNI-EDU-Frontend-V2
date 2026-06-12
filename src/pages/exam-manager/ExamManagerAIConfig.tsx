import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, ShieldCheck, Sparkles, AlertTriangle, Users, FileText, Clock, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useExams, useExamAiConfig, useUpdateExamAiConfig, useUpdateExam } from "@/hooks/useExams";
import { getExam } from "@/services/exams";
import type { ExamAiConfig, ExamListItemResponse } from "@/types/api";

const difficultyLabels: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

// PUT /Exams/{id} expects a full UpdateExamRequest, so rebuild it from the listing
// row. `description` isn't on the list item, so the caller fetches it first and
// passes it in — otherwise toggling proctoring would blank the exam description.
const toUpdatePayload = (e: ExamListItemResponse, patch: Partial<ExamListItemResponse>, description: string) => ({
  subjectId: e.subjectId,
  title: e.title,
  description,
  duration: e.duration,
  type: e.type,
  status: e.status,
  difficulty: e.difficulty,
  fee: e.fee,
  year: e.year,
  startDate: e.startDate ?? null,
  endDate: e.endDate ?? null,
  maxAttemptsPerUser: e.maxAttemptsPerUser,
  scoreScale: e.scoreScale,
  aiProctoring: e.aiProctoring,
  ...patch,
});

const ExamManagerAIConfig = () => {
  const { toast } = useToast();
  const { exams, isLoading: examsLoading } = useExams();
  const { data: aiConfig, isLoading: configLoading } = useExamAiConfig();
  const updateAiConfig = useUpdateExamAiConfig();
  const updateExam = useUpdateExam();

  // Fetch the full exam (for its description) before the per-exam proctoring toggle,
  // so PUT /Exams/{id} doesn't wipe the description.
  const handleToggleProctoring = async (exam: ExamListItemResponse, v: boolean) => {
    let description = "";
    try {
      description = (await getExam(exam.id)).description ?? "";
    } catch {
      /* keep empty if the detail fetch fails */
    }
    updateExam.mutate(
      { id: exam.id, payload: toUpdatePayload(exam, { aiProctoring: v }, description) },
      {
        onSuccess: () => toast({ title: "Đã cập nhật proctoring cho đề thi" }),
        onError: () => toast({ title: "Cập nhật thất bại", variant: "destructive" }),
      },
    );
  };

  const [selectedExam, setSelectedExam] = useState<string>("");
  const [topicRatio, setTopicRatio] = useState([30, 25, 20, 15, 10]);
  const [form, setForm] = useState<ExamAiConfig | null>(null);

  // Seed the local form from the fetched global AI config.
  useEffect(() => {
    if (aiConfig) setForm(aiConfig);
  }, [aiConfig]);

  // Default the exam selector once exams load.
  useEffect(() => {
    if (!selectedExam && exams.length > 0) setSelectedExam(String(exams[0].id));
  }, [exams, selectedExam]);

  const topics = ["Hàm số", "Tích phân", "Xác suất", "Hình học", "Đại số"];
  const exam = exams.find(e => String(e.id) === selectedExam);

  const saveConfig = (partial: Partial<ExamAiConfig>) => {
    updateAiConfig.mutate(partial, {
      onSuccess: () => toast({ title: "Đã lưu cấu hình AI" }),
      onError: () => toast({ title: "Lưu cấu hình thất bại", variant: "destructive" }),
    });
  };

  if (examsLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải cấu hình AI...
      </div>
    );
  }

  if (!exam || !form) return <div className="p-6"><p className="text-muted-foreground">Chưa có đề thi nào</p></div>;

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="w-80 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{exams.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Lượt thi", value: exam.attempts, icon: Users, gradient: "linear-gradient(to right, #2563eb, #3b82f6)" },
          { label: "Số câu hỏi", value: exam.questionCount, icon: FileText, gradient: "linear-gradient(to right, #10b981, #14b8a6)" },
          { label: "Thời lượng", value: `${exam.duration}'`, icon: Clock, gradient: "linear-gradient(to right, #f59e0b, #f97316)" },
          { label: "Học phí", value: `${(exam.fee / 1000).toFixed(0)}K`, icon: BarChart3, gradient: "linear-gradient(to right, #a855f7, #d946ef)" },
        ].map((s, i) => (
          <Card key={i} className="border-0 text-white shadow-lg" style={{ backgroundImage: s.gradient }}>
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
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Chế độ AI Generate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {([true, false] as const).map(mode => (
                <button key={String(mode)} onClick={() => setForm({ ...form, autoGenerateEnabled: mode })}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${form.autoGenerateEnabled === mode ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <p className="text-sm font-medium text-foreground">{mode ? "Tự động generate mỗi lượt" : "Bộ đề cố định"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mode ? "Mỗi lần thi hệ thống sẽ generate đề mới từ ngân hàng câu hỏi" : "Sử dụng bộ đề đã soạn sẵn, không thay đổi giữa các lượt"}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Cấu hình độ khó</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(["easy", "medium", "hard"] as const).map(d => (
                <button key={d} onClick={() => setForm({ ...form, defaultDifficulty: d })}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${form.defaultDifficulty === d ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{difficultyLabels[d]}</p>
                    {form.defaultDifficulty === d && <Badge variant="default" className="text-[10px]">Đang chọn</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Tỷ lệ câu hỏi theo chủ đề</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topics.map((t, i) => (
              <div key={t} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{t}</span>
                  <span className="text-xs font-medium text-muted-foreground">{topicRatio[i]}%</span>
                </div>
                <Slider value={[topicRatio[i]]} max={100} step={5} onValueChange={v => { const nr = [...topicRatio]; nr[i] = v[0]; setTopicRatio(nr); }} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Tổng: {topicRatio.reduce((s, v) => s + v, 0)}%</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> AI Proctoring</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">Giám sát chống gian lận (toàn hệ thống)</p>
                <p className="text-xs text-muted-foreground">Phát hiện chuyển tab, chia màn hình, copy/paste</p>
              </div>
              <Switch checked={form.proctoringEnabled} onCheckedChange={v => setForm({ ...form, proctoringEnabled: v })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">Phát hiện khuôn mặt</p>
                <p className="text-xs text-muted-foreground">Xác thực thí sinh qua webcam</p>
              </div>
              <Switch checked={form.faceDetection} onCheckedChange={v => setForm({ ...form, faceDetection: v })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">Bắt buộc toàn màn hình</p>
                <p className="text-xs text-muted-foreground">Thoát fullscreen sẽ bị ghi nhận</p>
              </div>
              <Switch checked={form.fullscreenRequired} onCheckedChange={v => setForm({ ...form, fullscreenRequired: v })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">Chặn copy/paste</p>
                <p className="text-xs text-muted-foreground">Ngăn sao chép nội dung đề thi</p>
              </div>
              <Switch checked={form.copyPasteBlocked} onCheckedChange={v => setForm({ ...form, copyPasteBlocked: v })} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Số lần chuyển tab tối đa</span>
                <span className="text-xs font-medium text-muted-foreground">{form.tabSwitchLimit}</span>
              </div>
              <Slider value={[form.tabSwitchLimit]} max={10} step={1} onValueChange={v => setForm({ ...form, tabSwitchLimit: v[0] })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Bật proctoring cho đề này</p>
                <p className="text-xs text-muted-foreground">Áp dụng riêng cho "{exam.title}"</p>
              </div>
              <Switch
                checked={exam.aiProctoring}
                disabled={updateExam.isPending}
                onCheckedChange={v => handleToggleProctoring(exam, v)}
              />
            </div>
            <Button
              onClick={() => saveConfig(form)}
              disabled={updateAiConfig.isPending}
              className="w-full rounded-xl"
            >
              {updateAiConfig.isPending ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Proctoring Logs */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Log AI Proctoring - Cảnh báo gian lận</CardTitle>
            <Badge variant="destructive" className="text-[10px]">0 cảnh báo cao</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* TODO(BE): proctoring violation logs endpoint not exposed */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thí sinh</TableHead>
                <TableHead>Loại vi phạm</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Đề thi</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Mức độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamManagerAIConfig;
