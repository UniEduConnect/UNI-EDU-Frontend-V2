import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, CalendarDays, Wallet, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateClassRequest, useMyClassRequests } from "@/hooks/useClassRequests";
import { useSubjects } from "@/hooks/useSubjects";
import type { ClassRequestResponse } from "@/types/api";

// Weekday chips for the "desired schedule" picker (Mon-first, Sunday last).
const SCHEDULE_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

type DaySlot = { from: string; to: string };

/** Serialize picked days + per-day time ranges, e.g. "T2 19:00-21:00, T5 18:00-20:00". */
function buildSchedule(days: string[], times: Record<string, DaySlot>): string {
  return SCHEDULE_DAYS.filter((d) => days.includes(d))
    .map((d) => {
      const { from = "", to = "" } = times[d] ?? {};
      if (from && to) return `${d} ${from}-${to}`;
      if (from) return `${d} ${from}`;
      return d;
    })
    .join(", ");
}

function requestStatusMeta(status: string) {
  if (status === "assigned")
    return {
      label: "Đã có gia sư",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  if (status === "cancelled")
    return { label: "Đã hủy", className: "bg-muted text-muted-foreground" };
  return {
    label: "Đang tìm",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };
}

/**
 * Self-contained "find a tutor" panel: the "Đăng tìm gia sư" button, its create dialog,
 * and the student's own request list. Rendered on the "GS tìm học sinh" page.
 */
export default function PostTutorRequest() {
  const { subjects } = useSubjects();
  const { requests: myRequests } = useMyClassRequests();
  const createRequest = useCreateClassRequest();

  const [requestOpen, setRequestOpen] = useState(false);
  const [reqSubjectId, setReqSubjectId] = useState("");
  const [reqGrade, setReqGrade] = useState("");
  const [reqDays, setReqDays] = useState<string[]>([]);
  const [reqTimes, setReqTimes] = useState<Record<string, DaySlot>>({});
  const [reqBudget, setReqBudget] = useState("");
  const [reqDuration, setReqDuration] = useState("3");
  const [reqNote, setReqNote] = useState("");

  const toggleReqDay = (day: string) => {
    setReqDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    setReqTimes((prev) => {
      if (prev[day]) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: { from: "", to: "" } };
    });
  };

  const setDayTime = (day: string, key: keyof DaySlot, value: string) =>
    setReqTimes((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { from: "", to: "" }), [key]: value },
    }));

  const resetRequestForm = () => {
    setReqSubjectId("");
    setReqGrade("");
    setReqDays([]);
    setReqTimes({});
    setReqBudget("");
    setReqDuration("3");
    setReqNote("");
  };

  const handleSubmitRequest = () => {
    if (!reqSubjectId || !reqGrade) {
      toast.error("Vui lòng chọn môn học và nhập khối lớp");
      return;
    }
    const duration = Number(reqDuration);
    if (!duration || duration < 3) {
      toast.error("Thời lượng học tối thiểu là 3 tháng");
      return;
    }
    createRequest.mutate(
      {
        subjectId: reqSubjectId,
        grade: Number(reqGrade),
        preferredSchedule: buildSchedule(reqDays, reqTimes) || undefined,
        budget: reqBudget ? Number(reqBudget) : undefined,
        durationMonths: duration,
        note: reqNote || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Đã đăng yêu cầu tìm gia sư");
          setRequestOpen(false);
          resetRequestForm();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Đăng yêu cầu thất bại"),
      },
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserPlus className="h-4 w-4 text-primary" />
          Yêu cầu tìm gia sư của tôi
          {myRequests.length > 0 && <span className="text-muted-foreground">({myRequests.length})</span>}
        </h3>
        <Button onClick={() => setRequestOpen(true)} className="rounded-2xl" size="sm">
          <UserPlus className="mr-2 h-4 w-4" /> Đăng tìm gia sư
        </Button>
      </div>

      {myRequests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Bạn chưa đăng yêu cầu nào. Nhấn "Đăng tìm gia sư" để bắt đầu.
        </p>
      ) : (
        <div className="space-y-3">
          {myRequests.map((r: ClassRequestResponse) => {
            const meta = requestStatusMeta(r.status);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {r.subject} • Lớp {r.grade}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {r.preferredSchedule && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {r.preferredSchedule}
                        </span>
                      )}
                      {r.budget != null && (
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="h-3 w-3" /> {r.budget.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                      {r.durationMonths != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Học trong {r.durationMonths} tháng
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Ngày tạo:{" "}
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {r.status === "assigned" && r.assignedTutorName && (
                      <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                        Gia sư: {r.assignedTutorName}
                      </p>
                    )}
                  </div>

                  <Badge className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium", meta.className)}>
                    {meta.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post "looking for a tutor" request */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đăng tìm gia sư</DialogTitle>
            <DialogDescription>
              Mô tả nhu cầu học của bạn. Gia sư phù hợp sẽ xem và nhận yêu cầu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Môn học</Label>
              <Select value={reqSubjectId} onValueChange={setReqSubjectId}>
                <SelectTrigger className="rounded-2xl">
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
              <Label>Khối lớp</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={reqGrade}
                onChange={(e) => setReqGrade(e.target.value)}
                placeholder="VD: 10"
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Lịch học mong muốn</Label>
              <div className="flex flex-wrap gap-1.5">
                {SCHEDULE_DAYS.map((d) => {
                  const active = reqDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleReqDay(d)}
                      className={cn(
                        "h-9 min-w-[2.75rem] rounded-xl border px-2 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              {SCHEDULE_DAYS.filter((d) => reqDays.includes(d)).map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                    {d}
                  </span>
                  <div className="relative flex-1">
                    <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="time"
                      aria-label={`Giờ bắt đầu ${d}`}
                      value={reqTimes[d]?.from ?? ""}
                      onChange={(e) => setDayTime(d, "from", e.target.value)}
                      className="h-9 rounded-xl pl-8 text-sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">đến</span>
                  <div className="relative flex-1">
                    <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="time"
                      aria-label={`Giờ kết thúc ${d}`}
                      value={reqTimes[d]?.to ?? ""}
                      onChange={(e) => setDayTime(d, "to", e.target.value)}
                      className="h-9 rounded-xl pl-8 text-sm"
                    />
                  </div>
                </div>
              ))}
              {reqDays.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Lịch đã chọn:{" "}
                  <span className="font-medium text-foreground">{buildSchedule(reqDays, reqTimes)}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Ngân sách (VND / buổi)</Label>
              <Input
                type="number"
                min={0}
                value={reqBudget}
                onChange={(e) => setReqBudget(e.target.value)}
                placeholder="VD: 200000"
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Thời lượng học (tháng)</Label>
              <Input
                type="number"
                min={3}
                value={reqDuration}
                onChange={(e) => setReqDuration(e.target.value)}
                placeholder="VD: 3"
                className="rounded-2xl"
              />
              <p className="text-[11px] text-muted-foreground">Cam kết học tối thiểu 3 tháng.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                placeholder="Mô tả thêm về mục tiêu, trình độ hiện tại..."
                className="min-h-24 rounded-2xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setRequestOpen(false)}
              disabled={createRequest.isPending}
            >
              Hủy
            </Button>
            <Button className="rounded-2xl" onClick={handleSubmitRequest} disabled={createRequest.isPending}>
              {createRequest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng...
                </>
              ) : (
                "Đăng yêu cầu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
