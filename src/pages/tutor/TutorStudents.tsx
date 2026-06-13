import { Users, BookOpen, BarChart3, Search, X, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useClasses } from "@/hooks/useClasses";

// TODO(BE): GET /Tutors/me/students with per-student progress (skills, weeklyReports, scoreHistory, attendance, scores) — see backend-gaps doc
// The roster below is derived from the tutor's classes (the only data the backend exposes).
// Rich per-student analytics (skills, weekly reports, score history, attendance,
// average score, goal/homework completion, contact + parent info) have NO backend
// source yet, so the detail modal renders a "waiting for backend" empty state instead.

const TutorStudents = () => {
  const { classes, isLoading } = useClasses();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const roleBasePath = location.pathname.startsWith("/teacher") ? "/teacher" : "/tutor";

  // One roster row per class/student, using only fields that exist on ClassItem.
  const roster = classes.map((c) => ({
    id: c.id,
    studentId: c.studentId,
    studentName: c.studentName,
    className: c.name,
    subject: c.subject,
    status: c.status,
    format: c.format,
    completedSessions: c.completedSessions,
    totalSessions: c.totalSessions,
    startDate: c.startDate,
  }));

  const sp = selected ? roster.find((s) => s.id === selected) : null;

  const totalStudents = new Set(roster.map((s) => s.studentId)).size;
  const activeStudents = roster.filter((s) => s.status === "active").length;

  const subjects = [...new Set(roster.map((s) => s.subject))];
  const filtered = roster.filter((s) => {
    if (search && !s.studentName.toLowerCase().includes(search.toLowerCase()) && !s.className.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubject !== "all" && s.subject !== filterSubject) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedStudents = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const initial = (name: string) => (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="p-6 space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 text-center bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-soft border border-blue-300/30">
          <Users className="w-6 h-6 mx-auto mb-2 text-white/90" />
          <p className="text-2xl font-bold">{totalStudents}</p>
          <p className="text-xs text-white/80">Tổng học sinh</p>
        </div>
        <div className="rounded-2xl p-5 text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-soft border border-emerald-300/30">
          <BookOpen className="w-6 h-6 mx-auto mb-2 text-white/90" />
          <p className="text-2xl font-bold">{activeStudents}</p>
          <p className="text-xs text-white/80">Đang học</p>
        </div>
        <div className="rounded-2xl p-5 text-center bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-soft border border-violet-300/30">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-white/90" />
          <p className="text-2xl font-bold">{roster.length}</p>
          <p className="text-xs text-white/80">Tổng lớp</p>
        </div>
        <div className="rounded-2xl p-5 text-center bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft border border-rose-300/30">
          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-white/90" />
          <p className="text-2xl font-bold">{subjects.length}</p>
          <p className="text-xs text-white/80">Môn dạy</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên học sinh, lớp..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-xl text-sm">
          <option value="all">Tất cả môn</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-xl text-sm">
          <option value="all">Tất cả trạng thái</option>
          <option value="searching">Đang tìm</option>
          <option value="active">Đang học</option>
          <option value="completed">Hoàn thành</option>
          <option value="paused">Tạm dừng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Student List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách học sinh...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pagedStudents.map(s => (
              <button key={s.id} onClick={() => setSelected(s.id)} className="bg-white border border-blue-100 rounded-2xl p-5 text-left hover:shadow-2xl transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center ring-2 ring-blue-100">{initial(s.studentName)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-slate-900">{s.studentName}</p>
                    <p className="text-xs text-slate-500">{s.className} • {s.subject}</p>
                  </div>
                  {s.status === "completed" && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg">Hoàn thành</span>}
                  {s.status === "active" && <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">Đang học</span>}
                  {s.status === "searching" && <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">Đang tìm</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-foreground">{s.completedSessions}/{s.totalSessions}</p>
                    <p className="text-[10px] text-muted-foreground">Buổi học</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-foreground capitalize">{s.format}</p>
                    <p className="text-[10px] text-muted-foreground">Hình thức</p>
                  </div>
                </div>
                <Progress value={s.totalSessions > 0 ? (s.completedSessions / s.totalSessions) * 100 : 0} className="h-1.5 mt-3" />
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Không tìm thấy học sinh nào</p>}

          {filtered.length > 0 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                </PaginationItem>
                {Array.from({ length: pageCount }).map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink href="#" isActive={currentPage === idx + 1} onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}>
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pageCount, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-blue-100 shadow-soft">
          {sp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center ring-2 ring-blue-200">{initial(sp.studentName)}</div>
                  <div>
                    <span className="text-lg font-bold text-slate-900">{sp.studentName}</span>
                    <p className="text-xs text-slate-500 font-normal">{sp.className} • {sp.subject}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-2"><BookOpen className="w-3 h-3 text-muted-foreground" /><span>{sp.completedSessions}/{sp.totalSessions} buổi</span></div>
                <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-2 capitalize"><BarChart3 className="w-3 h-3 text-muted-foreground" /><span>{sp.format}</span></div>
                <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-2 capitalize"><CheckCircle2 className="w-3 h-3 text-muted-foreground" /><span>{sp.status}</span></div>
                <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-2"><Calendar className="w-3 h-3 text-muted-foreground" /><span>Từ {sp.startDate}</span></div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="skills">Kỹ năng</TabsTrigger>
                  <TabsTrigger value="scores">Điểm số</TabsTrigger>
                  <TabsTrigger value="reports">Báo cáo</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSelected(null);
                        navigate(`${roleBasePath}/classes/${sp.id}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                    >
                      Đi tới chi tiết lớp học
                    </button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-4 bg-muted/50 rounded-xl text-center"><BookOpen className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold text-foreground">{sp.completedSessions}/{sp.totalSessions}</p><p className="text-xs text-muted-foreground">Buổi</p></div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center"><BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold text-foreground capitalize">{sp.format}</p><p className="text-xs text-muted-foreground">Hình thức</p></div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center"><CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold text-foreground capitalize">{sp.status}</p><p className="text-xs text-muted-foreground">Trạng thái</p></div>
                  </div>
                  <div className="mt-4 p-6 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu — đang chờ backend</p>
                    <p className="text-xs text-muted-foreground mt-1">Điểm trung bình, chuyên cần, mục tiêu, BTVN và liên hệ phụ huynh chưa có nguồn dữ liệu.</p>
                  </div>
                </TabsContent>

                <TabsContent value="skills">
                  <div className="p-6 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu — đang chờ backend</p>
                  </div>
                </TabsContent>

                <TabsContent value="scores">
                  <div className="p-6 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu — đang chờ backend</p>
                  </div>
                </TabsContent>

                <TabsContent value="reports">
                  <div className="p-6 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu — đang chờ backend</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorStudents;
