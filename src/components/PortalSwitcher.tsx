import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  Building2,
  ClipboardCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// All staff portals. An admin account is allowed into every one of these
// (they are gated by the Admin role server-side), so we show them all without
// any per-role filtering.
const portals = [
  {
    to: "/admin",
    label: "Quản trị",
    desc: "Người dùng, lớp học, hệ thống",
    icon: LayoutDashboard,
  },
  {
    to: "/finance",
    label: "Kế toán",
    desc: "Thanh toán & doanh thu",
    icon: Wallet,
  },
  {
    to: "/office",
    label: "Văn phòng",
    desc: "Đăng ký, điểm danh, lịch hẹn",
    icon: Building2,
  },
  {
    to: "/exam-manager",
    label: "Quản lý thi",
    desc: "Đề thi & cấu hình AI",
    icon: ClipboardCheck,
  },
];

/** Header dropdown letting staff jump between the admin / finance / office / exam-manager portals. */
const PortalSwitcher = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Which portal we're currently inside (e.g. /finance/transactions -> /finance).
  const active = portals.find(
    (p) => pathname === p.to || pathname.startsWith(p.to + "/"),
  );
  const ActiveIcon = active?.icon ?? LayoutGrid;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
        onClick={() => setOpen(!open)}
      >
        <ActiveIcon className="w-4 h-4 text-blue-600" />
        <span className="hidden sm:inline">
          {active?.label ?? "Khu vực quản trị"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[280px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Chuyển khu vực
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Truy cập các bảng điều khiển nghiệp vụ
            </p>
          </div>
          <div className="py-1.5">
            {portals.map((p) => {
              const isActive = p.to === active?.to;
              return (
                <button
                  key={p.to}
                  onClick={() => {
                    setOpen(false);
                    if (!isActive) navigate(p.to);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3",
                    isActive ? "bg-blue-50" : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? "bg-blue-600" : "bg-blue-100",
                    )}
                  >
                    <p.icon
                      className={cn(
                        "w-[18px] h-[18px]",
                        isActive ? "text-white" : "text-blue-700",
                      )}
                    />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        isActive ? "text-blue-700" : "text-slate-900",
                      )}
                    >
                      {p.label}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">
                      {p.desc}
                    </span>
                  </span>
                  {isActive ? (
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSwitcher;
