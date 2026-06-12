import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useMe } from "@/hooks/useUsers";

/**
 * Shows the tutor's account-approval state (set by an admin):
 *  - pending  → waiting for admin verification (amber)
 *  - rejected → application declined (red)
 *  - approved → a brief confirmation (green); hidden after first glance is fine
 */
export function TutorApprovalBanner() {
  const { data: me } = useMe();
  const status = (me?.status ?? "").toLowerCase();

  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-900/15 dark:border-amber-700/50 p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Hồ sơ gia sư đang chờ duyệt
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
            Quản trị viên sẽ xác minh hồ sơ của bạn. Trong lúc chờ, bạn vẫn có thể hoàn thiện hồ sơ.
            Khi được duyệt, hồ sơ sẽ hiển thị huy hiệu “Đã xác minh”.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-900/15 dark:border-rose-700/50 p-4 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
            Hồ sơ chưa được duyệt
          </p>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mt-0.5">
            Quản trị viên đã từ chối hồ sơ. Vui lòng cập nhật thông tin/chứng chỉ và liên hệ hỗ trợ để được xét duyệt lại.
          </p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/15 dark:border-emerald-700/50 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Tài khoản đã được xác minh — hồ sơ của bạn hiển thị huy hiệu “Đã xác minh”.
        </p>
      </div>
    );
  }

  return null;
}

export default TutorApprovalBanner;
