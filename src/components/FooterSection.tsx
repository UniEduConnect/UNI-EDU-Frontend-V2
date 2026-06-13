import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import UniMark from "@/components/UniMark";

const FooterSection = () => {
  return (
    <footer className="bg-[#052861] py-16 border-t border-primary/70">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <UniMark size={36} />
              <span className="font-bold text-xl text-primary-foreground">
                Uni Education
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-5">
              Nền tảng kết nối gia sư và học sinh hàng đầu Việt Nam với công nghệ AI tiên tiến.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Mail className="w-4 h-4" /> support@unieducation.net
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Phone className="w-4 h-4" /> 1900 1234
              </div>
            </div>
          </div>

          {[
            {
              title: "Sản phẩm",
              links: [
                { to: "/find-tutor", label: "Tìm gia sư" },
                { to: "/register-tutor", label: "Đăng ký làm gia sư" },
                { to: "/exam-online", label: "Thi thử online" },
                { to: "/pricing", label: "Bảng giá" },
              ],
            },
            {
              title: "Hỗ trợ",
              links: [
                { to: "/help", label: "Trung tâm trợ giúp" },
                { to: "/faq", label: "Câu hỏi thường gặp" },
                { to: "/contact", label: "Liên hệ" },
                { to: "/refund", label: "Chính sách hoàn tiền" },
              ],
            },
            {
              title: "Pháp lý",
              links: [
                { to: "/terms", label: "Điều khoản sử dụng" },
                { to: "/privacy", label: "Chính sách bảo mật" },
                { to: "/gdpr", label: "GDPR" },
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-bold text-primary-foreground mb-5">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-primary-foreground/70 text-sm hover:text-neon transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-primary-foreground/60 text-sm">
            &copy; 2025 Uni Education. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
