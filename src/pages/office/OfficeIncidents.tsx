import {
  useIncidents,
  useResolveIncident,
  useInvestigateIncident,
  useCreateIncident,
} from "@/hooks/useOffice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Clock, Search as SearchIcon, Eye, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "Cao", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Trung bình", className: "bg-muted text-foreground border-border" },
  low: { label: "Thấp", className: "bg-muted text-muted-foreground border-border" },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType }> = {
  pending: { label: "Chờ xử lý", icon: Clock },
  investigating: { label: "Đang điều tra", icon: SearchIcon },
  resolved: { label: "Đã xử lý", icon: CheckCircle2 },
};

const OfficeIncidents = () => {
  // Live incidents from GET /Office/incidents — the sole source of truth.
  const { incidents, isLoading, isError } = useIncidents();
  const resolveMutation = useResolveIncident();
  const investigateMutation = useInvestigateIncident();
  const createMutation = useCreateIncident();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createClassId, setCreateClassId] = useState("");
  const [createSessionId, setCreateSessionId] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPriority, setCreatePriority] = useState<string>("medium");

  const filtered = filter === "all" ? incidents : incidents.filter(i => i.status === filter);
  const detail = incidents.find(i => i.id === detailId);

  const handleResolve = () => {
    if (resolveId) {
      resolveMutation.mutate(
        { id: resolveId, payload: { resolution: resolveNote.trim() || "Đã xử lý" } },
        {
          onSuccess: () => toast({ title: "Đã xử lý sự cố" }),
          onError: (e) => toast({ title: e instanceof Error ? e.message : "Xử lý thất bại", variant: "destructive" }),
        },
      );
      setResolveId(null);
      setResolveNote("");
    }
  };

  const handleInvestigate = (id: string) => {
    investigateMutation.mutate(id, {
      onSuccess: () => toast({ title: "Đã chuyển sang điều tra" }),
      onError: (e) => toast({ title: e instanceof Error ? e.message : "Thao tác thất bại", variant: "destructive" }),
    });
  };

  const handleCreate = () => {
    if (!createClassId.trim() || !createDescription.trim()) return;
    createMutation.mutate(
      {
        classId: createClassId.trim(),
        sessionId: createSessionId.trim() || undefined,
        description: createDescription.trim(),
        priority: createPriority,
      },
      {
        onSuccess: () => {
          toast({ title: "Đã tạo sự cố" });
          setCreateOpen(false);
          setCreateClassId("");
          setCreateSessionId("");
          setCreateDescription("");
          setCreatePriority("medium");
        },
        onError: (e) => toast({ title: e instanceof Error ? e.message : "Tạo sự cố thất bại", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý sự cố</h1>
        <p className="text-muted-foreground text-sm">Theo dõi và xử lý các vấn đề phát sinh</p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Chờ xử lý */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{incidents.filter(i => i.status === "pending").length}</p>
              <p className="text-xs text-white/80 mt-1">Chờ xử lý</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Đang điều tra */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{incidents.filter(i => i.status === "investigating").length}</p>
              <p className="text-xs text-white/80 mt-1">Đang điều tra</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <SearchIcon className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Đã xử lý */}
        <Card className="border-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{incidents.filter(i => i.status === "resolved").length}</p>
              <p className="text-xs text-white/80 mt-1">Đã xử lý</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 items-center">
        {["all", "pending", "investigating", "resolved"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" className="rounded-xl text-xs" onClick={() => setFilter(s)}>
            {s === "all" ? "Tất cả" : statusConfig[s]?.label}
          </Button>
        ))}
        <Button size="sm" className="rounded-xl text-xs ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> Tạo sự cố
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách sự cố...
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tải được danh sách sự cố. Vui lòng thử lại.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không có sự cố nào.
          </div>
        ) : (
          filtered.map(incident => {
            const pCfg = priorityConfig[incident.priority];
            const sCfg = statusConfig[incident.status];
            return (
              <Card key={incident.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${pCfg.className}`}>{pCfg.label}</span>
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><sCfg.icon className="w-3.5 h-3.5" />{sCfg.label}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">{incident.createdAt}</p>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{incident.className}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                  {incident.resolution && (
                    <div className="p-2 bg-muted/50 border border-border rounded-lg mb-3">
                      <p className="text-xs text-foreground"><span className="font-medium">Xử lý:</span> {incident.resolution}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Báo cáo bởi: <span className="font-medium text-foreground">{incident.reporter}</span> ({incident.reporterRole})</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setDetailId(incident.id)}>
                        <Eye className="w-3 h-3 mr-1" /> Chi tiết
                      </Button>
                      {incident.status === "pending" && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleInvestigate(incident.id)}>
                          <SearchIcon className="w-3 h-3 mr-1" /> Điều tra
                        </Button>
                      )}
                      {incident.status !== "resolved" && (
                        <Button size="sm" className="rounded-xl text-xs" onClick={() => setResolveId(incident.id)}>Xử lý</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chi tiết sự cố</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Lớp học</Label><p className="text-sm font-medium text-foreground">{detail.className}</p></div>
                <div><Label className="text-xs text-muted-foreground">Mức ưu tiên</Label><div className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-semibold border ${priorityConfig[detail.priority].className}`}>{priorityConfig[detail.priority].label}</span></div></div>
                <div><Label className="text-xs text-muted-foreground">Người báo cáo</Label><p className="text-sm font-medium text-foreground">{detail.reporter} ({detail.reporterRole})</p></div>
                <div><Label className="text-xs text-muted-foreground">Thời gian</Label><p className="text-sm font-medium text-foreground">{detail.createdAt}</p></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Mô tả</Label><p className="text-sm text-foreground mt-1 p-3 bg-muted/50 rounded-xl">{detail.description}</p></div>
              {detail.resolution && <div><Label className="text-xs text-muted-foreground">Kết quả xử lý</Label><p className="text-sm text-foreground mt-1 p-3 bg-muted/50 rounded-xl border border-border">{detail.resolution}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo sự cố</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Mã lớp học</Label>
              <Input value={createClassId} onChange={e => setCreateClassId(e.target.value)} placeholder="Class ID" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mã buổi học (tùy chọn)</Label>
              <Input value={createSessionId} onChange={e => setCreateSessionId(e.target.value)} placeholder="Session ID" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mức ưu tiên</Label>
              <div className="flex gap-2 mt-1">
                {["low", "medium", "high"].map(p => (
                  <Button key={p} type="button" size="sm" variant={createPriority === p ? "default" : "outline"} className="rounded-xl text-xs" onClick={() => setCreatePriority(p)}>
                    {priorityConfig[p].label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mô tả</Label>
              <Textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)} placeholder="Mô tả sự cố..." className="rounded-xl mt-1" rows={3} />
            </div>
            <Button onClick={handleCreate} disabled={!createClassId.trim() || !createDescription.trim() || createMutation.isPending} className="w-full rounded-xl">Tạo sự cố</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolveId} onOpenChange={() => setResolveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xử lý sự cố</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Mô tả cách xử lý sự cố này trước khi xác nhận:</p>
            <Textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Nhập ghi chú xử lý..." className="rounded-xl" rows={3} />
            <Button onClick={handleResolve} disabled={resolveMutation.isPending} className="w-full rounded-xl">Xác nhận đã xử lý</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeIncidents;
