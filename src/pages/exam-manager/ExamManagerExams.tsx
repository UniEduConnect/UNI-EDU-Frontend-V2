import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVndInput, onlyDigits } from "@/lib/money";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, EyeOff, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useExams, useCreateExam, useUpdateExam, useDeleteExam } from "@/hooks/useExams";
import { getExam } from "@/services/exams";
import { useSubjects } from "@/hooks/useSubjects";
import { GenerateExamWithAiDialog } from "@/components/exams/GenerateExamWithAiDialog";
import type { ExamListItemResponse, CreateExamRequest, UpdateExamRequest } from "@/types/api";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Nháp", variant: "outline" },
  open: { label: "Đang mở", variant: "default" },
  closed: { label: "Đã đóng", variant: "secondary" },
  hidden: { label: "Tạm ẩn", variant: "destructive" },
};

const ExamManagerExams = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editExam, setEditExam] = useState<ExamListItemResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { exams, isLoading, isError } = useExams({
    Search: search || undefined,
    Status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { subjects } = useSubjects();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const defaultForm = {
    title: "", subjectId: "", description: "", duration: "90", fee: "10000", year: "2025",
    status: "draft", difficulty: "medium", type: "student-test",
    aiProctoring: true, startDate: "", endDate: "",
    maxAttemptsPerUser: "3", scoreScale: "10" as "10" | "100",
  };
  const [form, setForm] = useState(defaultForm);

  // Server already filters by Search/Status, so render the list as-is.
  const filtered = exams;

  const buildUpdatePayload = (): UpdateExamRequest => ({
    subjectId: form.subjectId,
    title: form.title,
    description: form.description,
    duration: parseInt(form.duration) || 0,
    type: form.type,
    status: form.status,
    difficulty: form.difficulty,
    fee: parseInt(form.fee) || 0,
    year: parseInt(form.year) || 0,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    maxAttemptsPerUser: parseInt(form.maxAttemptsPerUser) || 0,
    scoreScale: parseInt(form.scoreScale) || 10,
    aiProctoring: form.aiProctoring,
  });

  const handleCreate = () => {
    if (!form.title || !form.subjectId) {
      toast({ title: "Vui lòng nhập tên đề thi và chọn môn học", variant: "destructive" });
      return;
    }
    const payload: CreateExamRequest = {
      subjectId: form.subjectId,
      title: form.title,
      description: form.description,
      duration: parseInt(form.duration) || 0,
      type: form.type,
      status: form.status,
      difficulty: form.difficulty,
      fee: parseInt(form.fee) || 0,
      year: parseInt(form.year) || 0,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      maxAttemptsPerUser: parseInt(form.maxAttemptsPerUser) || 0,
      scoreScale: parseInt(form.scoreScale) || 10,
      aiProctoring: form.aiProctoring,
    };
    createExam.mutate(payload, {
      onSuccess: () => {
        setForm(defaultForm);
        setShowCreate(false);
        toast({ title: "Tạo đề thi thành công" });
      },
      onError: () => toast({ title: "Tạo đề thi thất bại", variant: "destructive" }),
    });
  };

  const handleEdit = () => {
    if (!editExam) return;
    updateExam.mutate(
      { id: editExam.id, payload: buildUpdatePayload() },
      {
        onSuccess: () => {
          setEditExam(null);
          toast({ title: "Cập nhật đề thi thành công" });
        },
        onError: () => toast({ title: "Cập nhật đề thi thất bại", variant: "destructive" }),
      }
    );
  };

  const openEdit = async (e: ExamListItemResponse) => {
    // The list item has no `description`; fetch the full exam so editing/saving
    // preserves it instead of blanking it (PUT /Exams/{id} overwrites the row).
    let description = "";
    try {
      description = (await getExam(e.id)).description ?? "";
    } catch {
      /* fall back to empty if the detail fetch fails */
    }
    setForm({
      title: e.title, subjectId: e.subjectId, description, duration: String(e.duration),
      fee: String(e.fee), year: String(e.year), status: e.status, difficulty: e.difficulty,
      type: e.type, aiProctoring: e.aiProctoring,
      startDate: e.startDate ?? "", endDate: e.endDate ?? "",
      maxAttemptsPerUser: String(e.maxAttemptsPerUser),
      scoreScale: (String(e.scoreScale) === "100" ? "100" : "10") as "10" | "100",
    });
    setEditExam(e);
  };

  // toggleExamVisibility: backend has no dedicated visibility flag — we flip
  // status between "hidden" and "open" via the full UpdateExamRequest body.
  // We fetch the full exam first so the toggle preserves `description`.
  // TODO(BE): a dedicated PATCH /Exams/{id}/status would avoid the full round-trip.
  const handleToggleVisibility = async (e: ExamListItemResponse) => {
    let description = "";
    try {
      description = (await getExam(e.id)).description ?? "";
    } catch {
      /* keep empty if the detail fetch fails */
    }
    const payload: UpdateExamRequest = {
      subjectId: e.subjectId,
      title: e.title,
      description,
      duration: e.duration,
      type: e.type,
      status: e.status === "hidden" ? "open" : "hidden",
      difficulty: e.difficulty,
      fee: e.fee,
      year: e.year,
      startDate: e.startDate ?? null,
      endDate: e.endDate ?? null,
      maxAttemptsPerUser: e.maxAttemptsPerUser,
      scoreScale: e.scoreScale,
      aiProctoring: e.aiProctoring,
    };
    updateExam.mutate(
      { id: e.id, payload },
      {
        onSuccess: () => toast({ title: e.status === "hidden" ? "Đã hiển thị đề thi" : "Đã ẩn đề thi" }),
        onError: () => toast({ title: "Cập nhật hiển thị thất bại", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (deleteConfirm == null) return;
    deleteExam.mutate(deleteConfirm, {
      onSuccess: () => {
        setDeleteConfirm(null);
        toast({ title: "Đã xóa đề thi", variant: "destructive" });
      },
      onError: () => toast({ title: "Xóa đề thi thất bại", variant: "destructive" }),
    });
  };

  const formFields = (
    <div className="space-y-4 pt-2 max-h-[65vh] overflow-y-auto pr-1">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-xl">
          <TabsTrigger value="basic" className="rounded-xl text-xs">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-xl text-xs">Thời gian & Giới hạn</TabsTrigger>
          <TabsTrigger value="scoring" className="rounded-xl text-xs">Chấm điểm</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div><Label>Tên đề thi</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Đề thi thử Toán THPT QG 2025" className="rounded-xl mt-1" /></div>
          <div><Label>Mô tả</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn về đề thi" className="rounded-xl mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Môn học</Label>
              <Select value={form.subjectId} onValueChange={v => setForm(p => ({ ...p, subjectId: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Năm áp dụng</Label><Input value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Thời gian (phút)</Label><Input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Phí thi (đ)</Label><Input type="text" inputMode="numeric" value={formatVndInput(form.fee)} onChange={e => setForm(p => ({ ...p, fee: onlyDigits(e.target.value) }))} className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Nháp</SelectItem><SelectItem value="open">Đang mở</SelectItem>
                  <SelectItem value="closed">Đã đóng</SelectItem><SelectItem value="hidden">Tạm ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Độ khó</Label>
              <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">Trung bình</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div><p className="text-sm font-medium text-foreground">AI Proctoring</p><p className="text-xs text-muted-foreground">Giám sát chống gian lận</p></div>
            <Switch checked={form.aiProctoring} onCheckedChange={v => setForm(p => ({ ...p, aiProctoring: v }))} />
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ngày mở đề</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Ngày đóng đề</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="rounded-xl mt-1" /></div>
          </div>
          <div><Label>Giới hạn lượt/user</Label><Input type="number" value={form.maxAttemptsPerUser} onChange={e => setForm(p => ({ ...p, maxAttemptsPerUser: e.target.value }))} className="rounded-xl mt-1" /><p className="text-[10px] text-muted-foreground mt-1">Số lần tối đa mỗi user được thi</p></div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4 mt-4">
          <div><Label>Thang điểm</Label>
            <Select value={form.scoreScale} onValueChange={v => setForm(p => ({ ...p, scoreScale: v as "10" | "100" }))}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">Thang 10</SelectItem><SelectItem value="100">Thang 100</SelectItem></SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input placeholder="Tìm kiếm đề thi..." value={search} onChange={e => setSearch(e.target.value)} className="w-64 h-9 text-sm rounded-xl" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem><SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="open">Đang mở</SelectItem><SelectItem value="closed">Đã đóng</SelectItem>
              <SelectItem value="hidden">Tạm ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <GenerateExamWithAiDialog buttonVariant="outline" triggerLabel="Tạo đề bằng AI" />
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="w-4 h-4 mr-1" /> Tạo đề thi mới</Button></DialogTrigger>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Tạo đề thi mới</DialogTitle></DialogHeader>{formFields}<Button onClick={handleCreate} disabled={createExam.isPending} className="w-full rounded-xl mt-2">{createExam.isPending ? "Đang tạo..." : "Tạo đề thi"}</Button></DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách đề thi...
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-muted-foreground">
              Không tải được danh sách đề thi. Vui lòng thử lại.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Không tìm thấy đề thi phù hợp.
            </div>
          ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Đề thi</TableHead><TableHead>Môn</TableHead><TableHead>Thời gian</TableHead><TableHead>Câu hỏi</TableHead><TableHead>Phí</TableHead><TableHead>Lượt thi</TableHead><TableHead>Trạng thái</TableHead><TableHead>Hiển thị</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium text-foreground text-sm">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground">{e.createdAt}</p>
                      {e.startDate && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {e.startDate} - {e.endDate}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{e.subject}</TableCell>
                  <TableCell className="text-sm">{e.duration} phút</TableCell>
                  <TableCell className="text-sm">{e.questionCount}</TableCell>
                  <TableCell className="text-sm">{e.fee.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{e.attempts.toLocaleString("vi-VN")}</p>
                    <p className="text-[10px] text-muted-foreground">{e.maxAttemptsPerUser.toLocaleString("vi-VN")}/user</p>
                  </TableCell>
                  <TableCell><Badge variant={statusConfig[e.status]?.variant || "outline"}>{statusConfig[e.status]?.label || e.status}</Badge></TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleVisibility(e)} disabled={updateExam.isPending} className="p-1 rounded hover:bg-muted">
                      {e.status !== "hidden" ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(e)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteConfirm(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editExam} onOpenChange={() => setEditExam(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Chỉnh sửa đề thi</DialogTitle></DialogHeader>{formFields}<Button onClick={handleEdit} disabled={updateExam.isPending} className="w-full rounded-xl mt-2">{updateExam.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm != null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent><DialogHeader><DialogTitle>Xác nhận xóa đề thi?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.</p>
          <div className="flex gap-2 mt-4"><Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl">Hủy</Button><Button variant="destructive" onClick={handleDelete} disabled={deleteExam.isPending} className="flex-1 rounded-xl">{deleteExam.isPending ? "Đang xóa..." : "Xóa đề thi"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamManagerExams;
