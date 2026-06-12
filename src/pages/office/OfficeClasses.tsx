import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, XCircle, BookOpen, Users, CheckCircle2, Search, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useClasses, useCreateClass } from "@/hooks/useClasses";
import { useAdminUsers } from "@/hooks/useAdmin";
import { useSubjects } from "@/hooks/useSubjects";
import type { ClassItem, WeeklySlotDto } from "@/types/api";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Đang học", variant: "default" },
  completed: { label: "Hoàn thành", variant: "secondary" },
  paused: { label: "Tạm dừng", variant: "outline" },
  searching: { label: "Đang tìm", variant: "destructive" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Build a human-readable schedule string from the class's weekly slots.
const buildSchedule = (slots: WeeklySlotDto[]): string => {
  if (!slots || slots.length === 0) return "Chưa xếp";
  const days = slots.map(s => dayLabels[s.dayOfWeek] ?? "").filter(Boolean).join(", ");
  const time = slots[0]?.startTime ? slots[0].startTime.slice(0, 5) : "";
  return time ? `${days} - ${time}` : days;
};

const OfficeClasses = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [newClass, setNewClass] = useState({ name: "", subjectId: "", fee: "", tutorId: "", studentId: "", schedule: "", totalSessions: "", description: "", startDate: "", endDate: "", level: "" });

  const { classes, isLoading, isError } = useClasses(
    statusFilter === "all" ? {} : { Status: statusFilter }
  );
  const createClass = useCreateClass();
  // Real pickers backed by GUIDs (CreateClassRequest needs studentId/tutorId/subjectId).
  const { subjects } = useSubjects();
  const { users } = useAdminUsers();
  const tutorOptions = users.filter((u) => u.role === "tutor" || u.role === "teacher");
  const studentOptions = users.filter((u) => u.role === "student");
  const canCreate = !!(newClass.name && newClass.subjectId && newClass.tutorId && newClass.studentId);

  const filtered = classes.filter((c: ClassItem) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tutorName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentName.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const detail = classes.find((c: ClassItem) => c.id === detailId);
  const activeCount = classes.filter((c: ClassItem) => c.status === "active").length;
  const completedCount = classes.filter((c: ClassItem) => c.status === "completed").length;
  const searchingCount = classes.filter((c: ClassItem) => c.status === "searching").length;
  const totalFee = classes.filter((c: ClassItem) => c.status === "active").reduce((s, c) => s + c.fee, 0);

  const handleCreate = () => {
    if (!canCreate) {
      toast({ title: "Vui lòng chọn môn học, gia sư và học sinh", variant: "destructive" });
      return;
    }
    // The backend requires >=1 weekly slot. There's no slot picker yet, so default to
    // one Mon 19:00-21:00 slot. TODO(BE): add a structured weekly-slot picker contract.
    const defaultSlots: WeeklySlotDto[] = [{ dayOfWeek: 1, startTime: "19:00:00", endTime: "21:00:00" }];
    createClass.mutate(
      {
        studentId: newClass.studentId,
        tutorId: newClass.tutorId,
        subjectId: newClass.subjectId,
        name: newClass.name,
        startDate: newClass.startDate || new Date().toISOString().slice(0, 10),
        totalSessions: parseInt(newClass.totalSessions) || 0,
        weeklySlots: defaultSlots,
        format: "online",
        fee: parseInt(newClass.fee) || 0,
      },
      {
        onSuccess: () => {
          setNewClass({ name: "", subjectId: "", fee: "", tutorId: "", studentId: "", schedule: "", totalSessions: "", description: "", startDate: "", endDate: "", level: "" });
          setShowCreate(false);
          toast({ title: "Tạo lớp thành công" });
        },
        onError: () => {
          toast({ title: "Tạo lớp thất bại", variant: "destructive" });
        },
      }
    );
  };

  const handleCancel = () => {
    if (cancelId && cancelReason) {
      toast({ title: "Đã hủy lớp", description: `Lý do: ${cancelReason}`, variant: "destructive" });
      setCancelId(null); setCancelReason("");
    }
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý lớp học</h1>
        <p className="text-muted-foreground text-sm">Theo dõi và quản lý các lớp đang hoạt động</p>
      </div> */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Đang hoạt động */}
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{activeCount}</p>
              <p className="text-xs text-white/80 mt-1">Đang hoạt động</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Hoàn thành */}
        <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{completedCount}</p>
              <p className="text-xs text-white/80 mt-1">Hoàn thành</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Đang tìm GS */}
        <Card className="border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{searchingCount}</p>
              <p className="text-xs text-white/80 mt-1">Đang tìm GS</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Học phí/tháng */}
        <Card className="border-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{totalFee.toLocaleString("vi-VN")}đ</p>
              <p className="text-xs text-white/80 mt-1">Học phí/tháng</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm lớp..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem><SelectItem value="active">Đang học</SelectItem><SelectItem value="completed">Hoàn thành</SelectItem><SelectItem value="searching">Đang tìm</SelectItem><SelectItem value="paused">Tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 mr-1" /> Tạo lớp mới</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Tạo lớp học mới</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
              <div><Label>Tên lớp <span className="text-destructive">*</span></Label><Input value={newClass.name} onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))} placeholder="VD: Toán 12 - Nâng cao" className="rounded-xl mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Môn học <span className="text-destructive">*</span></Label>
                  <Select value={newClass.subjectId} onValueChange={v => setNewClass(p => ({ ...p, subjectId: v }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Trình độ</Label>
                  <Select value={newClass.level} onValueChange={v => setNewClass(p => ({ ...p, level: v }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn" /></SelectTrigger>
                    <SelectContent><SelectItem value="basic">Cơ bản</SelectItem><SelectItem value="advanced">Nâng cao</SelectItem><SelectItem value="exam">Ôn thi</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Học phí (VNĐ/tháng)</Label><Input type="number" value={newClass.fee} onChange={e => setNewClass(p => ({ ...p, fee: e.target.value }))} placeholder="2000000" className="rounded-xl mt-1" /></div>
                <div><Label>Tổng buổi</Label><Input type="number" value={newClass.totalSessions} onChange={e => setNewClass(p => ({ ...p, totalSessions: e.target.value }))} placeholder="24" className="rounded-xl mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Gia sư / Giáo viên <span className="text-destructive">*</span></Label>
                  <Select value={newClass.tutorId} onValueChange={v => setNewClass(p => ({ ...p, tutorId: v }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn gia sư" /></SelectTrigger>
                    <SelectContent>{tutorOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Học sinh <span className="text-destructive">*</span></Label>
                  <Select value={newClass.studentId} onValueChange={v => setNewClass(p => ({ ...p, studentId: v }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn học sinh" /></SelectTrigger>
                    <SelectContent>{studentOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Lịch học</Label><Input value={newClass.schedule} onChange={e => setNewClass(p => ({ ...p, schedule: e.target.value }))} placeholder="VD: T2, T4, T6 - 19:00" className="rounded-xl mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ngày bắt đầu</Label><Input type="date" value={newClass.startDate} onChange={e => setNewClass(p => ({ ...p, startDate: e.target.value }))} className="rounded-xl mt-1" /></div>
                <div><Label>Ngày kết thúc (dự kiến)</Label><Input type="date" value={newClass.endDate} onChange={e => setNewClass(p => ({ ...p, endDate: e.target.value }))} className="rounded-xl mt-1" /></div>
              </div>
              <div><Label>Ghi chú</Label><Textarea value={newClass.description} onChange={e => setNewClass(p => ({ ...p, description: e.target.value }))} placeholder="Yêu cầu đặc biệt, mục tiêu học tập..." className="rounded-xl mt-1" rows={3} /></div>
              <Button onClick={handleCreate} className="w-full rounded-xl" disabled={!canCreate || createClass.isPending}>{createClass.isPending ? "Đang tạo..." : "Tạo lớp"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách lớp học...
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-muted-foreground">
              Không tải được danh sách lớp học. Vui lòng thử lại.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-10 h-10 mb-2 opacity-40" />
              Không tìm thấy lớp học phù hợp.
            </div>
          ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Lớp học</TableHead><TableHead>Gia sư</TableHead><TableHead>Học sinh</TableHead><TableHead>Lịch học</TableHead><TableHead>Học phí</TableHead><TableHead>Tiến độ</TableHead><TableHead>Trạng thái</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(c => {
                const cfg = statusMap[c.status] || statusMap.active;
                const progress = c.totalSessions > 0 ? Math.round((c.completedSessions / c.totalSessions) * 100) : 0;
                const schedule = buildSchedule(c.weeklySlots);
                return (
                  <TableRow key={c.id}>
                    <TableCell><div><p className="font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.subject}</p></div></TableCell>
                    <TableCell><div className="flex items-center gap-2">{c.tutorAvatar && <img src={c.tutorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />}<span className="text-sm">{c.tutorName}</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><span className="text-sm">{c.studentName}</span></div></TableCell>
                    <TableCell className="text-sm">{schedule}</TableCell>
                    <TableCell className="text-sm font-medium">{c.fee.toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell><div className="w-24"><Progress value={progress} className="h-2" /><p className="text-[10px] text-muted-foreground mt-1">{c.completedSessions}/{c.totalSessions} buổi</p></div></TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailId(c.id)}><Eye className="w-3.5 h-3.5" /></Button>
                        {c.status === "active" && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setCancelId(c.id)}><XCircle className="w-3.5 h-3.5" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Chi tiết lớp học</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div><p className="text-base font-semibold text-foreground">{detail.name}</p><p className="text-xs text-muted-foreground">{detail.subject}</p></div>
                <Badge variant={(statusMap[detail.status] || statusMap.active).variant}>{(statusMap[detail.status] || statusMap.active).label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Gia sư</Label><p className="text-sm font-medium text-foreground">{detail.tutorName}</p></div>
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Học sinh</Label><p className="text-sm font-medium text-foreground">{detail.studentName}</p></div>
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Lịch học</Label><p className="text-sm font-medium text-foreground">{buildSchedule(detail.weeklySlots)}</p></div>
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Học phí</Label><p className="text-sm font-medium text-foreground">{detail.fee.toLocaleString("vi-VN")}đ</p></div>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <Label className="text-[10px] text-muted-foreground">Tiến độ</Label>
                <div className="mt-2"><Progress value={detail.totalSessions > 0 ? (detail.completedSessions / detail.totalSessions) * 100 : 0} className="h-3" /></div>
                <p className="text-xs text-muted-foreground mt-1">{detail.completedSessions}/{detail.totalSessions} buổi đã hoàn thành</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive" /> Hủy lớp học</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Vui lòng nhập lý do hủy lớp:</p>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="VD: Học sinh chuyển trường, không tìm được gia sư phù hợp..." className="rounded-xl" rows={3} />
            <Button onClick={handleCancel} variant="destructive" className="w-full rounded-xl" disabled={!cancelReason.trim()}>Xác nhận hủy lớp</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeClasses;
