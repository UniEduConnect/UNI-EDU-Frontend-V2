import { useState } from "react";
import { HelpCircle, MessageSquare, Phone, Mail, ChevronDown, ChevronUp, Send, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const faqs = [
  { q: "Làm sao để thanh toán học phí?", a: "Bạn vào mục 'Ví & Thanh toán', chọn tab 'Cần thanh toán', sau đó bấm 'Thanh toán' cho từng lớp. Số tiền sẽ được trừ trực tiếp từ ví." },
  { q: "Tôi có thể hoàn tiền không?", a: "Có, nếu gia sư hủy buổi học hoặc chưa dạy, bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày. Liên hệ hỗ trợ để được xử lý." },
  { q: "Làm sao để xác nhận điểm danh?", a: "Khi gia sư điểm danh, bạn sẽ nhận thông báo. Vào mục 'Con em' → chọn con → tab 'Điểm danh chờ xác nhận' để xác nhận hoặc từ chối." },
  { q: "Con tôi có thể đổi gia sư được không?", a: "Được, bạn có thể dừng lớp hiện tại và đăng ký lớp mới với gia sư khác. Học phí chưa sử dụng sẽ được hoàn lại ví." },
  { q: "Làm sao để theo dõi lịch học của con?", a: "Vào mục 'Con em' → chọn con → tab 'Lịch học' để xem lịch chi tiết từng tuần. Bạn cũng có thể xem trong 'Báo cáo học tập'." },
  { q: "Báo cáo học tập cập nhật khi nào?", a: "Báo cáo được cập nhật sau mỗi buổi học. Điểm GPA và chuyên cần được tính lại hàng tháng." },
];

const ParentSupport = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");
  const [tab, setTab] = useState<"faq" | "ticket" | "contact">("faq");

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMsg.trim()) return;
    toast.success("Đã gửi yêu cầu hỗ trợ! Chúng tôi sẽ phản hồi trong 24h.");
    setTicketSubject("");
    setTicketMsg("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Trung tâm hỗ trợ</h1>
        <p className="text-sm text-muted-foreground mt-1">Giải đáp thắc mắc và hỗ trợ phụ huynh</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {[
          { key: "faq", label: "Câu hỏi thường gặp", icon: HelpCircle },
          { key: "ticket", label: "Gửi yêu cầu hỗ trợ", icon: FileText },
          { key: "contact", label: "Liên hệ", icon: Phone },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2", tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "faq" && (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "ticket" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-xl">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Tiêu đề</label>
            <Input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="VD: Hỏi về lịch học của con" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Nội dung chi tiết</label>
            <textarea value={ticketMsg} onChange={e => setTicketMsg(e.target.value)} rows={5} placeholder="Mô tả chi tiết vấn đề cần hỗ trợ..." className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>
          <Button onClick={handleSubmitTicket} disabled={!ticketSubject.trim() || !ticketMsg.trim()} className="rounded-xl gap-2">
            <Send className="w-4 h-4" /> Gửi yêu cầu
          </Button>
        </div>
      )}

      {tab === "contact" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Phone, label: "Hotline", value: "1900 1234", sub: "T2-T7: 8:00 - 21:00" },
            { icon: Mail, label: "Email", value: "support@unieducation.net", sub: "Phản hồi trong 24h" },
            { icon: MessageSquare, label: "Chat trực tuyến", value: "Trợ lý AI", sub: "Phản hồi ngay lập tức" },
          ].map((c, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <c.icon className="w-5 h-5 text-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className="text-sm font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
            </div>
          ))}
          <div className="sm:col-span-3 bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Cam kết bảo mật</p>
              <p className="text-xs text-muted-foreground">Mọi thông tin cá nhân và giao dịch của bạn được mã hóa và bảo vệ tuyệt đối.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentSupport;
