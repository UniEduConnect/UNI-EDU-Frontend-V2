import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Wallet,
  UserSearch,
  Megaphone,
  Home,
  LogOut,
  Star,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EduLogo from "@/components/EduLogo";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import MessageBubble from "@/components/MessageBubble";
import { useState, useRef, useEffect } from "react";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { useMe } from "@/hooks/useUsers";
import { useConversations } from "@/hooks/useConversations";

const navItems = [
  { to: "/parent", icon: LayoutDashboard, label: "Tổng quan", end: true },
  { to: "/parent/tutor-posts", icon: Megaphone, label: "GS tìm học sinh" },
  { to: "/parent/children", icon: Users, label: "Theo dõi học tập" },
  { to: "/parent/reviews", icon: Star, label: "Đánh giá gia sư" },
  { to: "/parent/wallet", icon: Wallet, label: "Thanh toán" },
    { to: "/parent/chat", icon: MessageSquare, label: "Tin nhắn" },
  { to: "/parent/support", icon: HelpCircle, label: "Hỗ trợ" },
  
];

const pageTitles: Record<string, string> = {
  "/parent": "Tổng Quan",
  "/parent/chat": "Tin Nhắn",
  "/parent/children": "Con Em & Tiến Độ Học Tập",
  "/parent/reviews": "Đánh Giá",
  "/parent/reports": "Báo cáo",
  "/parent/wallet": "Thanh Toán",
  "/parent/support": "Hỗ Trợ",
};

const notifIcon: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  info: <Info className="w-4 h-4 text-info" />,
  success: <CheckCircle2 className="w-4 h-4 text-success" />,
  error: <XCircle className="w-4 h-4 text-destructive" />,
};

const ParentLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const { data: me } = useMe();
  const { notifications } = useNotifications();
  const { count: unreadNotif } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { conversations } = useConversations();

  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadChat = conversations.reduce((n, c) => n + c.unreadCount, 0);
  const currentTitle = pageTitles[location.pathname] || "Phụ huynh";

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
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div
          className={cn(
            "h-20 flex items-center gap-3 transition-all",
            collapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          <div className="flex items-center gap-3">
            {!collapsed && <EduLogo size={36} />}
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-100 leading-tight truncate">
                  EduConnect
                </h1>
                <p className="text-xs text-slate-400 leading-tight">
                  Phụ huynh
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-2 rounded-full hover:bg-slate-800 transition-all duration-300 text-slate-300 hover:text-white",
              collapsed ? "mx-auto" : "ml-auto"
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
                  collapsed ? "px-0 py-2.5 justify-center gap-0" : "px-4 py-3 gap-3",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}

              {item.to === "/parent/chat" && unreadChat > 0 && !collapsed && (
                <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full bg-red-500 text-white">
                  {unreadChat}
                </span>
              )}

              {collapsed && item.to === "/parent/chat" && unreadChat > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-semibold rounded-full bg-red-500 text-white">
                  {unreadChat}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border/40 space-y-1">
          <NavLink
            to="/"
            title={collapsed ? "Trang chủ" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full text-[13px] font-semibold text-slate-200 hover:bg-slate-800 hover:text-white w-full transition-all duration-300",
              collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
            )}
          >
            <Home className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Trang chủ</span>}
          </NavLink>
          <button
            onClick={async () => { await logout(); navigate("/login"); }}
            title={collapsed ? "Đăng xuất" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full text-[13px] font-semibold text-slate-200 hover:bg-red-500 hover:text-white w-full transition-all duration-300",
              collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
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
          collapsed ? "pl-24" : "pl-80"
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
                                n.title.includes("thanh toán") ||
                                n.title.includes("Thanh toán") ||
                                n.title.includes("học phí")
                              ) {
                                navigate("/parent/wallet");
                              }

                              if (
                                n.title.includes("đánh giá") ||
                                n.title.includes("Đánh giá")
                              ) {
                                navigate("/parent/reviews");
                              }

                              if (
                                n.title.includes("con em") ||
                                n.title.includes("tiến độ") ||
                                n.title.includes("báo cáo") ||
                                n.title.includes("Buổi học") ||
                                n.title.includes("lớp học")
                              ) {
                                navigate("/parent/children");
                              }

                              if (
                                n.title.includes("hỗ trợ") ||
                                n.title.includes("Hỗ trợ")
                              ) {
                                navigate("/parent/support");
                              }

                              if (
                                n.title.includes("tin nhắn") ||
                                n.title.includes("Tin nhắn")
                              ) {
                                navigate("/parent/chat");
                              }
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors flex gap-3",
                              !n.read && "bg-blue-50"
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
                                    !n.read ? "text-slate-900" : "text-slate-500"
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
                          navigate("/parent/chat");
                        }}
                        className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-500"
                      >
                        Xem tất cả hoạt động <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <UserAvatarDropdown
                avatar=""
                name={me?.fullname ?? ""}
                role="Phụ huynh"
              />
            </div>
          </header>

          <main className="min-h-[calc(100vh-8rem)] p-6 bg-white overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <MessageBubble to="/parent/chat" unreadCount={unreadChat} />
    </div>
  );
};

export default ParentLayout;