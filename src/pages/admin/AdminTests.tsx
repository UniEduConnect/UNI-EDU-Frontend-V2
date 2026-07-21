import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVndInput, onlyDigits } from "@/lib/money";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Eye, Search, Loader2 } from "lucide-react";
import { useExams, useCreateExam, useUpdateExam, useDeleteExam } from "@/hooks/useExams";
import { useSubjects } from "@/hooks/useSubjects";
import type { ExamListItemResponse } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
  hidden: "bg-muted text-muted-foreground",
};
const statusLabel: Record<string, string> = {
  open: "Mở",
  draft: "Bản nháp",
  closed: "Đã đóng",
  hidden: "Đã ẩn",
};
const typeLabel: Record<string, string> = {
  "tutor-test": "Bài của gia sư",
  "student-test": "Bài cho học sinh",
};

interface ExamForm {
  title: string;
  subjectId: string;
  description: string;
  duration: number;
  fee: number;
  year: number;
  type: string;
  status: string;
  difficulty: string;
  aiProctoring: boolean;
}

const emptyForm: ExamForm = {
  title: "",
  subjectId: "",
  description: "",
  duration: 60,
  fee: 0,
  year: new Date().getFullYear(),
  type: "student-test",
  status: "draft",
  difficulty: "medium",
  aiProctoring: false,
};

const AdminTests = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const examsQuery = useMemo(
    () => ({
      Search: search || undefined,
      Status: filterStatus !== "all" ? filterStatus : undefined,
    }),
    [search, filterStatus]
  );

  const { exams, isLoading, isError } = useExams(examsQuery);
  const { subjects } = useSubjects();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [viewingExam, setViewingExam] = useState<ExamListItemResponse | null>(null);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (t: ExamListItemResponse) => {
    setForm({
      title: t.title,
      subjectId: t.subjectId,
      // ExamListItemResponse has no description; preserved on update only if re-entered.
      description: "",
      duration: t.duration,
      fee: t.fee,
      year: t.year,
      type: t.type,
      status: t.status,
      difficulty: t.difficulty,
      aiProctoring: t.aiProctoring,
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.subjectId) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    if (editId) {
      updateExam.mutate(
        {
          id: editId,
          payload: {
            subjectId: form.subjectId,
            title: form.title,
            description: form.description,
            duration: form.duration,
            type: form.type,
            status: form.status,
            difficulty: form.difficulty,
            fee: form.fee,
            year: form.year,
            aiProctoring: form.aiProctoring,
            maxAttemptsPerUser: 1,
            scoreScale: 10,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Đã cập nhật bài test" });
            setShowForm(false);
          },
          onError: () => toast({ title: "Cập nhật bài test thất bại", variant: "destructive" }),
        }
      );
    } else {
      createExam.mutate(
        {
          subjectId: form.subjectId,
          title: form.title,
          description: form.description,
          duration: form.duration,
          type: form.type,
          status: form.status,
          difficulty: form.difficulty,
          fee: form.fee,
          year: form.year,
          aiProctoring: form.aiProctoring,
        },
        {
          onSuccess: () => {
            toast({ title: `Đã tạo bài test "${form.title}"` });
            setShowForm(false);
          },
          onError: () => toast({ title: "Tạo bài test thất bại", variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = (t: ExamListItemResponse) => {
    deleteExam.mutate(t.id, {
      onSuccess: () => toast({ title: `Đã xóa ${t.title}`, variant: "destructive" }),
      onError: () => toast({ title: "Xóa bài test thất bại", variant: "destructive" }),
    });
  };

  const handleStatusChange = (t: ExamListItemResponse, status: string) => {
    updateExam.mutate(
      {
        id: t.id,
        payload: {
          subjectId: t.subjectId,
          title: t.title,
          // ExamListItemResponse carries no description; send empty on inline status change.
          description: "",
          duration: t.duration,
          type: t.type,
          status,
          difficulty: t.difficulty,
          fee: t.fee,
          year: t.year,
          aiProctoring: t.aiProctoring,
          maxAttemptsPerUser: t.maxAttemptsPerUser,
          scoreScale: t.scoreScale,
        },
      },
      {
        onError: () => toast({ title: "Cập nhật trạng thái thất bại", variant: "destructive" }),
      }
    );
  };

  const saving = createExam.isPending || updateExam.isPending;

  return (
    <div className="p-6 space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm bài test..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 rounded-xl bg-card border-border" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="open">Mở</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
              <SelectItem value="hidden">Đã ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="rounded-xl" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tạo bài test mới</Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Mã</TableHead>
                <TableHead className="font-semibold">Tên bài test</TableHead>
                <TableHead className="font-semibold">Môn / Năm</TableHead>
                <TableHead className="font-semibold">Loại hình</TableHead>
                <TableHead className="font-semibold">Câu hỏi</TableHead>
                <TableHead className="font-semibold">Lượt thi</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải bài test...</span>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">Không tải được danh sách bài test. Vui lòng thử lại.</TableCell>
                </TableRow>
              ) : exams.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Không tìm thấy bài test</TableCell></TableRow>
              ) : (
                exams.map(t => (
                  <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-sm text-muted-foreground">{t.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{t.title}</TableCell>
                    <TableCell><div className="text-sm"><span className="text-foreground">{t.subject}</span><span className="text-muted-foreground"> · {t.year}</span></div></TableCell>
                    <TableCell><span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground">{typeLabel[t.type] ?? t.type}</span></TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{t.questionCount}</TableCell>
                    <TableCell className="text-sm font-semibold text-foreground">{t.attempts}</TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={v => handleStatusChange(t, v)}>
                        <SelectTrigger className={`w-28 h-7 text-[11px] rounded-full border-0 font-medium ${statusColor[t.status] ?? ""}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Mở</SelectItem>
                          <SelectItem value="draft">Bản nháp</SelectItem>
                          <SelectItem value="closed">Đã đóng</SelectItem>
                          <SelectItem value="hidden">Đã ẩn</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" title="Xem chi tiết" onClick={() => setViewingExam(t)}><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(t)}><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => handleDelete(t)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa bài test" : "Tạo bài test mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* TODO(BE): test code field not on exam DTO */}
              <div><Label>Môn</Label>
                <Select value={form.subjectId} onValueChange={v => setForm(f => ({ ...f, subjectId: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Năm</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="rounded-xl mt-1.5" /></div>
            </div>
            <div><Label>Tên bài test</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl mt-1.5" /></div>
            <div><Label>Mô tả</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl mt-1.5" placeholder="Mô tả ngắn về bài test" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Thời lượng (phút)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className="rounded-xl mt-1.5" /></div>
              <div><Label>Học phí (đ)</Label><Input type="text" inputMode="numeric" value={formatVndInput(form.fee)} onChange={e => setForm(f => ({ ...f, fee: Number(onlyDigits(e.target.value)) }))} className="rounded-xl mt-1.5" /></div>
              <div><Label>Độ khó</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Dễ</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* TODO(BE): question-type (multiple-choice/essay) not on exam DTO; exam type is tutor-test/student-test */}
              <div><Label>Loại hình</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student-test">Bài cho học sinh</SelectItem>
                    <SelectItem value="tutor-test">Bài của gia sư</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Giám sát AI</Label>
                <Select value={form.aiProctoring ? "yes" : "no"} onValueChange={v => setForm(f => ({ ...f, aiProctoring: v === "yes" }))}>
                  <SelectTrigger className="rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Tắt</SelectItem>
                    <SelectItem value="yes">Bật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* TODO(BE): test level (e.g. "Lớp 12", "IELTS") not on exam DTO */}
            <Button className="w-full rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</span> : editId ? "Cập nhật" : "Tạo bài test"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewingExam} onOpenChange={() => setViewingExam(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewingExam?.title} — {viewingExam?.questionCount} câu hỏi</DialogTitle></DialogHeader>
          {viewingExam && (
            <div className="space-y-4">
              <div className="flex gap-2 text-xs flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">{viewingExam.subject}</span>
                <span className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium">{viewingExam.year}</span>
                <span className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium">{typeLabel[viewingExam.type] ?? viewingExam.type}</span>
                <span className={`px-2.5 py-1 rounded-full font-medium ${statusColor[viewingExam.status] ?? ""}`}>{statusLabel[viewingExam.status] ?? viewingExam.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-xl p-3"><p className="text-xs text-muted-foreground">Thời lượng</p><p className="font-semibold text-foreground">{viewingExam.duration} phút</p></div>
                <div className="bg-muted/30 rounded-xl p-3"><p className="text-xs text-muted-foreground">Học phí</p><p className="font-semibold text-foreground">{viewingExam.fee.toLocaleString("vi-VN")}đ</p></div>
                <div className="bg-muted/30 rounded-xl p-3"><p className="text-xs text-muted-foreground">Độ khó</p><p className="font-semibold text-foreground">{viewingExam.difficulty}</p></div>
                <div className="bg-muted/30 rounded-xl p-3"><p className="text-xs text-muted-foreground">Lượt thi</p><p className="font-semibold text-foreground">{viewingExam.attempts}</p></div>
              </div>
              {/* TODO(BE): full question list requires ExamDetailResponse (GET /api/exams/{id}); list item only exposes questionCount */}
              <p className="text-xs text-muted-foreground">Danh sách câu hỏi chi tiết cần tải từ chi tiết bài thi.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTests;
