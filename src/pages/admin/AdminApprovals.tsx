import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, Phone, Mail, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, useApproveUser, useRejectUser } from "@/hooks/useAdmin";
import type { AdminUserResponse } from "@/types/api";

const roleLabel: Record<string, string> = { tutor: "Gia sư", teacher: "Giáo viên", student: "Học sinh", parent: "Phụ huynh" };

const AdminApprovals = () => {
  // TODO(BE): approval has no documents/verification-detail fields
  const { users, isLoading } = useAdminUsers({ Status: "pending" });
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const [detail, setDetail] = useState<AdminUserResponse | null>(null);
  const { toast } = useToast();

  const handleApprove = (id: string) => {
    approveUser.mutate(id);
    toast({ title: "Đã duyệt tài khoản thành công" });
  };

  const handleReject = (id: string) => {
    rejectUser.mutate({ id, payload: { reason: "" } });
    toast({ title: "Đã từ chối tài khoản", variant: "destructive" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-2xl w-fit">
        <span className="px-4 py-2 rounded-xl text-sm font-medium bg-card text-foreground shadow-sm flex items-center gap-2">
          Chờ duyệt
          <span className="min-w-[22px] h-[22px] flex items-center justify-center text-[11px] font-bold rounded-full px-1.5 bg-destructive/10 text-destructive">
            {users.length}
          </span>
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách tài khoản...
        </div>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Không có tài khoản nào chờ duyệt.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <Card key={u.id} className="border-0 shadow-soft hover:shadow-elevated transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg ring-2 ring-border shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-base">{u.name}</p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {roleLabel[u.role] || u.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{u.email}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{u.phone}</span>
                      {u.school && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{u.school}</span>}
                    </div>

                    {u.bio && (
                      <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-xl">{u.bio}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-xl bg-success/150 hover:bg-success text-white shadow-sm"
                      onClick={() => handleApprove(u.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(u.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Từ chối
                    </Button>
                    <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => setDetail(u)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết hồ sơ</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {detail.avatar ? (
                  <img src={detail.avatar} alt={detail.name} className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-xl">
                    {detail.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg text-foreground">{detail.name}</p>
                  <p className="text-sm text-muted-foreground">{roleLabel[detail.role] || detail.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">Email</span><span className="text-foreground">{detail.email}</span></div>
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">SĐT</span><span className="text-foreground">{detail.phone}</span></div>
                <div className="bg-muted/50 p-3 rounded-xl"><span className="text-muted-foreground block text-xs mb-1">Ngày đăng ký</span><span className="text-foreground">{detail.createdAt}</span></div>
                {detail.school && <div className="bg-muted/50 p-3 rounded-xl col-span-2"><span className="text-muted-foreground block text-xs mb-1">Trường</span><span className="text-foreground">{detail.school}</span></div>}
              </div>
              {detail.bio && <p className="text-sm text-foreground bg-muted/50 p-3 rounded-xl">{detail.bio}</p>}

              {/* TODO(BE): approval has no documents/verification-detail fields */}

              <div className="flex gap-2 pt-2">
                <Button className="rounded-xl bg-success/150 hover:bg-success text-white flex-1" onClick={() => { handleApprove(detail.id); setDetail(null); }}>Duyệt</Button>
                <Button variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 flex-1" onClick={() => { handleReject(detail.id); setDetail(null); }}>Từ chối</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApprovals;
