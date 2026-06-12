import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useGenerateExamWithAi } from "@/hooks/useExams";

interface Props {
  /** Pre-select + lock a subject (e.g. a tutor creating an exercise for a class). */
  defaultSubjectId?: string;
  triggerLabel?: string;
  buttonVariant?: "default" | "outline";
  onCreated?: (examId: number) => void;
}

// Shared "Tạo đề/bài tập bằng AI" dialog — used by exam-manager (question bank) and tutors.
export function GenerateExamWithAiDialog({ defaultSubjectId, triggerLabel = "Tạo đề bằng AI", buttonVariant = "outline", onCreated }: Props) {
  const { toast } = useToast();
  const { subjects } = useSubjects();
  const generate = useGenerateExamWithAi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subjectId: defaultSubjectId ?? "",
    title: "",
    topic: "",
    grade: "",
    difficulty: "medium",
    questionCount: "10",
    duration: "30",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.subjectId || !form.title.trim()) {
      toast({ title: "Vui lòng chọn môn học và nhập tiêu đề", variant: "destructive" });
      return;
    }
    generate.mutate(
      {
        subjectId: form.subjectId,
        title: form.title.trim(),
        topic: form.topic.trim() || undefined,
        grade: form.grade ? Number(form.grade) : null,
        difficulty: form.difficulty,
        questionCount: Math.max(1, Math.min(50, Number(form.questionCount) || 10)),
        duration: Math.max(5, Math.min(240, Number(form.duration) || 30)),
      },
      {
        onSuccess: (exam) => {
          toast({ title: "Đã tạo đề bằng AI", description: `"${exam.title}" với ${exam.questions?.length ?? 0} câu hỏi.` });
          setOpen(false);
          setForm((p) => ({ ...p, title: "", topic: "" }));
          onCreated?.(exam.id);
        },
        onError: () => toast({ title: "Tạo đề bằng AI thất bại", variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="rounded-xl">
          <Sparkles className="w-4 h-4 mr-1" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Tạo đề/bài tập bằng AI</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tiêu đề</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="VD: Bài tập Hàm số lớp 12" className="rounded-xl mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Môn học</Label>
              <Select value={form.subjectId} onValueChange={(v) => set("subjectId", v)} disabled={!!defaultSubjectId}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lớp (tuỳ chọn)</Label>
              <Input type="number" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="VD: 12" className="rounded-xl mt-1" />
            </div>
          </div>
          <div>
            <Label>Chủ đề (tuỳ chọn)</Label>
            <Input value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="VD: Đạo hàm, giới hạn" className="rounded-xl mt-1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Độ khó</Label>
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Số câu</Label>
              <Input type="number" value={form.questionCount} onChange={(e) => set("questionCount", e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Phút</Label>
              <Input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} className="rounded-xl mt-1" />
            </div>
          </div>
          <Button onClick={submit} disabled={generate.isPending} className="w-full rounded-xl mt-1">
            {generate.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Đang tạo…</> : <><Sparkles className="w-4 h-4 mr-1" /> Tạo bằng AI</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
