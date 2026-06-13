import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import type { SystemSettings } from "@/types/api";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, CreditCard, Bell, Shield, Save, FileText, MessageSquare, Wrench, Lock, Clock, KeyRound, Mail, Smartphone, BellRing } from "lucide-react";

const AdminSettings = () => {
  // Live settings from GET /api/Admin/settings — no seed fallback.
  const { data: settings } = useSettings();
  const updateMutation = useUpdateSettings();
  const [form, setForm] = useState<SystemSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const handleSave = () => {
    if (!form) return;
    updateMutation.mutate(form, {
      onSuccess: () => toast({ title: "Đã lưu cài đặt thành công" }),
      onError: (e) => toast({ title: e instanceof Error ? e.message : "Lưu thất bại", variant: "destructive" }),
    });
  };

  if (!form) {
    return <div className="p-6 text-muted-foreground">Đang tải cài đặt...</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-700 to-blue-900 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-white/80">Phí Escrow</p>
            <p className="text-2xl font-bold">{form.escrowPercent}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-white/80">Thời gian giữ tiền</p>
            <p className="text-2xl font-bold">{form.escrowHoldDays} ngày</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-white/80">Thi thử</p>
            <p className="text-2xl font-bold">{form.enableExams ? "Bật" : "Tắt"}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft bg-gradient-to-br from-rose-500 to-pink-500 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-white/80">Thanh toán QR</p>
            <p className="text-2xl font-bold">{form.enablePayments ? "Bật" : "Tắt"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="escrow" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto flex-wrap">          <TabsTrigger value="escrow" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 gap-2 text-sm">
            <CreditCard className="w-4 h-4" /> Giao dịch & Escrow
          </TabsTrigger>
          <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 gap-2 text-sm">
            <Settings className="w-4 h-4" /> Hệ thống chung
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 gap-2 text-sm">
            <Bell className="w-4 h-4" /> Thông báo
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 gap-2 text-sm">
            <Shield className="w-4 h-4" /> Bảo mật & Phân quyền
          </TabsTrigger>
        </TabsList>

        {/* Giao dịch & Escrow */}
        <TabsContent value="escrow">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Giao dịch & Escrow</h3>
                  <p className="text-sm text-muted-foreground">Cấu hình phí giao dịch và thời gian giữ tiền</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phí Escrow (%)</Label>
                  <Input type="number" min={0} max={100} value={form.escrowPercent} onChange={e => setForm(f => ({ ...f, escrowPercent: Number(e.target.value) }))} className="rounded-xl h-11" />
                  <p className="text-xs text-muted-foreground">Phần trăm nền tảng giữ lại mỗi giao dịch</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Thời gian giữ tiền (ngày)</Label>
                  <Input type="number" min={1} max={30} value={form.escrowHoldDays} onChange={e => setForm(f => ({ ...f, escrowHoldDays: Number(e.target.value) }))} className="rounded-xl h-11" />
                  <p className="text-xs text-muted-foreground">Số ngày giữ tiền trước khi chuyển cho gia sư</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phí thi thử (VNĐ)</Label>
                  <Input type="number" min={0} value={50000} className="rounded-xl h-11" readOnly />
                  <p className="text-xs text-muted-foreground">Phí mặc định cho mỗi lượt thi thử</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Thanh toán online</p>
                    <p className="text-xs text-muted-foreground">Bật/tắt thanh toán trực tuyến</p>
                  </div>
                </div>
                <Switch checked={form.enablePayments} onCheckedChange={v => setForm(f => ({ ...f, enablePayments: v }))} />
              </div>
              <Button className="rounded-xl h-11" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Lưu cài đặt Escrow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hệ thống chung */}
        <TabsContent value="general">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-success/150/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Hệ thống chung</h3>
                  <p className="text-sm text-muted-foreground">Cấu hình chung cho nền tảng</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tên nền tảng</Label>
                  <Input value={form.platformName} onChange={e => setForm(f => ({ ...f, platformName: e.target.value }))} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email hỗ trợ</Label>
                  <Input value="support@unieducation.net" className="rounded-xl h-11" readOnly />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { key: "enableExams", icon: FileText, label: "Thi thử online", desc: "Cho phép học sinh làm bài test trực tuyến" },
                  { key: "enableChat", icon: MessageSquare, label: "Chat", desc: "Cho phép nhắn tin giữa gia sư và học sinh" },
                  { key: "maintenanceMode", icon: Wrench, label: "Chế độ bảo trì", desc: "Tạm ngưng hệ thống để bảo trì" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-4 px-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={(form as any)[item.key]} onCheckedChange={v => setForm(f => ({ ...f, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <Button className="rounded-xl h-11" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Lưu cài đặt chung
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thông báo */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-warning/150/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Thông báo</h3>
                  <p className="text-sm text-muted-foreground">Cấu hình kênh thông báo cho hệ thống</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { key: "emailNotifications", icon: Mail, label: "Email", desc: "Gửi thông báo qua email" },
                  { key: "smsNotifications", icon: Smartphone, label: "SMS", desc: "Gửi thông báo qua tin nhắn SMS" },
                  { key: "pushNotifications", icon: BellRing, label: "Push notification", desc: "Gửi thông báo đẩy trên trình duyệt" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-4 px-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={(form as any)[item.key]} onCheckedChange={v => setForm(f => ({ ...f, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <Button className="rounded-xl h-11" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Lưu cài đặt thông báo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bảo mật & Phân quyền */}
        <TabsContent value="security">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Bảo mật & Phân quyền</h3>
                  <p className="text-sm text-muted-foreground">Cấu hình bảo mật cho tài khoản và hệ thống</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Xác thực 2 bước (2FA)</p>
                    <p className="text-xs text-muted-foreground">Yêu cầu xác thực 2 lớp khi đăng nhập</p>
                  </div>
                </div>
                <Switch checked={form.twoFactorAuth} onCheckedChange={v => setForm(f => ({ ...f, twoFactorAuth: v }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Phiên đăng nhập (phút)</Label>
                  <Input type="number" min={5} max={120} value={form.sessionTimeout} onChange={e => setForm(f => ({ ...f, sessionTimeout: Number(e.target.value) }))} className="rounded-xl h-11" />
                  <p className="text-xs text-muted-foreground">Tự động đăng xuất sau thời gian không hoạt động</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2"><KeyRound className="w-3.5 h-3.5" /> Đăng nhập sai tối đa</Label>
                  <Input type="number" min={3} max={10} value={form.maxLoginAttempts} onChange={e => setForm(f => ({ ...f, maxLoginAttempts: Number(e.target.value) }))} className="rounded-xl h-11" />
                  <p className="text-xs text-muted-foreground">Khóa tài khoản sau số lần đăng nhập sai</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Độ dài mật khẩu tối thiểu</Label>
                  <Input type="number" min={6} max={32} value={8} className="rounded-xl h-11" readOnly />
                  <p className="text-xs text-muted-foreground">Yêu cầu tối thiểu ký tự cho mật khẩu</p>
                </div>
              </div>
              <Button className="rounded-xl h-11" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Lưu cài đặt bảo mật
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
