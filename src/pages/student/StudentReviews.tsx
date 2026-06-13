import { Star, MessageSquare, Loader2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ReviewDialog from "@/components/ReviewDialog";
import { useMySchedule } from "@/hooks/useSchedule";
import { useClasses, useCreateClassReview } from "@/hooks/useClasses";
import { useRateSession } from "@/hooks/useSessions";
import type { ClassItem } from "@/types/api";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const formatTime = (startIso: string, endIso: string) => {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${new Date(startIso).toLocaleTimeString("vi-VN", opts)} - ${new Date(endIso).toLocaleTimeString("vi-VN", opts)}`;
};

const StudentReviews = () => {
  const { sessions, isLoading } = useMySchedule();
  const { classes } = useClasses();
  const rateSession = useRateSession();
  const createClassReview = useCreateClassReview();

  // Class/tutor review (the one that feeds the tutor's public profile rating).
  const [classReview, setClassReview] = useState<{
    open: boolean;
    classId: string;
    tutorName: string;
    className: string;
    subject: string;
  }>({ open: false, classId: "", tutorName: "", className: "", subject: "" });

  const handleSubmitClassReview = (rating: number, comment: string) => {
    createClassReview.mutate(
      { classId: classReview.classId, payload: { rating, comment } },
      {
        onSuccess: () => {
          toast.success("Đã gửi đánh giá gia sư!");
          setClassReview(prev => ({ ...prev, open: false }));
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Không gửi được đánh giá (có thể bạn đã đánh giá lớp này)."),
      }
    );
  };

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    sessionId: string;
    tutorName: string;
    className: string;
    subject: string;
    sessionDate: string;
  }>({ open: false, sessionId: "", tutorName: "", className: "", subject: "", sessionDate: "" });

  // TODO(BE): include className/tutorName on GET /me/sessions
  const classMap = useMemo(() => {
    const m = new Map<string, ClassItem>();
    classes.forEach(c => m.set(c.id, c));
    return m;
  }, [classes]);

  // All completed sessions, joined with their class for labels.
  const allSessions = useMemo(
    () =>
      sessions
        .filter(s => s.status === "completed")
        .map(s => {
          const cls = classMap.get(s.classId);
          return {
            id: s.id,
            classId: s.classId,
            rating: s.rating,
            ratingComment: s.ratingComment,
            content: s.content,
            date: formatDate(s.startAt),
            time: formatTime(s.startAt, s.endAt),
            className: cls?.name ?? "Lớp học",
            subject: cls?.subject ?? "",
            tutorName: cls?.tutorName ?? "Gia sư",
            tutorAvatar: cls?.tutorAvatar ?? "",
          };
        }),
    [sessions, classMap]
  );

  const reviewedSessions = allSessions.filter(s => s.rating != null);
  const unreviewedSessions = allSessions.filter(s => s.rating == null);

  const handleOpenReview = (session: typeof allSessions[0]) => {
    setReviewDialog({
      open: true,
      sessionId: session.id,
      tutorName: session.tutorName,
      className: session.className,
      subject: session.subject,
      sessionDate: session.date,
    });
  };

  const handleSubmitReview = (rating: number, comment: string) => {
    rateSession.mutate({ id: reviewDialog.sessionId, payload: { rating, comment } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải buổi học...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{allSessions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng buổi hoàn thành</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-primary">{reviewedSessions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Đã đánh giá</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-warning">{unreviewedSessions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Chưa đánh giá</p>
        </div>
      </div>

      {allSessions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Bạn chưa có buổi học nào hoàn thành.
        </p>
      )}

      {/* Đánh giá gia sư (class review — shows on the tutor's public profile) */}
      {classes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Đánh giá gia sư
          </h3>
          <div className="space-y-2">
            {classes.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={c.tutorAvatar || undefined} alt="" className="w-9 h-9 rounded-full object-cover bg-muted" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.tutorName}</p>
                    <p className="text-xs text-muted-foreground">{c.name} • {c.subject}</p>
                  </div>
                </div>
                <button
                  onClick={() => setClassReview({ open: true, classId: c.id, tutorName: c.tutorName, className: c.name, subject: c.subject })}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Đánh giá gia sư
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unreviewed sessions */}
      {unreviewedSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Buổi chưa đánh giá ({unreviewedSessions.length})
          </h3>
          <div className="space-y-2">
            {unreviewedSessions.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={s.tutorAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.className}</p>
                    <p className="text-xs text-muted-foreground">{s.tutorName} • {s.date} • {s.time}</p>
                    {s.content && <p className="text-xs text-muted-foreground/70 mt-0.5">Nội dung: {s.content}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenReview(s)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Đánh giá
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed sessions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> Đánh giá đã gửi ({reviewedSessions.length})
        </h3>
        <div className="space-y-2">
          {reviewedSessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Bạn chưa đánh giá buổi học nào.</p>
          )}
          {reviewedSessions.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={s.tutorAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.className}</p>
                    <p className="text-xs text-muted-foreground">{s.tutorName} • {s.date} • {s.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-3.5 h-3.5", i < (s.rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
                  ))}
                </div>
              </div>
              {s.ratingComment && (
                <p className="text-sm text-muted-foreground mt-2 ml-12">{s.ratingComment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <ReviewDialog
        open={reviewDialog.open}
        onOpenChange={open => setReviewDialog(prev => ({ ...prev, open }))}
        tutorName={reviewDialog.tutorName}
        className={reviewDialog.className}
        subject={reviewDialog.subject}
        sessionDate={reviewDialog.sessionDate}
        onSubmit={handleSubmitReview}
      />

      {/* Class/tutor review dialog */}
      <ReviewDialog
        open={classReview.open}
        onOpenChange={open => setClassReview(prev => ({ ...prev, open }))}
        tutorName={classReview.tutorName}
        className={classReview.className}
        subject={classReview.subject}
        sessionDate=""
        onSubmit={handleSubmitClassReview}
      />
    </div>
  );
};

export default StudentReviews;
