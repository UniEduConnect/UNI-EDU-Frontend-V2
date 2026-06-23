import { ShieldCheck, Star, BookOpen, Trophy, Video, Edit2, Save, MapPin, Phone, Mail, Calendar, Award, TrendingUp, Users, Loader2, GraduationCap, Briefcase, BadgeCheck, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMyTutorProfile, useUpdateMyProfile, useMyReviews } from "@/hooks/useTutors";
import { useUploadImage } from "@/hooks/useUploads";
import { useClasses } from "@/hooks/useClasses";
import { useMySchedule } from "@/hooks/useSchedule";
import type { UpdateTutorProfileRequest } from "@/types/api";

const TutorProfile = () => {
  const { data: profile, isLoading } = useMyTutorProfile();
  const updateProfile = useUpdateMyProfile();
  const uploadImage = useUploadImage();
  const { data: rev } = useMyReviews(1);
  const { classes } = useClasses();
  const { classes: activeClassList } = useClasses({ Status: "active" });
  const { classes: completedClassList } = useClasses({ Status: "completed" });
  const { sessions } = useMySchedule();

  const [editing, setEditing] = useState(false);
  // Confirm dialog gates the actual save so the tutor can't update by accident.
  const [confirmOpen, setConfirmOpen] = useState(false);
  // editable form mirrors the profile fields we expose for editing
  const [form, setForm] = useState({ bio: "", hourlyRate: 0, videoUrl: "", teachingStyle: "", location: "" });
  // avatar is uploaded to S3 immediately; we keep the resulting URL and persist it on save.
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // certificates/achievements are edited as a plain list of names (no per-doc status from BE)
  const [certificates, setCertificates] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newCredential, setNewCredential] = useState("");
  const [newAchievement, setNewAchievement] = useState("");

  // Seed the editable state once the profile loads (and whenever it changes).
  useEffect(() => {
    if (!profile) return;
    setForm({
      bio: profile.bio ?? "",
      hourlyRate: profile.hourlyRate ?? 0,
      videoUrl: profile.videoUrl ?? "",
      teachingStyle: profile.teachingStyle ?? "",
      location: profile.location ?? "",
    });
    setAvatarUrl(profile.avatar ?? "");
    setCertificates(profile.certificates ?? []);
    setAchievements(profile.achievements ?? []);
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một tệp ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh phải nhỏ hơn 5MB.");
      return;
    }
    uploadImage.mutate(file, {
      onSuccess: (url) => {
        setAvatarUrl(url);
        toast.success("Đã tải ảnh lên. Nhấn Lưu để cập nhật hồ sơ.");
      },
      onError: () => toast.error("Tải ảnh lên thất bại. Vui lòng thử lại."),
    });
  };

  // Opens the confirm dialog instead of saving directly.
  const requestSave = () => setConfirmOpen(true);

  const handleSave = () => {
    setConfirmOpen(false);
    // FE form field `videoUrl` maps to `introVideoUrl` on the request DTO.
    const payload: UpdateTutorProfileRequest = {
      bio: form.bio,
      hourlyRate: form.hourlyRate,
      introVideoUrl: form.videoUrl,
      teachingStyle: form.teachingStyle,
      location: form.location,
      avatarUrl,
      certificates,
      achievements,
    };
    updateProfile.mutate(payload, {
      onSuccess: () => {
        setEditing(false);
        toast.success("Đã cập nhật hồ sơ!");
      },
      onError: () => toast.error("Cập nhật hồ sơ thất bại. Vui lòng thử lại."),
    });
  };

  // GAP: no /Tutors/me/students endpoint — derive a distinct student count from the tutor's classes.
  // TODO(BE): GET /Tutors/me/students for accurate student count/progress
  const totalStudents = useMemo(
    () => new Set(classes.map((c) => c.studentId)).size,
    [classes],
  );
  const completedClasses = completedClassList.length;
  const activeClasses = activeClassList.length;

  // Per-subject average rating from the tutor's own reviews.
  const subjectData = useMemo(() => {
    const subjects = profile?.subjects ?? [];
    const items = rev?.items ?? [];
    return subjects.map((s) => {
      const subReviews = items.filter((r) => r.subject === s);
      return {
        subject: s,
        rating: subReviews.length > 0 ? subReviews.reduce((sum, r) => sum + r.rating, 0) / subReviews.length : 0,
        count: subReviews.length,
      };
    });
  }, [profile?.subjects, rev?.items]);

  // GAP: no monthly time-series endpoint — derive completed-sessions-per-month from /me schedule.
  // TODO(BE): GET /Tutors/me/earnings-series (or sessions-series) for the monthly chart
  const monthlySessionData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions) {
      if (s.status !== "completed" || !s.startAt) continue;
      const d = new Date(s.startAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, sessionsCount]) => {
        const month = Number(key.split("-")[1]) + 1;
        return { month: `T${month}`, sessions: sessionsCount };
      });
  }, [sessions]);

  const chartConfig = {
    rating: { label: "Đánh giá", color: "hsl(var(--primary))" },
    sessions: { label: "Buổi dạy", color: "hsl(var(--primary))" },
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải hồ sơ...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <img src={avatarUrl || profile.avatar} alt={profile.name} className="w-24 h-24 rounded-2xl object-cover" />
            {editing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImage.isPending}
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity disabled:opacity-100"
                  aria-label="Đổi ảnh đại diện"
                >
                  {uploadImage.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
              {profile.type === "teacher" ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                  <BadgeCheck className="w-3 h-3" /> {profile.isVerified ? "Giáo viên được xác minh" : "Giáo viên"}
                </span>
              ) : (
                profile.degreeVerified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/15 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg"><ShieldCheck className="w-3 h-3" /> Verified</span>
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile.school} • {profile.degree}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-sm font-semibold">{profile.rating}</span><span className="text-xs text-muted-foreground">({profile.totalReviews})</span></div>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> {profile.totalSessions} buổi</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Từ {profile.joinDate}</span>
            </div>
            <div className="flex gap-2 mt-3">
              {profile.subjects.map(s => <span key={s} className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">{s}</span>)}
            </div>
            {/* Professional badges — teachers get a richer credential row than tutors */}
            {profile.type === "teacher" && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 border border-success/30 px-2.5 py-1 rounded-lg"><ShieldCheck className="w-3.5 h-3.5" /> Chứng nhận giáo viên</span>
                )}
                {profile.degree && (
                  <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg"><GraduationCap className="w-3.5 h-3.5" /> {profile.degree}</span>
                )}
                {profile.school && (
                  <span className="flex items-center gap-1 text-xs font-medium text-foreground bg-muted border border-border px-2.5 py-1 rounded-lg"><BookOpen className="w-3.5 h-3.5" /> Đang dạy tại {profile.school}</span>
                )}
                {!!profile.yearsExperience && profile.yearsExperience > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 border border-warning/30 px-2.5 py-1 rounded-lg"><Briefcase className="w-3.5 h-3.5" /> {profile.yearsExperience} năm kinh nghiệm</span>
                )}
              </div>
            )}
          </div>
          <button onClick={() => (editing ? requestSave() : setEditing(true))} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            {editing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
          <p className="text-xs text-muted-foreground">Học sinh</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <BookOpen className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{activeClasses}</p>
          <p className="text-xs text-muted-foreground">Lớp đang dạy</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Trophy className="w-5 h-5 text-warning mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{completedClasses}</p>
          <p className="text-xs text-muted-foreground">Lớp hoàn thành</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{profile.testPassRate}%</p>
          <p className="text-xs text-muted-foreground">Test pass</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Award className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-primary">{profile.hourlyRate.toLocaleString("vi-VN")}đ</p>
          <p className="text-xs text-muted-foreground">/ giờ</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-warning" /> Thành tích</h3>
        <div className="flex flex-wrap gap-2">
          {(editing ? achievements : profile.achievements).map((a, i) => (
            <span key={i} className="px-3 py-1.5 bg-warning/15 dark:bg-amber-900/10 text-warning dark:text-amber-400 border border-warning/30 dark:border-warning/40 rounded-xl text-xs font-medium">{a}</span>
          ))}
        </div>
        {editing && (
          <div className="flex gap-2 mt-3">
            <input value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} placeholder="Thêm thành tích mới" className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <button
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm"
              onClick={() => {
                if (!newAchievement.trim()) return;
                setAchievements((prev) => [...prev, newAchievement.trim()]);
                setNewAchievement("");
              }}
            >
              Thêm
            </button>
          </div>
        )}
      </div>

      {/* Subject ratings (per-subject average from reviews) */}
      {subjectData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Đánh giá theo môn</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjectData.map((s) => (
              <div key={s.subject} className="p-3 rounded-xl border border-border bg-muted/20">
                <p className="text-sm font-medium text-foreground">{s.subject}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold">{s.count > 0 ? s.rating.toFixed(1) : "—"}</span>
                  <span className="text-xs text-muted-foreground">({s.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn("p-4 rounded-2xl border flex items-center gap-3", profile.transcriptVerified ? "border-success/30 bg-success/15/50 dark:border-success/40 dark:bg-emerald-900/10" : "border-border bg-card")}>
          <ShieldCheck className={cn("w-6 h-6", profile.transcriptVerified ? "text-success" : "text-muted-foreground")} />
          <div><p className="text-sm font-medium text-foreground">{profile.type === "teacher" ? "Chứng nhận giảng dạy" : "Bảng điểm"}</p><p className="text-xs text-muted-foreground">{profile.transcriptVerified ? "Đã xác minh" : "Chưa xác minh"}</p></div>
        </div>
        <div className={cn("p-4 rounded-2xl border flex items-center gap-3", profile.degreeVerified ? "border-success/30 bg-success/15/50 dark:border-success/40 dark:bg-emerald-900/10" : "border-border bg-card")}>
          <Trophy className={cn("w-6 h-6", profile.degreeVerified ? "text-success" : "text-muted-foreground")} />
          <div><p className="text-sm font-medium text-foreground">Văn bằng</p><p className="text-xs text-muted-foreground">{profile.degreeVerified ? "Đã xác minh" : "Chưa xác minh"}</p></div>
        </div>
      </div>

      {/* Văn bằng & chứng chỉ — plain name list (no per-doc verification status from BE). */}
      {/* TODO(BE): GET/POST /Tutors/me/credentials with per-document verification status + file upload */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Văn bằng & chứng chỉ</h3>
          <span className="text-xs text-muted-foreground">{certificates.length} tài liệu</span>
        </div>
        <div className="space-y-2 mb-3">
          {certificates.length === 0 && (
            <p className="text-xs text-muted-foreground">Chưa có văn bằng/chứng chỉ.</p>
          )}
          {certificates.map((name, i) => (
            <div key={i} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{name}</p>
              {editing && (
                <button
                  className="text-xs text-destructive"
                  onClick={() => setCertificates((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Xóa
                </button>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="flex gap-2">
            <input value={newCredential} onChange={(e) => setNewCredential(e.target.value)} placeholder="Tên văn bằng/chứng chỉ mới" className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <button
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm"
              onClick={() => {
                if (!newCredential.trim()) return;
                setCertificates((prev) => [...prev, newCredential.trim()]);
                setNewCredential("");
              }}
            >
              Thêm
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Thông tin liên hệ</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{profile.phone}</span></div>
            <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{profile.email}</span></div>
            <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{editing ? <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="px-2 py-1 bg-muted/50 border border-border rounded-lg text-sm" /> : profile.location}</span></div>
          </div>
        </div>

        {/* Monthly Sessions Chart — derived from completed sessions. */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Số buổi dạy theo tháng</h3>
          {monthlySessionData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={monthlySessionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Giới thiệu</h3>
        {editing ? <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm h-24 resize-none" /> : <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>}
      </div>

      {/* Teaching Style */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Phương pháp giảng dạy</h3>
        {editing ? <textarea value={form.teachingStyle} onChange={e => setForm(p => ({ ...p, teachingStyle: e.target.value }))} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm h-20 resize-none" /> : <p className="text-sm text-muted-foreground leading-relaxed">{profile.teachingStyle}</p>}
      </div>

      {/* Video */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Video giới thiệu</h3>
        {editing ? <input value={form.videoUrl} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" placeholder="YouTube embed URL" /> : profile.videoUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted"><iframe src={profile.videoUrl} className="w-full h-full" allowFullScreen title="Intro video" /></div>
        ) : <p className="text-sm text-muted-foreground text-center py-8">Chưa có video</p>}
      </div>

      {/* Hourly Rate */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Giá dạy</h3>
        {editing ? (
          <div className="flex items-center gap-2"><input type="number" value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: parseInt(e.target.value) || 0 }))} className="w-40 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" /><span className="text-sm text-muted-foreground">đ/giờ</span></div>
        ) : <p className="text-2xl font-bold text-primary">{profile.hourlyRate.toLocaleString("vi-VN")}đ <span className="text-sm font-normal text-muted-foreground">/ giờ</span></p>}
      </div>

      {editing && (
        <div className="flex gap-3">
          <button onClick={requestSave} disabled={updateProfile.isPending} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-60">{updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}</button>
          <button onClick={() => setEditing(false)} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium">Hủy</button>
        </div>
      )}

      {/* Confirm before persisting profile changes. */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật hồ sơ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn lưu các thay đổi vào hồ sơ của mình không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TutorProfile;
