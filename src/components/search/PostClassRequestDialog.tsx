import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubjects } from "@/hooks/useSubjects";
import { useCreateClassRequest } from "@/hooks/useClassRequests";
import { useParentChildren } from "@/hooks/useParentChildren";
import { useAuth } from "@/contexts/AuthContext";

interface PostClassRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Đăng bài tìm gia sư" — a student (or a parent on behalf of a linked child)
 * posts a ClassRequest. Only tutors see these posts.
 */
export function PostClassRequestDialog({ open, onOpenChange }: PostClassRequestDialogProps) {
  const { role } = useAuth();
  const isParent = role === "parent";

  const { subjects } = useSubjects();
  const { children } = useParentChildren({ enabled: isParent && open });
  const createRequest = useCreateClassRequest();

  const [childId, setChildId] = useState<string | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [grade, setGrade] = useState<string>("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setChildId(undefined);
    setSubjectId(undefined);
    setGrade("");
    setPreferredSchedule("");
    setBudget("");
    setNote("");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  // When a parent picks a child, default the grade to that child's grade.
  useEffect(() => {
    if (!childId) return;
    const child = children.find((c) => c.id === childId);
    if (child?.grade) setGrade(String(child.grade));
  }, [childId, children]);

  const canSubmit =
    !!subjectId &&
    !!grade &&
    Number(grade) >= 1 &&
    Number(grade) <= 12 &&
    (!isParent || !!childId);

  const handleSubmit = () => {
    if (!canSubmit || !subjectId) return;
    createRequest.mutate(
      {
        subjectId,
        grade: Number(grade),
        preferredSchedule: preferredSchedule.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        note: note.trim() || undefined,
        ...(isParent && childId ? { studentId: childId } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Đã đăng bài tìm gia sư! Gia sư sẽ thấy và liên hệ với bạn.");
          onOpenChange(false);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Đăng bài thất bại"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Megaphone className="w-5 h-5 text-primary" /> Đăng bài tìm gia sư
          </DialogTitle>
          <DialogDescription>
            Không tìm thấy gia sư phù hợp? Đăng bài để gia sư chủ động liên hệ với bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isParent && (
            <div className="space-y-1.5">
              <Label className="text-sm">
                Đăng cho con <span className="text-destructive">*</span>
              </Label>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
                  Bạn chưa liên kết với con nào. Vào trang "Con của tôi" để liên kết trước.
                </p>
              ) : (
                <Select value={childId} onValueChange={setChildId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn con" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName} {c.grade ? `— Lớp ${c.grade}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

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
            <Label className="text-sm">
              Lớp <span className="text-destructive">*</span>
            </Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Lớp {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Lịch học mong muốn</Label>
            <Input
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              placeholder="VD: Tối T2-T6, cuối tuần"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Học phí mong muốn / buổi (VND)</Label>
            <Input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="VD: 150000"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Ghi chú</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mô tả nhu cầu: mục tiêu, trình độ hiện tại, yêu cầu về gia sư..."
              className="rounded-xl min-h-24"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createRequest.isPending}
            className="w-full rounded-xl"
          >
            {createRequest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Plus className="w-4 h-4 mr-2" /> Đăng bài
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PostClassRequestDialog;
