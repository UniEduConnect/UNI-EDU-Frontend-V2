import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Star,
  MapPin,
  Filter,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Clock,
  X,
  Award,
  Play,
  GraduationCap,
  Video,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Megaphone } from "lucide-react";
import Header from "@/components/Header";
import FooterSection from "@/components/FooterSection";
import PostClassRequestDialog from "@/components/search/PostClassRequestDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useTutors } from "@/hooks/useTutors";
import { useMySchedule } from "@/hooks/useSchedule";
import { DAYS, SLOTS, slotKey, busySlotKeys } from "@/lib/scheduleUtils";
import { AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";

import tutor1 from "@/assets/tutor-1.jpg";
import tutor2 from "@/assets/tutor-2.jpg";
import tutor3 from "@/assets/tutor-3.jpg";
import tutor4 from "@/assets/tutor-4.jpg";
import tutor5 from "@/assets/tutor-5.jpg";
import tutor6 from "@/assets/tutor-6.jpg";

const allSubjects = [
  "Tất cả",
  "Toán",
  "Lý",
  "Hóa",
  "Sinh",
  "Anh văn",
  "IELTS",
  "Văn",
  "Sử",
  "Tin học",
];


const FindTutor = () => {
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const canPostRequest = role === "student" || role === "parent";
  const [postOpen, setPostOpen] = useState(false);

  // Gate any action behind login: not authenticated → send to /login first.
  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để tiếp tục.");
      navigate("/login", { state: { from: "/find-tutor" } });
      return;
    }
    action();
  };
  const { tutors, isLoading, isError } = useTutors();
  // Live tutors from the API only — no fake fallback. On error the page shows an
  // empty/error state instead of fabricated tutors.
  const tutorListings = tutors;
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [subjectFilter, setSubjectFilter] = useState(
    () => searchParams.get("subject") || "Tất cả"
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "tutor" | "teacher">(
    () => {
      const t = searchParams.get("type");
      return t === "tutor" || t === "teacher" ? t : "all";
    }
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || 500000,
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [bookedTutors, setBookedTutors] = useState<Set<string>>(new Set());
  const [trialRequested, setTrialRequested] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<{
    tutorId: string;
    subject: string;
  } | null>(null);
  const [trialModal, setTrialModal] = useState<string | null>(null);
  const [bookStartDate, setBookStartDate] = useState("");
  const [bookSessions, setBookSessions] = useState(12);
  const [bookSchedule, setBookSchedule] = useState("");
  // Structured schedule picker + conflict detection against the student's busy sessions.
  const [bookDays, setBookDays] = useState<string[]>([]);
  const [bookSlot, setBookSlot] = useState("");
  const { sessions: mySessions } = useMySchedule();
  const myBusy = useMemo(() => busySlotKeys(mySessions), [mySessions]);
  const bookConflicts = useMemo(
    () => (bookSlot ? bookDays.filter((d) => myBusy.has(slotKey(d, bookSlot))) : []),
    [bookDays, bookSlot, myBusy]
  );
  const composedSchedule = bookDays.length && bookSlot ? `${bookDays.join(", ")} - ${bookSlot}` : "";
  const [selectedTrialSlot, setSelectedTrialSlot] = useState<{
    day: string;
    time: string;
  } | null>(null);
  const [listPage, setListPage] = useState(1);

  // Re-sync filters whenever the URL query changes — e.g. the "Tìm gia sư khác"
  // popup navigates here with new params while we're already on this page.
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSubjectFilter(searchParams.get("subject") || "Tất cả");
    const t = searchParams.get("type");
    setTypeFilter(t === "tutor" || t === "teacher" ? t : "all");
    setPriceRange([
      Number(searchParams.get("minPrice")) || 0,
      Number(searchParams.get("maxPrice")) || 500000,
    ]);
    setListPage(1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return tutorListings.filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subjects.some((s) =>
          s.toLowerCase().includes(search.toLowerCase())
        );
      const matchSubject =
        subjectFilter === "Tất cả" || t.subjects.includes(subjectFilter);
      const matchPrice =
        t.hourlyRate >= priceRange[0] && t.hourlyRate <= priceRange[1];
      const matchType = typeFilter === "all" || t.type === typeFilter;
      return matchSearch && matchSubject && matchPrice && matchType;
    });
  }, [tutorListings, search, subjectFilter, priceRange, typeFilter]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(listPage, pageCount);
  const pagedTutors = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleBook = () => {
    if (!bookingModal || !bookStartDate || !composedSchedule) return;
    if (bookConflicts.length > 0) return; // blocked: chosen slot clashes with an existing session
    setBookSchedule(composedSchedule);
    setBookedTutors((prev) => new Set(prev).add(bookingModal.tutorId));
    setBookingModal(null);
    setBookStartDate("");
    setBookSchedule("");
    setBookDays([]);
    setBookSlot("");
  };

  const handleTrial = () => {
    if (!trialModal || !selectedTrialSlot) return;
    setTrialRequested((prev) => new Set(prev).add(trialModal));
    setTrialModal(null);
    setSelectedTrialSlot(null);
  };

  const trialTutor = trialModal
    ? tutorListings.find((t) => t.id === trialModal)
    : null;
  const profileTutor = selectedProfile
    ? tutorListings.find((t) => t.id === selectedProfile)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-section-lg md:text-hero font-extrabold text-foreground mb-3">
              Tìm gia sư <span className="text-gradient">phù hợp</span>
            </h1>
            <p className="text-muted-foreground text-body-lg">
              Hơn 1,200 gia sư đã được xác thực và sẵn sàng giảng dạy
            </p>
            {canPostRequest && (
              <div className="mt-5">
                <Button onClick={() => setPostOpen(true)} className="rounded-xl">
                  <Megaphone className="w-4 h-4 mr-2" /> Đăng bài tìm gia sư
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" /> Bộ lọc
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Loại
              </p>
              <div className="flex gap-2">
                {[
                  { val: "all", label: "Tất cả" },
                  { val: "tutor", label: "Gia sư" },
                  { val: "teacher", label: "Giáo viên" },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setTypeFilter(t.val as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      typeFilter === t.val
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Môn học
              </p>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubjectFilter(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      subjectFilter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Giá / giờ: {priceRange[0].toLocaleString("vi-VN")}đ -{" "}
                {priceRange[1].toLocaleString("vi-VN")}đ
              </p>
              <div className="flex gap-4">
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={50000}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="flex-1"
                />
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={50000}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {subjectFilter !== "Tất cả" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSubjectFilter("Tất cả")}
            >
              {subjectFilter}{" "}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {typeFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setTypeFilter("all")}
            >
              {typeFilter === "tutor" ? "Gia sư" : "Giáo viên"}{" "}
              <X className="w-3 h-3" />
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} kết quả
          </span>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={!!bookingModal} onOpenChange={() => setBookingModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Đăng ký học -{" "}
              {bookingModal &&
                tutorListings.find((t) => t.id === bookingModal.tutorId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Môn học
              </label>
              <Input
                value={bookingModal?.subject || ""}
                disabled
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Ngày bắt đầu
              </label>
              <Input
                type="date"
                value={bookStartDate}
                onChange={(e) => setBookStartDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Số buổi
              </label>
              <Input
                type="number"
                min={4}
                max={48}
                value={bookSessions}
                onChange={(e) => setBookSessions(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Lịch học mong muốn
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DAYS.map((d) => {
                  const active = bookDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBookDays((prev) => (active ? prev.filter((x) => x !== d) : [...prev, d]))}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {d.replace("Thứ ", "T").replace("Chủ nhật", "CN")}
                    </button>
                  );
                })}
              </div>
              <select
                value={bookSlot}
                onChange={(e) => setBookSlot(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Chọn khung giờ…</option>
                {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {bookConflicts.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/15 p-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Trùng lịch! Bạn đã có buổi học vào{" "}
                    <span className="font-semibold">{bookConflicts.join(", ")} · {bookSlot}</span>. Hãy chọn khung khác.
                  </p>
                </div>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Tạm tính học phí</p>
              <p className="text-sm font-bold text-foreground">
                {(
                  (bookingModal
                    ? tutorListings.find((t) => t.id === bookingModal.tutorId)
                        ?.hourlyRate || 0
                    : 0) * bookSessions
                ).toLocaleString("vi-VN")}
                đ
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              className="flex-1 rounded-xl"
              onClick={handleBook}
              disabled={!bookStartDate || !composedSchedule || bookConflicts.length > 0}
            >
              {bookConflicts.length > 0 ? "Trùng lịch — chọn khung khác" : "Xác nhận đăng ký"}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setBookingModal(null)}
            >
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trial Modal */}
      <Dialog
        open={!!trialTutor}
        onOpenChange={() => {
          setTrialModal(null);
          setSelectedTrialSlot(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đăng ký học thử - {trialTutor?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Chọn lịch rảnh của{" "}
            {trialTutor?.type === "teacher" ? "giáo viên" : "gia sư"} để học thử
          </p>
          <div className="space-y-2">
            {(trialTutor?.availableSlots || []).map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedTrialSlot(slot)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center gap-3",
                  selectedTrialSlot?.day === slot.day &&
                    selectedTrialSlot?.time === slot.time
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-primary/50"
                )}
              >
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span>
                  {slot.day} - {slot.time}
                </span>
              </button>
            ))}
            {(!trialTutor?.availableSlots ||
              trialTutor.availableSlots.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Chưa có lịch rảnh
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-xl"
              onClick={handleTrial}
              disabled={!selectedTrialSlot}
            >
              Gửi yêu cầu
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setTrialModal(null);
                setSelectedTrialSlot(null);
              }}
            >
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal - Enhanced */}
      <Dialog
        open={!!profileTutor}
        onOpenChange={() => setSelectedProfile(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {profileTutor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <img
                    src={profileTutor.avatar}
                    alt=""
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-lg">
                        {profileTutor.name}
                      </DialogTitle>
                      {profileTutor.verified && (
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      {profileTutor.type === "teacher" && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">
                          <ShieldCheck className="w-3 h-3" /> Verified Teacher
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {profileTutor.degree} • {profileTutor.school}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-current text-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {profileTutor.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({profileTutor.totalReviews} đánh giá)
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1 text-xs">
                    Tổng quan
                  </TabsTrigger>
                  <TabsTrigger
                    value="credentials"
                    className="flex-1 text-xs"
                  >
                    Bằng cấp
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex-1 text-xs">
                    Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    {profileTutor.bio}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-[10px] text-muted-foreground">
                        Kinh nghiệm
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {profileTutor.yearsExperience} năm
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-[10px] text-muted-foreground">
                        Buổi dạy
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {profileTutor.totalSessions}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-[10px] text-muted-foreground">
                        Môn dạy
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {profileTutor.subjects.join(", ")}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-[10px] text-muted-foreground">
                        Giá / giờ
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {profileTutor.hourlyRate.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>
                  {profileTutor.teachingStyle && (
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Phong cách giảng dạy
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profileTutor.teachingStyle}
                      </p>
                    </div>
                  )}
                  {profileTutor.achievements &&
                    profileTutor.achievements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Thành tích nổi bật
                        </p>
                        <div className="space-y-1.5">
                          {profileTutor.achievements.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="credentials" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Học vấn
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {profileTutor.degree}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profileTutor.school}
                    </p>
                  </div>
                  {profileTutor.certificates &&
                    profileTutor.certificates.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Chứng chỉ & Bằng cấp
                        </p>
                        <div className="space-y-2">
                          {profileTutor.certificates.map((cert, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                            >
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Award className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-foreground">{cert}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="video" className="mt-4">
                  {profileTutor.introVideoUrl ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border border-border relative overflow-hidden group cursor-pointer">
                        <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors" />
                        <div className="flex flex-col items-center gap-2 z-10">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Video giới thiệu
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Video giới thiệu phương pháp giảng dạy của{" "}
                        {profileTutor.name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Chưa có video giới thiệu
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 mt-4">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => requireAuth(() => {
                    setBookingModal({
                      tutorId: profileTutor.id,
                      subject: profileTutor.subjects[0],
                    });
                    setSelectedProfile(null);
                  })}
                >
                  Đăng ký học
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => requireAuth(() => {
                    setTrialModal(profileTutor.id);
                    setSelectedProfile(null);
                  })}
                >
                  Học thử
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Tutors Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách gia sư...
          </div>
        ) : isError && tutorListings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tải được danh sách gia sư. Vui lòng thử lại.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tìm thấy gia sư phù hợp.
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pagedTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-elevated transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={tutor.avatar}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {tutor.name}
                    </h3>
                    {tutor.verified && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> KYC
                      </span>
                    )}
                    {tutor.type === "teacher" && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">
                        <ShieldCheck className="w-3 h-3" /> Giáo viên
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-current text-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      {tutor.rating}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({tutor.totalReviews})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tutor.subjects.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BookOpen className="w-3 h-3" />
                  {tutor.totalSessions} buổi
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {tutor.yearsExperience} năm KN
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {tutor.location}
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  {tutor.hourlyRate.toLocaleString("vi-VN")}đ/h
                </div>
              </div>

              {tutor.certificates && tutor.certificates.length > 0 && (
                <div className="mb-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Award className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {tutor.certificates[0]}
                    {tutor.certificates.length > 1
                      ? ` +${tutor.certificates.length - 1}`
                      : ""}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                {bookedTutors.has(tutor.id) ? (
                  <Button
                    disabled
                    className="flex-1 rounded-xl text-xs"
                    size="sm"
                  >
                    Đã đăng ký
                  </Button>
                ) : (
                  <Button
                    className="flex-1 rounded-xl text-xs"
                    size="sm"
                    onClick={() => requireAuth(() =>
                      setBookingModal({
                        tutorId: tutor.id,
                        subject: tutor.subjects[0],
                      })
                    )}
                  >
                    Đăng ký học
                  </Button>
                )}
                {trialRequested.has(tutor.id) ? (
                  <Button
                    disabled
                    variant="outline"
                    className="rounded-xl text-xs"
                    size="sm"
                  >
                    Đã gửi
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-xl text-xs"
                    size="sm"
                    onClick={() => requireAuth(() => setTrialModal(tutor.id))}
                  >
                    Học thử
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="rounded-xl text-xs"
                  size="sm"
                  onClick={() => setSelectedProfile(tutor.id)}
                >
                  Hồ sơ
                </Button>
              </div>
            </div>
          ))}
        </div>
        )}

        {filtered.length > 0 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setListPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === idx + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setListPage(idx + 1);
                    }}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setListPage((p) => Math.min(pageCount, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">
            Không tìm thấy gia sư phù hợp. Hãy thử thay đổi bộ lọc.
          </p>
          {canPostRequest && (
            <Button onClick={() => setPostOpen(true)} className="rounded-xl">
              <Megaphone className="w-4 h-4 mr-2" /> Đăng bài tìm gia sư
            </Button>
          )}
        </div>
      )}
          </div>
        </div>
      </div>

      <PostClassRequestDialog open={postOpen} onOpenChange={setPostOpen} />
      <FooterSection />
    </div>
  );
};

export default FindTutor;
