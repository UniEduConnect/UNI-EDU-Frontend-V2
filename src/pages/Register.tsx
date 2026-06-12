import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import FooterSection from "@/components/FooterSection";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailOtpField } from "@/components/auth/EmailOtpField";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", school: "", grade: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      toast.error("Vui lòng xác thực email bằng mã OTP trước khi đăng ký.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    setLoading(true);
    try {
      await registerStudent({
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
        fullname: formData.name,
        school: formData.school,
        grade: Number(formData.grade) || 0,
      });
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      setFormData({ name: "", email: "", phone: "", school: "", grade: "", password: "", confirmPassword: "" });
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-section font-extrabold text-foreground mb-2">Đăng ký tài khoản</h1>
            <p className="text-muted-foreground text-body">Tham gia EduConnect ngay hôm nay</p>
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-elevated border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" placeholder="Nguyễn Văn A" className="mt-1.5 rounded-xl h-11" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <EmailOtpField
                email={formData.email}
                onEmailChange={(v) => setFormData({ ...formData, email: v })}
                verified={emailVerified}
                onVerifiedChange={setEmailVerified}
              />
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" type="tel" placeholder="0901234567" className="mt-1.5 rounded-xl h-11" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="school">Trường học</Label>
                <Input id="school" placeholder="THPT Chu Văn An" className="mt-1.5 rounded-xl h-11" value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="grade">Khối lớp</Label>
                <Input id="grade" type="number" min={1} max={12} placeholder="12" className="mt-1.5 rounded-xl h-11" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" type="password" placeholder="Tối thiểu 6 ký tự" className="mt-1.5 rounded-xl h-11" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" className="mt-1.5 rounded-xl h-11" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
              </div>

              <p className="text-[11px] text-muted-foreground">Sau khi đăng ký, Admin sẽ xác minh và phân quyền tài khoản cho bạn (Học sinh, Phụ huynh, Gia sư,...).</p>

              <Button type="submit" disabled={loading || !emailVerified} className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang xử lý...</> : emailVerified ? "Đăng ký" : "Xác thực email để đăng ký"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Bạn là gia sư?{" "}
                <Link to="/register-tutor" className="text-primary font-semibold hover:underline">Đăng ký trở thành gia sư</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default Register;
