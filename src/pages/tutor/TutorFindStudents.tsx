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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AiTestDialog } from "@/components/AiTestDialog";
import { useOpenClassRequests, useAcceptClassRequest } from "@/hooks/useClassRequests";
import {
  useCreateTutorPost,
  useMyTutorPosts,
  useCloseTutorPost,
  useTutorPostApplications,
  useAcceptTutorPostApplication,
} from "@/hooks/useTutorPosts";
import { useSubjects } from "@/hooks/useSubjects";
import type { ClassRequestResponse, TutorPostApplicationResponse } from "@/types/api";

const ALL_SUBJECTS = "__all__";

const formatVnd = (v?: number | null) =>
  v == null ? "Thỏa thuận" : `${v.toLocaleString("vi-VN")}đ`;

const TutorFindStudents = () => {
  const [searchParams] = useSearchParams();

  // ---- Filters (seeded once from URL params) -----------------------------
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  // The URL `subject` param carries the subject NAME; the filter state stores
  // either a subject id (from the in-page <Select>) or — when seeded from the
  // URL — the raw name. `resolveSubjectParam` handles both shapes below.
  const [subject, setSubject] = useState(
    () => searchParams.get("subject") ?? ALL_SUBJECTS,
  );
  const gradeParam = searchParams.get("grade");

  // Re-sync filters whenever the URL query changes — e.g. the "Tìm học sinh khác"
  // popup navigates here with new params while we're already on this page.
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setSubject(searchParams.get("subject") ?? ALL_SUBJECTS);
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

      {/* Students who registered on my posts ("đăng ký học") — accept via AI test */}
      <TutorPostApplications />

      {/* My tutor posts ("Tìm học sinh" ads) */}
      <MyTutorPosts />

      <CreatePostDialog open={postOpen} onClose={() => setPostOpen(false)} subjects={subjects} />

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
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {r.studentName}
                    </h3>
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
                  {r.budget != null
                    ? `${r.budget.toLocaleString("vi-VN")}đ/buổi`
                    : "Học phí: thỏa thuận"}
                </div>
              </div>

              {r.note && (
                <div className="mb-3 text-[11px] text-muted-foreground line-clamp-2">
                  {r.note}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setDetailRequest(r)}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
                  onClick={() => setActiveRequest(r)}
                >
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
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [note, setNote] = useState("");

  const createPost = useCreateTutorPost();

  const reset = () => {
    setSubjectId(undefined);
    setGradeLevels("");
    setHourlyRate("");
    setPreferredSchedule("");
    setNote("");
  };

  const handleSubmit = () => {
    if (!subjectId) return;
    createPost.mutate(
      {
        subjectId,
        gradeLevels: gradeLevels.trim() || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        preferredSchedule: preferredSchedule.trim() || undefined,
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

          <div className="space-y-1.5">
            <Label className="text-sm">Lịch có thể dạy</Label>
            <Input
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              placeholder="VD: Tối T2-T6, cuối tuần"
              className="rounded-xl"
            />
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
