import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useGenerateAiTest, useSubmitAiTest } from "@/hooks/useAiTests";
import type { AiTestResponse, AiTestResultResponse } from "@/types/api";
import { toast } from "sonner";

interface AiTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  /** Optional subject label for the header before the test loads. */
  subjectName?: string;
  /** Grade/class level of the class being applied for — levels the AI test. */
  grade?: number;
  /** Called with the passing attempt id once the tutor scores >= threshold. */
  onPassed: (attemptId: string) => void;
  /** Whether the parent accept-mutation is in flight (disables the confirm button). */
  accepting?: boolean;
}

/**
 * Reusable AI qualification test. The tutor must score >= passThreshold (80%)
 * for the given subject before they can accept a class request / student.
 * Questions + grading are server-authoritative; we only send the chosen indices.
 */
export function AiTestDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  grade,
  onPassed,
  accepting = false,
}: AiTestDialogProps) {
  const generate = useGenerateAiTest();
  const submit = useSubmitAiTest();

  const [test, setTest] = useState<AiTestResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AiTestResultResponse | null>(null);

  // Generate a fresh test each time the dialog opens for a subject.
  useEffect(() => {
    if (!open || !subjectId) return;
    setTest(null);
    setAnswers({});
    setResult(null);
    generate.mutate({ subjectId, grade }, {
      onSuccess: (data) => setTest(data),
      onError: () => toast.error("Không tạo được bài test. Vui lòng thử lại."),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subjectId, grade]);

  const total = test?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = total > 0 && answeredCount === total;
  const threshold = test?.passThreshold ?? result?.passThreshold ?? 80;

  const handleSubmit = () => {
    if (!test || !allAnswered) return;
    const ordered = test.questions.map((q) => answers[q.index]);
    submit.mutate(
      { attemptId: test.attemptId, answers: ordered },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.passed) toast.success(`Đạt ${data.score}% — bạn đủ điều kiện nhận!`);
          else toast.error(`Chỉ đạt ${data.score}% (cần ≥${data.passThreshold}%). Hãy thử lại.`);
        },
        onError: () => toast.error("Nộp bài thất bại. Vui lòng thử lại."),
      }
    );
  };

  const retry = () => {
    setTest(null);
    setAnswers({});
    setResult(null);
    generate.mutate({ subjectId, grade }, {
      onSuccess: (data) => setTest(data),
      onError: () => toast.error("Không tạo được bài test. Vui lòng thử lại."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bài test năng lực {test?.subject || subjectName ? `— ${test?.subject ?? subjectName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Bạn cần đạt tối thiểu <span className="font-semibold text-foreground">{threshold}%</span> để được nhận lớp.
            Đề được tạo bằng AI cho đúng môn này{grade ? `, lớp ${grade}` : ""}.
          </DialogDescription>
        </DialogHeader>

        {/* Loading */}
        {generate.isPending && !test && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Đang tạo đề thi bằng AI…</p>
          </div>
        )}

        {/* Result screen */}
        {result && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            {result.passed ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
            <div>
              <p className="text-3xl font-bold text-foreground">{result.score}%</p>
              <p className="text-muted-foreground">
                Đúng {result.correctCount}/{result.total} câu — cần ≥{result.passThreshold}%
              </p>
            </div>
            {result.passed ? (
              <p className="text-emerald-600 font-medium">Chúc mừng! Bạn đủ điều kiện nhận lớp.</p>
            ) : (
              <p className="text-destructive font-medium">Chưa đạt. Bạn có thể làm lại với đề mới.</p>
            )}
          </div>
        )}

        {/* Questions */}
        {test && !result && (
          <div className="space-y-6 py-2">
            <div className="space-y-1">
              <Progress value={(answeredCount / Math.max(total, 1)) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {answeredCount}/{total} câu đã trả lời
              </p>
            </div>

            {test.questions.map((q) => (
              <div key={q.index} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-foreground mb-3">
                  Câu {q.index + 1}. {q.content}
                </p>
                <RadioGroup
                  value={answers[q.index]?.toString() ?? ""}
                  onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.index]: Number(v) }))}
                  className="space-y-2"
                >
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <RadioGroupItem value={oi.toString()} id={`q${q.index}-o${oi}`} />
                      <Label htmlFor={`q${q.index}-o${oi}`} className="font-normal cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!result && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button onClick={handleSubmit} disabled={!allAnswered || submit.isPending}>
                {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Nộp bài
              </Button>
            </>
          )}
          {result && !result.passed && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button onClick={retry} disabled={generate.isPending}>
                {generate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Làm lại đề mới
              </Button>
            </>
          )}
          {result && result.passed && (
            <Button onClick={() => onPassed(result.attemptId)} disabled={accepting}>
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận nhận lớp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AiTestDialog;
