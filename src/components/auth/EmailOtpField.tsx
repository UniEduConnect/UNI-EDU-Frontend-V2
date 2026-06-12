import { useState } from "react";
import { Loader2, MailCheck, ShieldCheck, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSendOtp, useVerifyOtp } from "@/hooks/useOtp";

interface Props {
  email: string;
  onEmailChange: (value: string) => void;
  verified: boolean;
  onVerifiedChange: (value: boolean) => void;
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Email input + inline "send OTP → enter code → verify" flow. Reports verification upward.
export function EmailOtpField({ email, onEmailChange, verified, onVerifiedChange }: Props) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const handleSend = () => {
    if (!isValidEmail(email)) {
      toast.error("Vui lòng nhập email hợp lệ trước khi gửi mã.");
      return;
    }
    sendOtp.mutate(email.trim(), {
      onSuccess: () => {
        setSent(true);
        toast.success("Đã gửi mã OTP tới email của bạn. Vui lòng kiểm tra hộp thư.");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Gửi mã thất bại."),
    });
  };

  const handleVerify = () => {
    verifyOtp.mutate(
      { email: email.trim(), code: code.trim() },
      {
        onSuccess: () => {
          onVerifiedChange(true);
          toast.success("Xác thực email thành công!");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Mã không đúng."),
      },
    );
  };

  return (
    <div>
      <Label htmlFor="email">Email</Label>
      <div className="mt-1.5 flex gap-2">
        <div className="relative flex-1">
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            className="rounded-xl h-11 pr-9"
            value={email}
            disabled={verified}
            onChange={(e) => {
              onEmailChange(e.target.value);
              if (verified) onVerifiedChange(false);
              if (sent) setSent(false);
            }}
            required
          />
          {verified && <ShieldCheck className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />}
        </div>
        {!verified && (
          <Button type="button" variant="outline" className="h-11 rounded-xl whitespace-nowrap" onClick={handleSend} disabled={sendOtp.isPending}>
            {sendOtp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> {sent ? "Gửi lại" : "Gửi mã"}</>}
          </Button>
        )}
      </div>

      {verified ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <MailCheck className="w-3.5 h-3.5" /> Email đã được xác thực
        </p>
      ) : sent ? (
        <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <Label htmlFor="otp" className="text-xs text-muted-foreground">Nhập mã 6 số đã gửi tới email</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              className="rounded-xl h-11 tracking-[0.5em] text-center font-semibold"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button type="button" className="h-11 rounded-xl" onClick={handleVerify} disabled={verifyOtp.isPending || code.length !== 6}>
              {verifyOtp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác minh"}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Mã có hiệu lực trong 5 phút. Không nhận được? Bấm "Gửi lại".</p>
        </div>
      ) : null}
    </div>
  );
}
