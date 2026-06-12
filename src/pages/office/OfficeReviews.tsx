import { useState } from "react";
import { Star, Search, X, Eye, EyeOff, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useReviewsForModeration, useHideReview, useUnhideReview } from "@/hooks/useReviewsModeration";

// TODO(BE): moderation review DTO lacks tutorName/reviewerName/className/subject/hidden flag/moderationLogs — enrich /Reviews response for the moderation UI

const PREDEFINED_REASONS = [
  "Ngôn ngữ không phù hợp",
  "Nội dung spam / quảng cáo",
  "Thông tin sai sự thật",
  "Vi phạm quyền riêng tư",
  "Không liên quan đến buổi học",
  "Đánh giá trùng lặp",
];

const OfficeReviews = () => {
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  // Hidden reviews are fetched via the Status filter since the DTO has no `hidden` flag.
  const { reviews, isLoading, isError } = useReviewsForModeration(
    showHidden ? { Status: "Hidden" } : {},
  );
  const hideReview = useHideReview();
  const unhideReview = useUnhideReview();

  // Moderation reason dialog state (reason is collected for the operator only —
  // the hide endpoint does not accept a reason payload yet).
  const [moderationDialog, setModerationDialog] = useState<{ open: boolean; reviewId: number }>({ open: false, reviewId: 0 });
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const filtered = reviews.filter(r => {
    if (search && !r.comment.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRating && r.rating !== filterRating) return false;
    return true;
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const openHide = (reviewId: number) => {
    setSelectedReason("");
    setCustomReason("");
    setModerationDialog({ open: true, reviewId });
  };

  const confirmHide = () => {
    const reason = selectedReason === "__custom" ? customReason.trim() : selectedReason;
    if (!reason) {
      toast.error("Vui lòng chọn hoặc nhập lý do.");
      return;
    }
    hideReview.mutate(moderationDialog.reviewId, {
      onSuccess: () => toast.success("Đã ẩn đánh giá."),
      onError: () => toast.error("Không thể ẩn đánh giá. Vui lòng thử lại."),
    });
    setModerationDialog({ open: false, reviewId: 0 });
  };

  const handleUnhide = (reviewId: number) => {
    unhideReview.mutate(reviewId, {
      onSuccess: () => toast.success("Đã khôi phục đánh giá."),
      onError: () => toast.error("Không thể khôi phục đánh giá. Vui lòng thử lại."),
    });
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Tổng đánh giá */}
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{reviews.length}</p>
              <p className="text-xs text-white/80 mt-1">{showHidden ? "Đánh giá đã ẩn" : "Tổng đánh giá"}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Điểm trung bình */}
        <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
              <p className="text-xs text-white/80 mt-1">Điểm trung bình</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung đánh giá..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex gap-1">
          {[5, 4, 3, 2, 1].map(r => (
            <button key={r} onClick={() => setFilterRating(filterRating === r ? null : r)}
              className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-colors", filterRating === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {r}★
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1", showHidden ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
        >
          <EyeOff className="w-3.5 h-3.5" /> {showHidden ? "Đang xem đã ẩn" : "Xem đã ẩn"}
        </button>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải đánh giá...
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground text-center py-8">Không tải được danh sách đánh giá. Vui lòng thử lại.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Không có đánh giá nào phù hợp.</p>
        ) : (
          filtered.map(r => (
            <div key={r.id} className={cn("bg-card border border-border rounded-2xl p-5 transition-opacity shadow-soft", showHidden && "opacity-60")}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {r.rating}★
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">Người đánh giá: {r.reviewerId || "—"}</p>
                        {showHidden && (
                          <Badge variant="outline" className="text-[10px] rounded-full border-destructive/30 text-destructive">
                            <EyeOff className="w-3 h-3 mr-1" /> Đã ẩn
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        GS: {r.tutorId || "—"} • Lớp: {r.classId || "—"} • {r.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <div className="flex gap-1 ml-2">
                        {showHidden ? (
                          <button
                            onClick={() => handleUnhide(r.id)}
                            disabled={unhideReview.isPending}
                            title="Hiện lại"
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openHide(r.id)}
                            disabled={hideReview.isPending}
                            title="Ẩn đánh giá"
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Moderation Reason Dialog */}
      <Dialog open={moderationDialog.open} onOpenChange={open => { if (!open) setModerationDialog(prev => ({ ...prev, open: false })); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Ẩn đánh giá
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Vui lòng chọn hoặc nhập lý do. Thao tác này sẽ được ghi lại trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">Chọn lý do:</p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => { setSelectedReason(reason); setCustomReason(""); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    selectedReason === reason
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {reason}
                </button>
              ))}
              <button
                onClick={() => setSelectedReason("__custom")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  selectedReason === "__custom"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                Lý do khác...
              </button>
            </div>

            {selectedReason === "__custom" && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                maxLength={500}
                className="w-full p-3 bg-muted border border-border rounded-xl text-sm text-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setModerationDialog(prev => ({ ...prev, open: false }))}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={confirmHide}
              disabled={!selectedReason || (selectedReason === "__custom" && !customReason.trim()) || hideReview.isPending}
            >
              Ẩn đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeReviews;
