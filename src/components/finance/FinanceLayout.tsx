import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ArrowLeftRight,
  HandCoins,
  BarChart3,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Check,
  RotateCcw,
  Scale,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UniMark from "@/components/UniMark";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import { useState, useRef, useEffect } from "react";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { useMe } from "@/hooks/useUsers";

const navItems = [
  { to: "/finance", icon: LayoutDashboard, label: "Tổng quan", end: true },
  { to: "/finance/reports", icon: BarChart3, label: "Báo cáo tài chính" },
  { to: "/finance/transactions", icon: ArrowLeftRight, label: "Giao dịch" },
  { to: "/finance/payouts", icon: HandCoins, label: "Chi trả gia sư" },
  { to: "/finance/refunds", icon: RotateCcw, label: "Yêu cầu hoàn tiền" },
  { to: "/finance/reconciliation", icon: Scale, label: "Đối soát" },
];

const pageTitles: Record<string, string> = {
  "/finance": "Tổng Quan Tài Chính",
  "/finance/transactions": "Giao Dịch",
  "/finance/payouts": "Chi Trả Gia Sư",
  "/finance/refunds": "Yêu Cầu Hoàn Tiền",
  "/finance/reconciliation": "Đôi Soát Tài Chính",
  "/finance/reports": "Báo Cao Tài Chính",
};

const notifIcon: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  info: <Info className="w-4 h-4 text-info" />,
  success: <CheckCircle2 className="w-4 h-4 text-success" />,
  error: <XCircle className="w-4 h-4 text-destructive" />,
};

const FinanceLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const { data: me } = useMe();
  const { notifications } = useNotifications();
  const { count: unreadNotif } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentTitle = pageTitles[location.pathname] || "Kế toán";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-100">
      <aside
        className={cn(
          "fixed top-4 left-4 h-[calc(100%-2rem)] rounded-3xl bg-gradient-to-b from-[#0b2e6a] via-[#052861] to-[#0a2160] shadow-2xl border border-white/15 text-slate-200 z-20 transition-all duration-300 overflow-hidden flex flex-col",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <div
          className={cn(
            "h-20 flex items-center gap-3 transition-all",
            collapsed ? "justify-center px-0" : "justify-between px-4",
          )}
        >
          <div className="flex items-center gap-3">
            {!collapsed && <UniMark size={36} />}
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-100 leading-tight truncate">
                  Uni Education
                </h1>
                <p className="text-xs text-slate-400 leading-tight">Kế toán</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-2 rounded-full hover:bg-slate-800 transition-all duration-300 text-slate-300 hover:text-white",
              collapsed ? "mx-auto" : "ml-auto",
            )}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-full text-sm font-medium transition-all duration-300 group relative mb-1",
                  collapsed
                    ? "px-0 py-2.5 justify-center gap-0"
                    : "px-4 py-3 gap-3",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white",
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border/40 space-y-1">
          <NavLink
            to="/"
            title={collapsed ? "Trang chủ" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full text-[13px] font-semibold text-slate-200 hover:bg-slate-800 hover:text-white w-full transition-all duration-300",
              collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
            )}
          >
            <Home className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Trang chủ</span>}
          </NavLink>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            title={collapsed ? "Đăng xuất" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full text-[13px] font-semibold text-slate-200 hover:bg-red-500 hover:text-white w-full transition-all duration-300",
              collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
            )}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "relative min-h-screen transition-all duration-300",
          collapsed ? "pl-24" : "pl-80",
        )}
      >
        <div className="m-4 mt-4 rounded-3xl bg-white shadow-2xl border border-slate-200/40 overflow-hidden min-h-[calc(100vh-2rem)] flex flex-col">
          <header className="h-20 px-8 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1E68E6] to-blue-500">
                {currentTitle}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
                  onClick={() => setShowNotif(!showNotif)}
                >
                  <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
                  {unreadNotif > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
                      {unreadNotif}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 top-12 w-[350px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Thông báo
                      </h3>
                      {unreadNotif > 0 && (
                        <button
                          onClick={() => markAllRead.mutate()}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 font-medium"
                        >
                          <Check className="w-3 h-3" /> Đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Không có thông báo
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              if (!n.read) markRead.mutate(n.id);
                              setShowNotif(false);

                              if (n.link) {
                                navigate(n.link);
                                return;
                              }

                              if (
                                n.title.includes("giao dịch") ||
                                n.title.includes("Giao dịch")
                              ) {
                                navigate("/finance/transactions");
                              }

                              if (
                                n.title.includes("chi trả") ||
                                n.title.includes("gia sư") ||
                                n.title.includes("Chi trả")
                              ) {
                                navigate("/finance/payouts");
                              }

                              if (
                                n.title.includes("hoàn tiền") ||
                                n.title.includes("refund") ||
                                n.title.includes("Hoàn tiền")
                              ) {
                                navigate("/finance/refunds");
                              }

                              if (
                                n.title.includes("đối soát") ||
                                n.title.includes("Đối soát")
                              ) {
                                navigate("/finance/reconciliation");
                              }

                              if (
                                n.title.includes("báo cáo") ||
                                n.title.includes("thống kê") ||
                                n.title.includes("Báo cáo")
                              ) {
                                navigate("/finance/reports");
                              }
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors flex gap-3",
                              !n.read && "bg-blue-50",
                            )}
                          >
                            <div className="mt-0.5 shrink-0">
                              {notifIcon[n.type]}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    !n.read
                                      ? "text-slate-900"
                                      : "text-slate-500",
                                  )}
                                >
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {n.createdAt}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="px-4 py-2.5 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setShowNotif(false);
                          navigate("/finance/reports");
                        }}
                        className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-500"
                      >
                        Xem tất cả hoạt động{" "}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <UserAvatarDropdown
                avatar={me?.tutor?.avatarUrl ?? ""}
                name={me?.fullname ?? "Kế toán"}
                role="Kế toán"
              />
            </div>
          </header>

          <main className="min-h-[calc(100vh-8rem)] p-6 bg-white overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default FinanceLayout;
