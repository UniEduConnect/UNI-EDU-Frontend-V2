import { Star, MessageSquare, ArrowUpRight, CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReviewDialog from "@/components/ReviewDialog";
import { useClasses, useCreateClassReview } from "@/hooks/useClasses";
import { getMyReviews } from "@/services/reviews";
import type { ClassItem } from "@/types/api";

const ParentReviews = () => {
  // Classes booked for this parent's children (backend scopes by caller role).
  const { classes, isLoading, isError } = useClasses();

  // Reviews this parent has already submitted (one per class). /me/reviews.
  const { data: myReviewsData } = useQuery({
    queryKey: ["my-reviews", 1],
    queryFn: () => getMyReviews(1),
  });
  const myReviews = useMemo(() => myReviewsData?.items ?? [], [myReviewsData]);

  const createReview = useCreateClassReview();

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    classId: string;
    tutorName: string;
    className: string;
    subject: string;
  }>({
    open: false,
    classId: "",
    tutorName: "",
    className: "",
    subject: "",
  });

  // A class is reviewable once it has finished (all/most sessions done). The
  // backend exposes status + session counts; treat "completed" classes as ready.
  const reviewableClasses = useMemo(
    () =>
      classes.filter(
        c =>
          c.status?.toLowerCase() === "completed" ||
          (c.totalSessions > 0 && c.completedSessions >= c.totalSessions)
      ),
    [classes]
  );

  const reviewedClassIds = useMemo(
    () => new Set(myReviews.map(r => r.classId)),
    [myReviews]
  );

  const unreviewedClasses = reviewableClasses.filter(c => !reviewedClassIds.has(c.id));

  // Pair stored reviews with their class for richer display when available.
  const classById = useMemo(() => {
    const m = new Map<string, ClassItem>();
    classes.forEach(c => m.set(c.id, c));
    return m;
  }, [classes]);

  const avgRating =
    myReviews.length > 0
      ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
      : "0.0";

  const handleOpenReview = (c: ClassItem) => {
    setReviewDialog({
      open: true,
      classId: c.id,
      tutorName: c.tutorName,
      className: c.name,
      subject: c.subject,
    });
  };

  const handleSubmitReview = (rating: number, comment: string) => {
    if (!reviewDialog.classId) return;
    createReview.mutate({
      classId: reviewDialog.classId,
      payload: { rating, comment },
    });
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Lớp đủ điều kiện",
            value: reviewableClasses.length,
            sub: "Đủ điều kiện đánh giá",
            color: "from-blue-500 to-indigo-500",
            icon: CheckCircle2,
          },
          {
            label: "Đã đánh giá",
            value: myReviews.length,
            sub: "Phản hồi đã gửi",
            color: "from-amber-500 to-orange-500",
            icon: Star,
          },
          {
            label: "Chưa đánh giá",
            value: unreviewedClasses.length,
            sub: "Đang chờ phản hồi",
            color: "from-emerald-500 to-teal-500",
            icon: MessageSquare,
          },
          {
            label: "Điểm trung bình",
            value: avgRating,
            sub: "Chất lượng buổi học",
            color: "from-rose-500 to-pink-500",
            icon: ClipboardList,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={cn(
              "group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white transition-all hover:shadow-lg",
              s.color
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4" />
          </div>
        ))}
      </div>

      {/* LOADING / ERROR */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Đang tải danh sách lớp học...
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Không tải được danh sách lớp học. Vui lòng thử lại.
        </div>
      ) : (
        <>
          {/* UNREVIEWED */}
          {unreviewedClasses.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-primary" />
                Lớp chưa đánh giá ({unreviewedClasses.length})
              </h3>

              <div className="space-y-3">
                {unreviewedClasses.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.tutorAvatar ? (
                        <img
                          src={c.tutorAvatar}
                          alt={c.tutorName}
                          className="h-10 w-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                          <Star className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          GS: {c.tutorName} • HS: {c.studentName} • {c.completedSessions}/
                          {c.totalSessions} buổi
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenReview(c)}
                      className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Đánh giá
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWED */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-primary" />
              Đánh giá đã gửi ({myReviews.length})
            </h3>

            <div className="space-y-3">
              {myReviews.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Bạn chưa đánh giá lớp học nào.
                </p>
              )}

              {myReviews.map(r => {
                const cls = classById.get(r.classId);
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {cls?.tutorAvatar ? (
                          <img
                            src={cls.tutorAvatar}
                            alt={cls.tutorName}
                            className="h-10 w-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {cls?.name ?? "Lớp học"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cls ? `GS: ${cls.tutorName} • HS: ${cls.studentName} • ` : ""}
                            {new Date(r.date).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < r.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {r.comment && (
                      <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <ReviewDialog
        open={reviewDialog.open}
        onOpenChange={open => setReviewDialog(prev => ({ ...prev, open }))}
        tutorName={reviewDialog.tutorName}
        className={reviewDialog.className}
        subject={reviewDialog.subject}
        sessionDate=""
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default ParentReviews;
