import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, CheckCircle2, AlertTriangle, Search, User, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useCompleteAppointment,
} from "@/hooks/useAppointments";
import type { AppointmentItem } from "@/types/api";

// TODO(BE): appointment 'type' (complaint/dispute/consultation/matching) + multi-participant
// arrays are not modeled by the DTO (only title/description/withName/withUserId/scheduledAt/notes).
// We render the single counterpart via withName and the resolution via free-text notes.

// Backend status is a free-text string. Normalize for badge styling; unknown values fall through.
const statusCfg: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Đã lên lịch", variant: "outline" },
  "in-progress": { label: "Đang xử lý", variant: "default" },
  inprogress: { label: "Đang xử lý", variant: "default" },
  completed: { label: "Hoàn tất", variant: "secondary" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
  canceled: { label: "Đã hủy", variant: "destructive" },
};

const statusFor = (status: string) =>
  statusCfg[status?.toLowerCase()] ?? { label: status || "—", variant: "outline" as const };

const isOpen = (status: string) => {
  const s = status?.toLowerCase();
  return s !== "completed" && s !== "cancelled" && s !== "canceled";
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const OfficeAppointments = () => {
  const { toast } = useToast();
  const { appointments, isLoading, isError } = useAppointments();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();
  const completeAppointment = useCompleteAppointment();

  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWithName, setNewWithName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter((a: AppointmentItem) => {
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.withName ?? "").toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [appointments, search]);

  const detail = appointments.find((a: AppointmentItem) => a.id === detailId) ?? null;
  const upcoming = appointments.filter((a: AppointmentItem) => a.status?.toLowerCase() === "scheduled").length;
  const inProgress = appointments.filter((a: AppointmentItem) => {
    const s = a.status?.toLowerCase();
    return s === "in-progress" || s === "inprogress";
  }).length;
  const completedCount = appointments.filter((a: AppointmentItem) => a.status?.toLowerCase() === "completed").length;
  const openCount = appointments.filter((a: AppointmentItem) => isOpen(a.status)).length;

  const resetCreate = () => {
    setNewTitle("");
    setNewWithName("");
    setNewDate("");
    setNewTime("");
    setNewDescription("");
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newDate || !newTime) return;
    const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
    createAppointment.mutate(
      {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        // TODO(BE): no participant lookup yet — withName is free-text, withUserId left unset.
        scheduledAt,
      },
      {
        onSuccess: () => {
          toast({ title: "Đã tạo lịch hẹn" });
          setCreateOpen(false);
          resetCreate();
        },
        onError: () => toast({ title: "Không tạo được lịch hẹn", variant: "destructive" }),
      }
    );
  };

  const handleResolve = () => {
    if (!resolveId || !resolution.trim()) return;
    const target = appointments.find((a: AppointmentItem) => a.id === resolveId);
    if (!target) return;
    // Persist the resolution into free-text notes, then mark the appointment complete.
    updateAppointment.mutate(
      {
        id: resolveId,
        payload: {
          title: target.title,
          description: target.description ?? undefined,
          withUserId: target.withUserId ?? undefined,
          scheduledAt: target.scheduledAt,
          notes: resolution.trim(),
        },
      },
      {
        onSuccess: () => {
          completeAppointment.mutate(resolveId, {
            onSuccess: () => {
              toast({ title: "Đã hoàn tất lịch hẹn" });
              setResolveId(null);
              setResolution("");
            },
            onError: () => toast({ title: "Không hoàn tất được lịch hẹn", variant: "destructive" }),
          });
        },
        onError: () => toast({ title: "Không lưu được kết quả", variant: "destructive" }),
      }
    );
  };

  const handleCancel = (id: string) => {
    cancelAppointment.mutate(id, {
      onSuccess: () => toast({ title: "Đã hủy lịch hẹn" }),
      onError: () => toast({ title: "Không hủy được lịch hẹn", variant: "destructive" }),
    });
  };

  const resolving = updateAppointment.isPending || completeAppointment.isPending;

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Sắp tới */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{upcoming}</p>
              <p className="text-xs text-white/80 mt-1">Sắp tới</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Đang xử lý */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{inProgress}</p>
              <p className="text-xs text-white/80 mt-1">Đang xử lý</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Hoàn tất */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{completedCount}</p>
              <p className="text-xs text-white/80 mt-1">Hoàn tất</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Chưa xử lý */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{openCount}</p>
              <p className="text-xs text-white/80 mt-1">Chưa xử lý</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm lịch hẹn..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm rounded-xl" />
        </div>
        <Button size="sm" className="h-9 rounded-xl gap-1" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Tạo lịch hẹn
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách lịch hẹn...
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tải được danh sách lịch hẹn. Vui lòng thử lại.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Chưa có lịch hẹn nào.
          </div>
        ) : (
          filtered.map((a: AppointmentItem) => {
            const sCfg = statusFor(a.status);
            return (
              <Card key={a.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={sCfg.variant}>{sCfg.label}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(a.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(a.scheduledAt)}</span>
                        {a.withName && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.withName}</span>}
                      </div>
                      {a.notes && (
                        <div className="mt-2 p-2 bg-muted/50 border border-border rounded-lg">
                          <p className="text-xs text-foreground"><span className="font-medium">Kết quả:</span> {a.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDetailId(a.id)}>Chi tiết</Button>
                      {isOpen(a.status) && (
                        <>
                          <Button size="sm" className="rounded-xl" onClick={() => setResolveId(a.id)}>Hoàn tất</Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl"
                            onClick={() => handleCancel(a.id)}
                            disabled={cancelAppointment.isPending}
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={open => { if (!open) { setCreateOpen(false); resetCreate(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo lịch hẹn</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Tiêu đề</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="VD: Xử lý khiếu nại điểm danh" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Người liên quan</Label>
              {/* TODO(BE): withUserId lookup not wired — captured as free-text only, not sent. */}
              <Input value={newWithName} onChange={e => setNewWithName(e.target.value)} placeholder="VD: Phụ huynh Phạm Hồng Đào" className="rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ngày</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Giờ</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nội dung</Label>
              <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Mô tả chi tiết..." className="rounded-xl mt-1" rows={3} />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full rounded-xl"
              disabled={!newTitle.trim() || !newDate || !newTime || createAppointment.isPending}
            >
              {createAppointment.isPending ? "Đang tạo..." : "Tạo lịch hẹn"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chi tiết lịch hẹn</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusFor(detail.status).variant}>{statusFor(detail.status).label}</Badge>
              </div>
              <p className="text-base font-semibold text-foreground">{detail.title}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Ngày</Label><p className="text-sm text-foreground">{fmtDate(detail.scheduledAt)}</p></div>
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Giờ</Label><p className="text-sm text-foreground">{fmtTime(detail.scheduledAt)}</p></div>
              </div>
              {detail.withName && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <Label className="text-[10px] text-muted-foreground">Người liên quan</Label>
                  <p className="text-sm text-foreground mt-1">{detail.withName}</p>
                </div>
              )}
              {detail.description && (
                <div className="p-3 bg-muted/50 rounded-xl"><Label className="text-[10px] text-muted-foreground">Nội dung</Label><p className="text-sm text-foreground mt-1">{detail.description}</p></div>
              )}
              {detail.notes && (
                <div className="p-3 bg-muted/50 border border-border rounded-xl"><Label className="text-[10px] text-muted-foreground">Kết quả xử lý</Label><p className="text-sm text-foreground mt-1">{detail.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve */}
      <Dialog open={!!resolveId} onOpenChange={() => { setResolveId(null); setResolution(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Hoàn tất lịch hẹn</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Nhập kết quả xử lý:</p>
            <Textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="VD: Đã thống nhất hoàn 50% phí, gia sư cam kết cải thiện..." className="rounded-xl" rows={4} />
            <Button onClick={handleResolve} className="w-full rounded-xl" disabled={!resolution.trim() || resolving}>
              {resolving ? "Đang xử lý..." : "Xác nhận hoàn tất"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeAppointments;
