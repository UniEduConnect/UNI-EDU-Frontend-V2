import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import FooterSection from "@/components/FooterSection";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTE } from "@/lib/roleRoutes";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Already signed in? Go straight to the dashboard instead of asking to log in again.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(role ? ROLE_ROUTE[role] : "/", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData);
      toast.success("Đăng nhập thành công!");
      const dest = user.role ? ROLE_ROUTE[user.role] : "/";
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? dest, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-28 pb-16 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-section font-extrabold text-foreground mb-2">Đăng nhập</h1>
            <p className="text-muted-foreground text-body">Chào mừng trở lại EduConnect</p>
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-elevated border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" className="mt-1.5 rounded-xl h-11" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 rounded-xl h-11" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-full gradient-blue text-white text-base font-bold">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang xử lý...</> : "Đăng nhập"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-neon font-semibold hover:underline">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default Login;
