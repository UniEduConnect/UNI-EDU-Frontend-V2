import { useAttendance, useConfirmAttendance } from "@/hooks/useOffice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertTriangle, CalendarDays, ClipboardCheck, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xác nhận", variant: "outline" },
  confirmed: { label: "Đã xác nhận", variant: "default" },
  reported: { label: "Đã báo lỗi", variant: "destructive" },
  upcoming: { label: "Sắp tới", variant: "secondary" },
  completed: { label: "Đã học", variant: "default" },
};

const OfficeAttendance = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Live attendance from GET /api/Office/attendance — sole data source.
  const { attendance, isLoading, isError } = useAttendance(
    statusFilter === "all" ? {} : { Status: statusFilter }
  );
  const confirmMutation = useConfirmAttendance();
  const confirmAttendance = (id: string) => confirmMutation.mutate(id);

  const filtered = attendance.filter(a => {
    const matchSearch = a.className.toLowerCase().includes(search.toLowerCase()) || a.student.toLowerCase().includes(search.toLowerCase()) || a.tutor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const detail = attendance.find(a => a.id === detailId);
  const pending = attendance.filter(a => a.status === "pending").length;
  const completed = attendance.filter(a => a.status === "completed").length;
  const reported = attendance.filter(a => a.status === "reported").length;

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý điểm danh</h1>
        <p className="text-muted-foreground text-sm">Theo dõi và xác nhận buổi học</p>
      </div> */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Chờ xác nhận */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{pending}</p>
              <p className="text-xs text-white/80 mt-1">Chờ xác nhận</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Đã hoàn thành */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{completed}</p>
              <p className="text-xs text-white/80 mt-1">Đã hoàn thành</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Đã báo lỗi */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{reported}</p>
              <p className="text-xs text-white/80 mt-1">Đã báo lỗi</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Tổng buổi học */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{attendance.length}</p>
              <p className="text-xs text-white/80 mt-1">Tổng buổi học</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Danh sách buổi học</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="w-48 h-9 text-sm rounded-xl" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="completed">Đã học</SelectItem>
                  <SelectItem value="reported">Đã báo lỗi</SelectItem>
                  <SelectItem value="upcoming">Sắp tới</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Lớp học</TableHead><TableHead>Gia sư</TableHead><TableHead>Học sinh</TableHead><TableHead>Ngày</TableHead><TableHead>Giờ</TableHead><TableHead>Trạng thái</TableHead><TableHead>PH xác nhận</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách buổi học...</span>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Không tải được danh sách buổi học. Vui lòng thử lại.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Không có buổi học nào.
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => {
                const cfg = statusConfig[a.status] ?? statusConfig.pending;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.className}</TableCell>
                    <TableCell>{a.tutor}</TableCell>
                    <TableCell>{a.student}</TableCell>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell>{a.parentConfirmed ? <Badge variant="default">Đã xác nhận</Badge> : <Badge variant="outline">Chưa</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailId(a.id)}><Eye className="w-3.5 h-3.5" /></Button>
                        {a.status === "pending" && <Button size="sm" variant="outline" className="text-xs rounded-xl h-7" onClick={() => { confirmAttendance(a.id); toast({ title: "Đã xác nhận điểm danh" }); }}>Xác nhận</Button>}
                        {a.status === "reported" && <Button size="sm" variant="destructive" className="text-xs rounded-xl h-7" onClick={() => { confirmAttendance(a.id); toast({ title: "Đã xử lý sự cố" }); }}>Xử lý</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chi tiết điểm danh</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Lớp học</Label><p className="text-sm font-medium text-foreground">{detail.className}</p></div>
                <div><Label className="text-xs text-muted-foreground">Trạng thái</Label><div className="mt-1"><Badge variant={(statusConfig[detail.status] ?? statusConfig.pending).variant}>{(statusConfig[detail.status] ?? statusConfig.pending).label}</Badge></div></div>
                <div><Label className="text-xs text-muted-foreground">Gia sư</Label><p className="text-sm font-medium text-foreground">{detail.tutor}</p></div>
                <div><Label className="text-xs text-muted-foreground">Học sinh</Label><p className="text-sm font-medium text-foreground">{detail.student}</p></div>
                <div><Label className="text-xs text-muted-foreground">Ngày</Label><p className="text-sm font-medium text-foreground">{detail.date}</p></div>
                <div><Label className="text-xs text-muted-foreground">Giờ</Label><p className="text-sm font-medium text-foreground">{detail.time}</p></div>
                <div><Label className="text-xs text-muted-foreground">PH xác nhận</Label><p className="text-sm font-medium text-foreground">{detail.parentConfirmed ? "Đã xác nhận" : "Chưa xác nhận"}</p></div>
                <div><Label className="text-xs text-muted-foreground">VP xác nhận</Label><p className="text-sm font-medium text-foreground">{detail.officeConfirmed ? "Đã xác nhận" : "Chưa xác nhận"}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeAttendance;
