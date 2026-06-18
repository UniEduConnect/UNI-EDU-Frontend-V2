import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Users,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useRegistrations,
  useApproveRegistration,
  useRejectRegistration,
} from "@/hooks/useAppointments";

const roleLabels: Record<string, string> = {
  student: "Học sinh",
  tutor: "Gia sư",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
};

const statusCfg: Record<
  string,
  { label: string; variant: "default" | "destructive" | "outline" }
> = {
  pending: { label: "Chờ duyệt", variant: "outline" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
  suspended: { label: "Tạm khóa", variant: "destructive" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("vi-VN");
};

const OfficeRegistrations = () => {
  const { toast } = useToast();
  // Live data from GET /api/Office/registrations (AdminUserResponse[]).
  const { registrations: regs, isLoading, isError } = useRegistrations();
  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = regs.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || r.role === roleFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const detail = regs.find(r => r.id === detailId);
  const pendingCount = regs.filter(r => r.status === "pending").length;
  const teacherTutorCount = regs.filter(r => r.role === "tutor" || r.role === "teacher").length;
  const studentCount = regs.filter(r => r.role === "student").length;
  const approvedCount = regs.filter(r => r.status === "approved").length;

  const approve = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast({ title: "Đã duyệt đăng ký" }),
      onError: () =>
        toast({ title: "Không thể duyệt đăng ký", variant: "destructive" }),
    });
  };

  const reject = () => {
    if (rejectId && rejectReason.trim()) {
      rejectMutation.mutate(
        { id: rejectId, note: rejectReason.trim() },
        {
          onSuccess: () => {
            toast({ title: "Đã từ chối đăng ký", variant: "destructive" });
            setRejectId(null);
            setRejectReason("");
          },
          onError: () =>
            toast({ title: "Không thể từ chối đăng ký", variant: "destructive" }),
        }
      );
    }
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quản lý đăng ký</h2>
            <p className="mt-1 text-sm text-white/80">
              Theo dõi hồ sơ đăng ký mới và xét duyệt học sinh, phụ huynh, gia sư, giáo viên
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Chờ duyệt</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Đã duyệt</p>
              <p className="text-xl font-bold">{approvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Chờ duyệt",
            value: pendingCount,
            sub: "Hồ sơ cần xử lý",
            icon: UserPlus,
            color: "from-blue-700 to-blue-900",
          },
          {
            label: "GS/GV đăng ký",
            value: teacherTutorCount,
            sub: "Gia sư & giáo viên",
            icon: GraduationCap,
            color: "from-blue-700 to-blue-900",
          },
          {
            label: "HS đăng ký",
            value: studentCount,
            sub: "Học sinh mới",
            icon: BookOpen,
            color: "from-blue-700 to-blue-900",
          },
          {
            label: "Đã duyệt",
            value: approvedCount,
            sub: "Hồ sơ hợp lệ",
            icon: Users,
            color: "from-blue-700 to-blue-900",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white transition-all hover:shadow-lg ${s.color}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0" />
          </div>
        ))}
      </div>

      {/* FILTER */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="tutor">Gia sư</SelectItem>
              <SelectItem value="teacher">Giáo viên</SelectItem>
              <SelectItem value="student">Học sinh</SelectItem>
              <SelectItem value="parent">Phụ huynh</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[150px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LIST */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Danh sách đăng ký</h3>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải hồ sơ đăng ký...
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Không tải được hồ sơ đăng ký. Vui lòng thử lại.
            </div>
          ) : (
            <>
              {filtered.map(r => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {r.avatar ? (
                        <img
                          src={r.avatar}
                          alt={r.name}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{r.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {roleLabels[r.role] ?? r.role}
                          </Badge>
                          <Badge variant={statusCfg[r.status]?.variant ?? "outline"}>
                            {statusCfg[r.status]?.label ?? r.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{r.email}</span>
                          <span>{r.phone}</span>
                          <span>Ngày đăng ký: {formatDate(r.createdAt)}</span>
                        </div>

                        {r.school && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Trường: <strong>{r.school}</strong>
                          </p>
                        )}

                        {r.bio && (
                          <div className="mt-2 rounded-xl bg-muted/60 p-3">
                            <p className="text-xs text-muted-foreground">
                              <strong>Giới thiệu:</strong> {r.bio}
                            </p>
                          </div>
                        )}
                        {/* TODO(BE): registration application has no documents/verification-detail/reject-reason fields (only the AdminUserResponse user row) */}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl p-0"
                        onClick={() => setDetailId(r.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {r.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 rounded-xl p-0 text-primary"
                            onClick={() => approve(r.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 rounded-xl p-0 text-destructive"
                            onClick={() => setRejectId(r.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  Không có hồ sơ đăng ký phù hợp
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DETAIL */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đăng ký</DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
                {detail.avatar ? (
                  <img
                    src={detail.avatar}
                    alt={detail.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                    {detail.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-foreground">{detail.name}</p>
                  <Badge variant="outline">{roleLabels[detail.role] ?? detail.role}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Email</Label>
                  <p className="text-sm text-foreground">{detail.email}</p>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Số điện thoại</Label>
                  <p className="text-sm text-foreground">{detail.phone}</p>
                </div>

                {detail.school && (
                  <div className="rounded-xl bg-muted/40 p-3">
                    <Label className="text-[10px] text-muted-foreground">Trường</Label>
                    <p className="text-sm text-foreground">{detail.school}</p>
                  </div>
                )}

                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Ngày đăng ký</Label>
                  <p className="text-sm text-foreground">{formatDate(detail.createdAt)}</p>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Trạng thái</Label>
                  <p className="text-sm text-foreground">
                    {statusCfg[detail.status]?.label ?? detail.status}
                  </p>
                </div>
              </div>

              {detail.bio && (
                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Giới thiệu</Label>
                  <p className="mt-1 text-sm text-foreground">{detail.bio}</p>
                </div>
              )}
              {/* TODO(BE): registration application has no documents/verification-detail/reject-reason fields (only the AdminUserResponse user row) */}

              {detail.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      approve(detail.id);
                      setDetailId(null);
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Duyệt
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setDetailId(null);
                      setRejectId(detail.id);
                    }}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Từ chối
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REJECT */}
      <Dialog
        open={!!rejectId}
        onOpenChange={() => {
          setRejectId(null);
          setRejectReason("");
        }}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Từ chối đăng ký
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="VD: Thiếu chứng chỉ, thông tin không hợp lệ..."
              className="rounded-xl"
              rows={3}
            />
            <Button
              onClick={reject}
              variant="destructive"
              className="w-full rounded-xl"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeRegistrations;