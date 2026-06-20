import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Upload, Database, BookOpen, Inbox, AlertTriangle, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuestions, useCreateQuestion, useDeleteQuestion } from "@/hooks/useQuestions";
import { useSubjects } from "@/hooks/useSubjects";

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: { label: "Dễ", className: "bg-emerald-100 text-success" },
  medium: { label: "Trung bình", className: "bg-amber-100 text-warning" },
  hard: { label: "Khó", className: "bg-red-100 text-red-700" },
};

const emptyForm = {
  content: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  topic: "",
  difficulty: "medium",
  standard: "Chuẩn BGDDT 2025",
  subjectId: "",
};

const ExamManagerQuestions = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { subjects } = useSubjects();
  const { questions, isLoading, isError } = useQuestions({
    Search: search || undefined,
    SubjectId: subjectFilter === "all" ? undefined : subjectFilter,
    Difficulty: difficultyFilter === "all" ? undefined : difficultyFilter,
  });
  const createQuestion = useCreateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const topics = useMemo(
    () => [...new Set(questions.map(q => q.topic).filter((t): t is string => !!t))],
    [questions],
  );

  const handleAdd = () => {
    if (!form.content || !form.subjectId || form.options.some(o => !o)) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    createQuestion.mutate(
      {
        subjectId: form.subjectId,
        content: form.content,
        type: "multiple-choice",
        difficulty: form.difficulty,
        options: form.options,
        correctAnswer: form.correctAnswer,
        topic: form.topic || null,
        standard: form.standard || null,
      },
      {
        onSuccess: () => {
          setForm(emptyForm);
          setShowAdd(false);
          toast({ title: "Thêm câu hỏi thành công" });
        },
        onError: () => toast({ title: "Thêm câu hỏi thất bại", variant: "destructive" }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteQuestion.mutate(id, {
      onSuccess: () => toast({ title: "Đã xóa câu hỏi" }),
      onError: () => toast({ title: "Xóa câu hỏi thất bại", variant: "destructive" }),
    });
  };

  const handleImport = () => {
    toast({ title: "Import thành công", description: "Đã thêm 10 câu hỏi từ file" });
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng câu hỏi", value: questions.length, icon: Database, gradient: "linear-gradient(to right, #1d4ed8, #1e3a8a)" },
          { label: "Môn học", value: subjects.length, icon: BookOpen, gradient: "linear-gradient(to right, #1d4ed8, #1e3a8a)" },
          { label: "Chủ đề", value: topics.length, icon: Inbox, gradient: "linear-gradient(to right, #1d4ed8, #1e3a8a)" },
          { label: "Câu hỏi khó", value: questions.filter(q => q.difficulty === "hard").length, icon: AlertTriangle, gradient: "linear-gradient(to right, #1d4ed8, #1e3a8a)" },
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input placeholder="Tìm câu hỏi..." value={search} onChange={e => setSearch(e.target.value)} className="w-56 h-9 text-sm rounded-xl" />
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-32 h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tất cả môn</SelectItem>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-32 h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">TB</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handleImport}><Upload className="w-4 h-4 mr-1" /> Import file</Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 mr-1" /> Thêm câu hỏi</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Thêm câu hỏi mới</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Nội dung câu hỏi</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="rounded-xl mt-1" rows={3} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Môn học</Label>
                    <Select value={form.subjectId} onValueChange={v => setForm(p => ({ ...p, subjectId: v }))}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn môn học" /></SelectTrigger>
                      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Chủ đề</Label><Input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} className="rounded-xl mt-1" placeholder="VD: Hàm số" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Độ khó</Label>
                    <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">Trung bình</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Chuẩn</Label><Input value={form.standard} onChange={e => setForm(p => ({ ...p, standard: e.target.value }))} className="rounded-xl mt-1" /></div>
                </div>
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={form.correctAnswer === i} onChange={() => setForm(p => ({ ...p, correctAnswer: i }))} />
                    <Input value={o} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(p => ({ ...p, options: opts })); }} placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} className="rounded-xl" />
                  </div>
                ))}
                <Button onClick={handleAdd} disabled={createQuestion.isPending} className="w-full rounded-xl">
                  {createQuestion.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Đang thêm...</> : "Thêm câu hỏi"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách câu hỏi...
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tải được danh sách câu hỏi. Vui lòng thử lại.
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tìm thấy câu hỏi phù hợp.
          </div>
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                    <Badge variant="outline" className="text-[10px]">{q.subject}</Badge>
                    {q.topic && <Badge variant="outline" className="text-[10px]">{q.topic}</Badge>}
                    {difficultyConfig[q.difficulty] && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${difficultyConfig[q.difficulty].className}`}>{difficultyConfig[q.difficulty].label}</span>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(q.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
                <p className="text-sm text-foreground mb-2">{q.content}</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((o, i) => (
                    <div key={i} className={`text-xs p-2 rounded-lg ${i === q.correctAnswer ? "bg-success/15 text-success border border-success/30" : "bg-muted/50 text-muted-foreground"}`}>
                      {String.fromCharCode(65 + i)}. {o}
                    </div>
                  ))}
                </div>
                {q.standard && <p className="text-[10px] text-muted-foreground mt-2">{q.standard}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExamManagerQuestions;
