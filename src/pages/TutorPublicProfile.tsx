import { ShieldCheck, Star, Video, CalendarDays, Trophy, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTutor, useTutorReviews } from "@/hooks/useTutors";
import { useAuth } from "@/contexts/AuthContext";

const TutorPublicProfile = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để tiếp tục.");
      navigate("/login");
      return;
    }
    action();
  };
  // Tutor id comes from the query string (?id=...); links from the find-tutor list pass it.
  const [params] = useSearchParams();
  const tutorId = params.get("id") ?? undefined;
  const { data: profile, isLoading } = useTutor(tutorId);
  const { data: reviewsData } = useTutorReviews(tutorId);
  const reviews = reviewsData?.items ?? [];
  const [trialDialog, setTrialDialog] = useState(false);
  const [trialForm, setTrialForm] = useState({ name: "", student: "", date: "", time: "", subject: "" });

  const handleTrial = () => {
    if (!trialForm.name || !trialForm.student || !trialForm.date) return;
    toast.success("Đã gửi yêu cầu học thử! Gia sư sẽ xác nhận trong 24h.");
    setTrialDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">Không tìm thấy gia sư.</p>
        <button onClick={() => navigate("/find-tutor")} className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">
          Tìm gia sư
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1E69E7] to-[#1546A0] text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-start gap-6">
            <img src={profile.avatar} alt={profile.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-white/20" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                {profile.degreeVerified && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-emerald-400/25 text-emerald-50 px-2 py-0.5 rounded-lg">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm">{profile.school} • {profile.degree}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{profile.rating}</span>
                  <span className="text-white/60 text-sm">({profile.totalReviews} đánh giá)</span>
                </div>
                <span className="text-white/60 text-sm">{profile.totalSessions} buổi đã dạy</span>
                <span className="text-white/60 text-sm">Pass rate: {profile.testPassRate}%</span>
              </div>
              <div className="flex gap-2 mt-3">
                {profile.subjects.map(s => (
                  <span key={s} className="text-xs font-medium bg-white/10 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{profile.hourlyRate.toLocaleString("vi-VN")}đ</p>
              <p className="text-xs text-white/60">/ giờ</p>
              <button onClick={() => requireAuth(() => setTrialDialog(true))} className="mt-3 px-6 py-2.5 bg-white text-primary rounded-full font-semibold text-sm hover:bg-white/90 transition-all">
                Đặt học thử
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Bio */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Giới thiệu</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        </div>

        {/* Verified Credentials */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn("p-4 rounded-2xl border flex items-center gap-3", profile.transcriptVerified ? "border-success/30 bg-success/15/50 dark:border-success/40 dark:bg-emerald-900/10" : "border-border bg-card")}>
            <ShieldCheck className={cn("w-6 h-6", profile.transcriptVerified ? "text-success" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-medium text-foreground">Bảng điểm</p>
              <p className="text-xs text-muted-foreground">{profile.transcriptVerified ? "Đã xác minh" : "Chưa xác minh"}</p>
            </div>
          </div>
          <div className={cn("p-4 rounded-2xl border flex items-center gap-3", profile.degreeVerified ? "border-success/30 bg-success/15/50 dark:border-success/40 dark:bg-emerald-900/10" : "border-border bg-card")}>
            <Trophy className={cn("w-6 h-6", profile.degreeVerified ? "text-success" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-medium text-foreground">Văn bằng</p>
              <p className="text-xs text-muted-foreground">{profile.degreeVerified ? "Đã xác minh" : "Chưa xác minh"}</p>
            </div>
          </div>
        </div>

        {/* Video */}
        {profile.videoUrl && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Video giới thiệu</h3>
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <iframe src={profile.videoUrl} className="w-full h-full" allowFullScreen title="Intro video" />
            </div>
          </div>
        )}

        {/* Availability */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Lịch rảnh
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {profile.availability.map(av => (
              <div key={av.day} className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs font-semibold text-foreground mb-2">{av.day}</p>
                {av.slots.map(slot => (
                  <span key={slot} className="block text-[11px] text-primary font-medium bg-primary/10 rounded-lg px-2 py-1 mb-1">{slot}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Đánh giá ({reviews.length})</h3>
          <div className="space-y-3">
            {reviews.slice(0, 5).map(r => (
              <div key={r.id} className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.parentName}</p>
                      <p className="text-[11px] text-muted-foreground">{r.className}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow Info */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-center">
          <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Thanh toán an toàn với Escrow</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Tiền sẽ được giữ an toàn trong hệ thống cho đến khi hoàn thành đủ buổi học. Hỗ trợ MoMo & VNPay.
          </p>
        </div>
      </div>

      {/* Trial Booking Dialog */}
      <Dialog open={trialDialog} onOpenChange={setTrialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Đặt buổi học thử</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground">Tên phụ huynh *</label>
              <input value={trialForm.name} onChange={e => setTrialForm(p => ({ ...p, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Tên học sinh *</label>
              <input value={trialForm.student} onChange={e => setTrialForm(p => ({ ...p, student: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Môn học</label>
              <select value={trialForm.subject} onChange={e => setTrialForm(p => ({ ...p, subject: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm">
                {profile.subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Ngày *</label>
                <input type="date" value={trialForm.date} onChange={e => setTrialForm(p => ({ ...p, date: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Giờ</label>
                <select value={trialForm.time} onChange={e => setTrialForm(p => ({ ...p, time: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm">
                  <option value="">Chọn giờ</option>
                  {profile.availability.flatMap(a => a.slots).filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleTrial} disabled={!trialForm.name || !trialForm.student || !trialForm.date} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">
              Gửi yêu cầu học thử
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Gia sư sẽ xác nhận trong vòng 24 giờ</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorPublicProfile;
