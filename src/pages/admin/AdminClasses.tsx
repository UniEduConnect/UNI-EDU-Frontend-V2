import { useClasses, useClass, useUpdateClass, useCreateClass } from "@/hooks/useClasses";
import { useAdminUsers } from "@/hooks/useAdmin";
import { useSubjects } from "@/hooks/useSubjects";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, BookOpen, Users, Search as SearchIcon, Calendar, Eye, Clock, Loader2 } from "lucide-react";
import type { ClassItem, WeeklySlotDto } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

const statusLabel: Record<string, string> = { searching: "Đang tìm", active: "Đang học", completed: "Hoàn thành", paused: "Tạm dừng", cancelled: "Đã hủy" };
const statusColor: Record<string, string> = {
  searching: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-muted text-foreground",
  cancelled: "bg-rose-100 text-rose-700",
};
const formatColor: Record<string, string> = {
  online: "bg-primary/10 text-primary",
  offline: "bg-muted text-foreground",
  hybrid: "bg-secondary/20 text-secondary-foreground",
};

const ITEMS_PER_PAGE = 8;

// Build a human-readable schedule from the structured weeklySlots (jsonb on the backend).
const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const hhmm = (t: string) => (t ? t.slice(0, 5) : "");
const buildSchedule = (slots: WeeklySlotDto[] | undefined) => {
  if (!slots || slots.length === 0) return "";
  return slots
    .map((s) => `${dayNames[s.dayOfWeek] ?? "?"} ${hhmm(s.startTime)}-${hhmm(s.endTime)}`)
    .join(", ");
};

const emptyForm = { name: "", studentId: "", tutorId: "", format: "online", fee: 0, status: "searching", subject: "", totalSessions: 0 };

const AdminClasses = () => {
  // Live data: an Admin sees all classes (GET /Classes), users from /Admin/users, subjects from /Subjects.
  const { classes, isLoading, isError } = useClasses();
  const { users } = useAdminUsers();
  const { subjects } = useSubjects();
  const updateClassMut = useUpdateClass();
  const createClassMut = useCreateClass();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilterVal, setStatusFilterVal] = useState("all");
  const [formatFilterVal, setFormatFilterVal] = useState("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  // Detail dialog pulls full ClassDetailResponse (sessions, escrow) on demand.
  const { data: detailClass, isLoading: detailLoading } = useClass(detailId ?? undefined);

  const filteredClasses = classes.filter(c => {
    if (statusFilterVal !== "all" && c.status !== statusFilterVal) return false;
    if (formatFilterVal !== "all" && c.format !== formatFilterVal) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / ITEMS_PER_PAGE));
  const paginatedClasses = filteredClasses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const students = users.filter(u => u.role === "student" && u.status === "approved");
  const tutors = users.filter(u => (u.role === "tutor" || u.role === "teacher") && u.status === "approved");
  const activeClasses = classes.filter(c => c.status === "active").length;
  const searchingClasses = classes.filter(c => c.status === "searching").length;

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (c: ClassItem) => { setForm({ name: c.name, studentId: c.studentId, tutorId: c.tutorId, format: c.format, fee: c.fee, status: c.status, subject: c.subject, totalSessions: c.totalSessions || 0 }); setEditId(c.id); setShowForm(true); };

  const handleSave = () => {
    if (!form.name || !form.studentId || !form.tutorId) { toast({ title: "Vui lòng điền đầy đủ", variant: "destructive" }); return; }
    if (editId) {
      const subjectId = subjects.find(s => s.name === form.subject)?.id;
      updateClassMut.mutate(
        {
          id: editId,
          payload: {
            name: form.name,
            status: form.status,
            subjectId,
            tutorId: form.tutorId || undefined,
            studentId: form.studentId || undefined,
            format: form.format,
            fee: Number(form.fee) || 0,
            totalSessions: Number(form.totalSessions) || 0,
          },
        },
        {
          onSuccess: () => { toast({ title: "Đã cập nhật lớp học" }); setShowForm(false); },
          onError: (e) => toast({ title: e instanceof Error ? e.message : "Cập nhật thất bại", variant: "destructive" }),
        },
      );
      return;
    }
    const subjectId = subjects.find(s => s.name === form.subject)?.id;
    if (!subjectId) { toast({ title: "Vui lòng chọn môn học hợp lệ", variant: "destructive" }); return; }
    createClassMut.mutate(
      {
        studentId: form.studentId,
        tutorId: form.tutorId,
        subjectId,
        name: form.name,
        startDate: new Date().toISOString().slice(0, 10),
        totalSessions: Number(form.totalSessions) || 0,
        // The admin form does not capture structured slots; send one default slot
        // (backend requires >= 1). TODO: structured slot picker.
        weeklySlots: [{ dayOfWeek: 1, startTime: "19:00:00", endTime: "21:00:00" }],
        format: form.format,
        fee: Number(form.fee) || 0,
      },
      {
        onSuccess: () => { toast({ title: "Đã tạo lớp học" }); setShowForm(false); },
        onError: (e) => toast({ title: e instanceof Error ? e.message : "Tạo lớp thất bại", variant: "destructive" }),
      },
    );
  };

  // No DELETE endpoint on the backend.
  const handleDelete = () => { toast({ title: "Xóa lớp chưa được hỗ trợ bởi hệ thống", variant: "destructive" }); };
  const handleStatusChange = (id: string, status: string) => {
    updateClassMut.mutate({ id, payload: { status } }, {
      onError: (e) => toast({ title: e instanceof Error ? e.message : "Đổi trạng thái thất bại", variant: "destructive" }),
    });
  };

  const stats = [
    { label: "Tổng lớp", value: classes.length, icon: BookOpen, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
    { label: "Đang hoạt động", value: activeClasses, icon: Users, bg: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "Đang tìm gia sư", value: searchingClasses, icon: SearchIcon, bg: "from-amber-500 to-orange-500", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { label: "Buổi học tháng này", value: activeClasses * 8, icon: Calendar, bg: "from-rose-500 to-pink-500", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className={`border-0 shadow-soft bg-gradient-to-br ${s.bg} text-white`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} backdrop-blur-sm`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs opacity-90">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters + Action */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên lớp, môn học..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-10 h-11 rounded-2xl bg-card border-border"
          />
        </div>
        <Select value={statusFilterVal} onValueChange={v => { setStatusFilterVal(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-48 h-11 rounded-2xl bg-card border-border">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="searching">Đang tìm</SelectItem>
            <SelectItem value="active">Đang học</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formatFilterVal} onValueChange={v => { setFormatFilterVal(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-44 h-11 rounded-2xl bg-card border-border">
            <SelectValue placeholder="Hình thức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hình thức</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
        <Button className="rounded-xl h-11" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tạo lớp mới</Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Tên lớp</TableHead>
                <TableHead className="font-semibold">Học sinh</TableHead>
                <TableHead className="font-semibold">Gia sư</TableHead>
                <TableHead className="font-semibold">Hình thức</TableHead>
                <TableHead className="font-semibold">Học phí</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ngày tạo</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách lớp học...</span>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">Không tải được danh sách lớp học. Vui lòng thử lại.</TableCell>
                </TableRow>
              ) : paginatedClasses.length > 0 ? paginatedClasses.map(c => (
                <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.studentName || "—"}</TableCell>
                  <TableCell className="text-sm">{c.tutorName || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${formatColor[c.format]}`}>
                      {c.format.charAt(0).toUpperCase() + c.format.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{c.fee.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>
                    <Select value={c.status} onValueChange={v => handleStatusChange(c.id, v)}>
                      <SelectTrigger className={`w-32 h-8 text-[11px] rounded-full border-0 font-semibold ${statusColor[c.status]} shadow-sm`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="searching">Đang tìm</SelectItem>
                        <SelectItem value="active">Đang học</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.createdAt?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setDetailId(c.id)} title="Xem chi tiết"><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(c)}><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">Không tìm thấy lớp học</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredClasses.length)} / {filteredClasses.length}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa lớp học" : "Tạo lớp học mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên lớp</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl mt-1.5" /></div>
            {editId && (
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="searching">Đang tìm</SelectItem>
                    <SelectItem value="active">Đang học</SelectItem>
                    <SelectItem value="paused">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-amber-600 mt-2">Lưu ý: đổi học phí / môn / gia sư / học sinh của lớp đã ký quỹ (escrow) có thể ảnh hưởng tới sổ tiền — hãy cân nhắc.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Môn</Label>
                <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tổng buổi</Label><Input type="number" value={form.totalSessions} onChange={e => setForm(f => ({ ...f, totalSessions: Number(e.target.value) }))} className="rounded-xl mt-1.5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Học sinh</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gia sư / GV</Label>
                <Select value={form.tutorId} onValueChange={v => setForm(f => ({ ...f, tutorId: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>{tutors.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hình thức</Label>
                <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Học phí (VNĐ)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: Number(e.target.value) }))} className="rounded-xl mt-1.5" /></div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave}>{editId ? "Cập nhật" : "Tạo lớp"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết lớp học</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải chi tiết...
            </div>
          ) : detailClass ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{detailClass.name}</h3>
                  <p className="text-sm text-muted-foreground">{detailClass.subject}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusColor[detailClass.status]}`}>
                  {statusLabel[detailClass.status] ?? detailClass.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Học sinh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {detailClass.studentAvatar && <img src={detailClass.studentAvatar} className="w-8 h-8 rounded-lg object-cover" />}
                    <span className="text-sm font-medium text-foreground">{detailClass.studentName || "—"}</span>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground">Gia sư</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {detailClass.tutorAvatar && <img src={detailClass.tutorAvatar} className="w-8 h-8 rounded-lg object-cover" />}
                    <span className="text-sm font-medium text-foreground">{detailClass.tutorName || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 p-3 rounded-xl">
                  <span className="text-muted-foreground block text-xs mb-1">Hình thức</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${formatColor[detailClass.format]}`}>
                    {detailClass.format.charAt(0).toUpperCase() + detailClass.format.slice(1)}
                  </span>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <span className="text-muted-foreground block text-xs mb-1">Học phí</span>
                  <span className="text-foreground font-semibold">{detailClass.fee.toLocaleString("vi-VN")}đ</span>
                </div>
                {buildSchedule(detailClass.weeklySlots) && (
                  <div className="bg-muted/50 p-3 rounded-xl col-span-2">
                    <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground text-xs">Lịch học</span></div>
                    <span className="text-foreground">{buildSchedule(detailClass.weeklySlots)}</span>
                  </div>
                )}
                {detailClass.totalSessions > 0 && (
                  <div className="bg-muted/50 p-3 rounded-xl col-span-2">
                    <span className="text-muted-foreground block text-xs mb-2">Tiến độ buổi học</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(detailClass.completedSessions / detailClass.totalSessions) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{detailClass.completedSessions}/{detailClass.totalSessions}</span>
                    </div>
                  </div>
                )}
                <div className="bg-muted/50 p-3 rounded-xl">
                  <span className="text-muted-foreground block text-xs mb-1">Ký quỹ (escrow)</span>
                  <span className="text-foreground font-semibold">{detailClass.escrowReleased.toLocaleString("vi-VN")} / {detailClass.escrowAmount.toLocaleString("vi-VN")}đ</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{statusLabel[detailClass.escrowStatus] ?? detailClass.escrowStatus}</span>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <span className="text-muted-foreground block text-xs mb-1">Ngày tạo</span>
                  <span className="text-foreground">{detailClass.createdAt?.slice(0, 10)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClasses;
