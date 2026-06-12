import { useState, useMemo } from "react";
import {
  useAdminUsers, useApproveUser, useRejectUser, useSuspendUser,
  useCreateUser, useUpdateUser, useDeleteUser,
} from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Eye, Pencil, Plus, Search, Users, UserCheck, GraduationCap, UserPlus, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { AdminUserResponse } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const emptyEdit = { fullname: "", phoneNumber: "", email: "", school: "", grade: 0, gender: "", degree: "", studentIdNumber: "", bio: "" };

const emptyCreate = { email: "", password: "", fullname: "", phoneNumber: "", role: "student", school: "", grade: 10, gender: "Male", studentIdNumber: "", degree: "" };

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("vi-VN");
};

const initial = (name?: string) => (name?.trim()?.[0] || "?").toUpperCase();

const Avatar = ({ src, name, className }: { src?: string | null; name: string; className: string }) =>
  src ? (
    <img src={src} alt={name} className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-muted text-foreground/70 flex items-center justify-center text-sm font-semibold`}>
      {initial(name)}
    </div>
  );

const roleTabs = [
  { value: "all", label: "Tất cả", icon: Users },
  { value: "tutor", label: "Gia sư", icon: GraduationCap },
  { value: "teacher", label: "Giáo viên", icon: UserCheck },
  { value: "student", label: "Học sinh", icon: UserPlus },
  { value: "parent", label: "Phụ huynh", icon: Users },
  { value: "office", label: "Văn phòng", icon: Users },
  { value: "finance", label: "Tài chính", icon: Users },
  { value: "exam-manager", label: "Phòng thi", icon: Users },
];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Hoạt động" },
  { value: "rejected", label: "Từ chối" },
  { value: "suspended", label: "Tạm khóa" },
];

const statusLabel: Record<string, string> = { pending: "Chờ duyệt", approved: "Hoạt động", rejected: "Từ chối", suspended: "Tạm khóa" };
const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  suspended: "bg-slate-100 text-slate-700",
};
const roleLabel: Record<string, string> = { tutor: "Gia sư", teacher: "Giáo viên", student: "Học sinh", parent: "Phụ huynh", admin: "Admin", office: "Văn phòng", finance: "Tài chính", "exam-manager": "Phòng thi" };

const ITEMS_PER_PAGE = 8;

const AdminUsers = () => {
  // Live users from /api/Admin/users — real data only (no mock fallback).
  const { users, isLoading, isError } = useAdminUsers();
  const approveUser = useApproveUser();
  const suspendUser = useSuspendUser();
  const rejectUserMutation = useRejectUser();
  const createUserMut = useCreateUser();
  const updateUserMut = useUpdateUser();
  const deleteUserMut = useDeleteUser();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<AdminUserResponse | null>(null);
  const [rejectUserTarget, setRejectUserTarget] = useState<AdminUserResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [page, setPage] = useState(1);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyCreate);
  const [editTarget, setEditTarget] = useState<AdminUserResponse | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserResponse | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => users.filter(u => {
    if (tab !== "all" && u.role !== tab) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [users, tab, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteUserMut.mutate(deleteTarget.id, {
      onSuccess: () => toast({ title: `Đã xóa ${name}`, variant: "destructive" }),
      onError: (e) => toast({ title: e instanceof Error ? e.message : "Xóa thất bại", variant: "destructive" }),
    });
    setDeleteTarget(null);
  };

  const handleCreate = () => {
    if (!addForm.email || !addForm.password || !addForm.fullname || !addForm.phoneNumber) {
      toast({ title: "Vui lòng điền email, mật khẩu, họ tên, SĐT", variant: "destructive" });
      return;
    }
    createUserMut.mutate(addForm, {
      onSuccess: () => { toast({ title: "Đã tạo người dùng" }); setShowAdd(false); setAddForm(emptyCreate); },
      onError: (e) => toast({ title: e instanceof Error ? e.message : "Tạo thất bại", variant: "destructive" }),
    });
  };

  const openEdit = (u: AdminUserResponse) => {
    setEditTarget(u);
    setEditForm({
      fullname: u.name || "",
      phoneNumber: u.phone || "",
      email: u.email || "",
      school: u.school || "",
      grade: u.grade || 0,
      gender: u.gender || "",
      degree: u.degree || "",
      studentIdNumber: u.studentIdNumber || "",
      bio: u.bio || "",
    });
  };

  const handleEdit = () => {
    if (!editTarget) return;
    updateUserMut.mutate(
      {
        id: editTarget.id,
        payload: {
          fullname: editForm.fullname,
          phoneNumber: editForm.phoneNumber,
          email: editForm.email,
          school: editForm.school,
          grade: Number(editForm.grade) || undefined,
          gender: editForm.gender,
          degree: editForm.degree,
          studentIdNumber: editForm.studentIdNumber,
          bio: editForm.bio,
        },
      },
      {
        onSuccess: () => { toast({ title: "Đã cập nhật người dùng" }); setEditTarget(null); },
        onError: (e) => toast({ title: e instanceof Error ? e.message : "Cập nhật thất bại", variant: "destructive" }),
      },
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    if (status === "rejected") {
      const u = users.find(u => u.id === id);
      if (u) {
        setRejectUserTarget(u);
        setRejectReason("");
      }
      return;
    }

    const mutation = status === "suspended" ? suspendUser : approveUser;
    mutation.mutate(id, {
      onSuccess: () => toast({ title: "Đã cập nhật trạng thái" }),
      onError: (e) => toast({ title: e instanceof Error ? e.message : "Cập nhật thất bại", variant: "destructive" }),
    });
  };

  const handleRejectConfirm = () => {
    if (!rejectUserTarget) return;
    const reason = rejectReason.trim() || "Lý do không được cung cấp";
    rejectUserMutation.mutate(
      { id: rejectUserTarget.id, payload: { reason } },
      {
        onSuccess: () => toast({ title: `Đã từ chối ${rejectUserTarget.name}` }),
        onError: (e) => toast({ title: e instanceof Error ? e.message : "Từ chối thất bại", variant: "destructive" }),
      },
    );
    setRejectUserTarget(null);
    setRejectReason("");
  };

  const handleRejectCancel = () => {
    setRejectUserTarget(null);
    setRejectReason("");
  };

  const resetFilters = () => {
    setTab("all"); setSearch(""); setStatusFilter("all"); setPage(1);
  };

  const stats = useMemo(() => ({
    total: users.length,
    tutors: users.filter(u => u.role === "tutor" || u.role === "teacher").length,
    students: users.filter(u => u.role === "student").length,
    pending: users.filter(u => u.status === "pending").length,
  }), [users]);

  const pendingApprovals = users.filter(u => u.status === "pending");

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng người dùng", value: stats.total, icon: Users, fg: "from-blue-700 to-blue-900" },
          { label: "Gia sư & Giáo viên", value: stats.tutors, icon: GraduationCap, fg: "from-emerald-500 to-teal-500" },
          { label: "Học sinh", value: stats.students, icon: UserPlus, fg: "from-amber-500 to-orange-500" },
          { label: "Chờ duyệt", value: stats.pending, icon: UserCheck, fg: "from-rose-500 to-pink-500" },
        ].map((s, i) => (
          <Card key={i} className={`border-0 shadow-soft text-white bg-gradient-to-r ${s.fg}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">{s.label}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm theo tên, email hoặc môn..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10 h-11 rounded-2xl bg-white/80 border border-slate-200 shadow-sm" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-48 h-11 rounded-2xl bg-card border-border"><SelectValue placeholder="Lọc trạng thái" /></SelectTrigger>
          <SelectContent>{statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        {(search || statusFilter !== "all" || tab !== "all") && (
          <Button variant="outline" onClick={resetFilters} className="h-11 rounded-2xl">Xóa lọc</Button>
        )}
        <Button onClick={() => { setAddForm(emptyCreate); setShowAdd(true); }} className="h-11 rounded-2xl gap-1.5">
          <Plus className="w-4 h-4" /> Thêm người dùng
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Tìm thấy <span className="font-semibold text-foreground">{filtered.length}</span> người dùng</p>

      <Card className="border-0 shadow-soft">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Yêu cầu phê duyệt ({pendingApprovals.length})</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-blue-500 text-blue-600 bg-white/80 hover:bg-blue-50 hover:text-blue-800 transition-colors duration-200"
              onClick={() => {
                setTab("all");
                setStatusFilter("pending");
                setPage(1);
                setShowPendingDialog(true);
              }}
            >Xem tất cả</Button>
          </div>
          {pendingApprovals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có yêu cầu chờ duyệt.</p>
          ) : (
            <div className="space-y-2">
              {pendingApprovals.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} className="w-9 h-9 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{roleLabel[u.role] || u.role} · {u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleStatusChange(u.id, "approved")} className="rounded-lg h-8"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Duyệt</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.id, "rejected")} className="rounded-lg h-8"><XCircle className="w-3.5 h-3.5 mr-1" />Từ chối</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
        <DialogContent className="rounded-2xl max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Danh sách chờ duyệt</DialogTitle>
          </DialogHeader>
          <div className="h-72 overflow-y-auto">
            <div className="space-y-2">
              {pendingApprovals.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">Không có yêu cầu chờ duyệt.</p>
              ) : (
                pendingApprovals.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} className="w-9 h-9 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{roleLabel[u.role] || u.role} · {u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="rounded-lg h-8 bg-blue-700 text-white hover:bg-blue-800" onClick={() => handleStatusChange(u.id, "approved")}>Duyệt</Button>
                      <Button size="sm" className="rounded-lg h-8 bg-rose-500 text-white hover:bg-rose-600" onClick={() => handleStatusChange(u.id, "rejected")}>Từ chối</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!rejectUserTarget} onOpenChange={(open) => { if (!open) setRejectUserTarget(null); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Nhập lý do từ chối</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Vui lòng cung cấp lý do để cập nhật nhật ký</p>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Nhập lý do tại đây..."
              className="h-28"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleRejectCancel} className="h-10">Hủy</Button>
              <Button onClick={handleRejectConfirm} className="h-10">Xác nhận</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Role tabs */}
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-2xl w-fit">
        {roleTabs.map(r => (
          <button key={r.value} onClick={() => { setTab(r.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${tab === r.value ? "bg-blue-700 text-white shadow-sm" : "text-muted-foreground hover:text-slate-700"}`}>
            <r.icon className="w-3.5 h-3.5" />
            {r.label}
          </button>
        ))}
      </div>

      

      {/* Table */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Người dùng</TableHead>
                <TableHead className="font-semibold">Vai trò</TableHead>
                <TableHead className="font-semibold">Môn dạy</TableHead>
                <TableHead className="font-semibold">Đánh giá</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ngày tạo</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} className="w-9 h-9 rounded-xl" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground">{roleLabel[u.role] || u.role}</span></TableCell>
                  <TableCell>{u.school ? <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium">{u.school}</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">—</span></TableCell>
                  <TableCell>
                    <Select value={u.status} onValueChange={v => handleStatusChange(u.id, v)}>
                      <SelectTrigger className={`w-28 h-7 text-[11px] rounded-full border-0 font-medium ${statusColor[u.status]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="approved">Hoạt động</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                        <SelectItem value="suspended">Tạm khóa</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setDetail(u)}><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(u)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                      {currentUser?.id !== u.id && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)}><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    {isLoading ? (
                      <span className="inline-flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải người dùng...
                      </span>
                    ) : isError ? (
                      "Không tải được danh sách người dùng. Vui lòng thử lại."
                    ) : (
                      "Không tìm thấy người dùng"
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Chi tiết người dùng</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={detail.avatar} name={detail.name} className="w-16 h-16 rounded-2xl" />
                <div>
                  <p className="font-bold text-lg text-foreground">{detail.name}</p>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium">{roleLabel[detail.role]}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">Email</span><span className="text-foreground">{detail.email}</span></div>
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">SĐT</span><span className="text-foreground">{detail.phone}</span></div>
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">Trạng thái</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[detail.status]}`}>{statusLabel[detail.status]}</span></div>
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">Ngày tạo</span><span className="text-foreground">{fmtDate(detail.createdAt)}</span></div>
                {detail.school && <div className="bg-muted/50 p-3 rounded-xl col-span-2"><span className="text-muted-foreground block text-xs mb-1">Trường</span><span className="text-foreground">{detail.school}</span></div>}
                {detail.studentIdNumber && <div className="bg-muted/50 p-3 rounded-xl col-span-2"><span className="text-muted-foreground block text-xs mb-1">MSSV</span><span className="text-foreground">{detail.studentIdNumber}</span></div>}
              </div>
              {detail.bio && <p className="text-sm text-foreground bg-muted/50 p-3 rounded-xl">{detail.bio}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add user */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Thêm người dùng</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Họ và tên</Label><Input value={addForm.fullname} onChange={e => setAddForm(f => ({ ...f, fullname: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
              <div><Label>Số điện thoại</Label><Input value={addForm.phoneNumber} onChange={e => setAddForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mật khẩu</Label><Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
              <div><Label>Vai trò</Label>
                <Select value={addForm.role} onValueChange={v => setAddForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Học sinh</SelectItem>
                    <SelectItem value="parent">Phụ huynh</SelectItem>
                    <SelectItem value="tutor">Gia sư</SelectItem>
                    <SelectItem value="teacher">Giáo viên</SelectItem>
                    <SelectItem value="office">Văn phòng</SelectItem>
                    <SelectItem value="finance">Tài chính</SelectItem>
                    <SelectItem value="exam-manager">Phòng thi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {addForm.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Trường</Label><Input value={addForm.school} onChange={e => setAddForm(f => ({ ...f, school: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
                <div><Label>Khối lớp</Label><Input type="number" value={addForm.grade} onChange={e => setAddForm(f => ({ ...f, grade: Number(e.target.value) }))} className="mt-1.5 rounded-xl" /></div>
              </div>
            )}
            {(addForm.role === "tutor" || addForm.role === "teacher") && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Bằng cấp</Label><Input value={addForm.degree} onChange={e => setAddForm(f => ({ ...f, degree: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
                <div><Label>MSSV</Label><Input value={addForm.studentIdNumber} onChange={e => setAddForm(f => ({ ...f, studentIdNumber: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="h-10">Hủy</Button>
              <Button onClick={handleCreate} className="h-10">Tạo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit user */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Chỉnh sửa người dùng {editTarget && <span className="text-sm font-normal text-muted-foreground">· {roleLabel[editTarget.role] || editTarget.role}</span>}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Họ và tên</Label><Input value={editForm.fullname} onChange={e => setEditForm(f => ({ ...f, fullname: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
              <div><Label>Số điện thoại</Label><Input value={editForm.phoneNumber} onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
            {editTarget?.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Trường</Label><Input value={editForm.school} onChange={e => setEditForm(f => ({ ...f, school: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
                <div><Label>Khối lớp</Label><Input type="number" value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: Number(e.target.value) }))} className="mt-1.5 rounded-xl" /></div>
              </div>
            )}
            {(editTarget?.role === "tutor" || editTarget?.role === "teacher") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Giới tính</Label>
                    <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Chọn" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Nam</SelectItem>
                        <SelectItem value="Female">Nữ</SelectItem>
                        <SelectItem value="Other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>MSSV</Label><Input value={editForm.studentIdNumber} onChange={e => setEditForm(f => ({ ...f, studentIdNumber: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Trường</Label><Input value={editForm.school} onChange={e => setEditForm(f => ({ ...f, school: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
                  <div><Label>Bằng cấp</Label><Input value={editForm.degree} onChange={e => setEditForm(f => ({ ...f, degree: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
                </div>
                <div><Label>Giới thiệu (bio)</Label><Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditTarget(null)} className="h-10">Hủy</Button>
              <Button onClick={handleEdit} className="h-10">Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Xóa người dùng</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-10">Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete} className="h-10">Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
