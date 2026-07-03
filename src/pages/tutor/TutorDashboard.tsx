import { BookOpen, Wallet, Star, Clock, ArrowUpRight, TrendingUp, CheckCircle2, MessageSquare, X, Send, Phone, Video, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useTutorDashboard } from "@/hooks/useDashboard";
import { useWallet, useWalletTransactions } from "@/hooks/useWallet";
import { useClasses } from "@/hooks/useClasses";
import { useTrials } from "@/hooks/useTrials";
import { useMyReviews } from "@/hooks/useTutors";
import { useConversations } from "@/hooks/useConversations";
import { useClassMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useChat";
import { TutorApprovalBanner } from "@/components/tutor/TutorApprovalBanner";

const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dash } = useTutorDashboard();
  const { data: wallet } = useWallet();
  const { classes } = useClasses({ Status: "active" });
  const { trials } = useTrials({ Status: "pending" });
  const { data: rev } = useMyReviews(1);
  const { conversations } = useConversations();
  const { transactions } = useWalletTransactions();

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChatClass, setSelectedChatClass] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeClasses = dash?.activeClasses ?? 0;
  const upcomingSessions = dash?.upcomingSessions ?? 0;
  const monthlyEarnings = dash?.monthlyEarnings ?? 0;
  const rating = dash?.rating ?? 0;
  const totalReviews = dash?.totalReviews ?? 0;
  const pendingTrials = dash?.pendingTrials ?? 0;

  const walletBalance = wallet?.balance ?? 0;
  const escrowBalance = wallet?.escrowBalance ?? 0;

  const latestReview = rev?.items?.[0];

  // Opened-conversation messages (real backend chat). Detect own messages via senderId.
  const { messages } = useClassMessages(selectedChatClass ?? undefined);
  const sendMessage = useSendMessage(selectedChatClass ?? "");
  const markRead = useMarkMessagesRead(selectedChatClass ?? "");

  const totalUnread = useMemo(
    () => conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  useEffect(() => {
    if (selectedChatClass) {
      markRead.mutate();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatClass, messages.length]);

  const handleSendChat = () => {
    if (!chatInput.trim() || !selectedChatClass) return;
    sendMessage.mutate(chatInput.trim());
    setChatInput("");
  };

  // TODO(BE): GET /Tutors/me/earnings-series?months=6 for the income chart.
  // Derived client-side from wallet transactions by bucketing escrow_release income by month.
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "escrow_release" || t.status !== "completed") continue;
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, income]) => ({ month: `T${Number(key.split("-")[1]) + 1}`, income }));
  }, [transactions]);

  const chartConfig = {
    income: { label: "Thu nhập", color: "hsl(var(--primary))" },
  };

  const selectedConversation = selectedChatClass
    ? conversations.find((c) => c.classId === selectedChatClass)
    : null;

  const stats = [
    { label: "Lớp đang dạy", value: activeClasses, sub: `${upcomingSessions} buổi sắp tới`, icon: BookOpen, iconBg: "bg-blue-100", iconColor: "text-blue-600", bg: "from-blue-700 to-blue-900", link: "/tutor/classes" },
    { label: "Thu nhập tháng", value: `${(monthlyEarnings / 1000000).toFixed(1)}tr`, sub: `Khả dụng: ${(walletBalance / 1000000).toFixed(1)}tr`, icon: Wallet, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", bg: "from-emerald-500 to-teal-500", link: "/tutor/wallet" },
    { label: "Đánh giá TB", value: rating.toFixed(1), sub: `${totalReviews} đánh giá`, icon: Star, iconBg: "bg-amber-100", iconColor: "text-amber-600", bg: "from-amber-500 to-orange-500", link: "/tutor/reviews" },
    { label: "Yêu cầu học thử", value: pendingTrials, sub: "đang chờ", icon: CheckCircle2, iconBg: "bg-rose-100", iconColor: "text-rose-600", bg: "from-rose-500 to-pink-500", link: "/tutor/find-students?tab=trials" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Account approval state (set by admin verification) */}
      <TutorApprovalBanner />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <button key={i} onClick={() => navigate(s.link)} className={`rounded-2xl p-5 flex items-center gap-4 hover:shadow-elevated transition-all text-left group bg-gradient-to-r ${s.bg} text-white`}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.iconBg)}>
              <s.icon className={cn("w-6 h-6", s.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
          </button>
        ))}
      </div>

      {/* Progress Overview */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Tiến độ tổng quan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Lớp đang dạy</span>
              <span className="text-xs font-semibold text-foreground">{activeClasses}</span>
            </div>
            <Progress value={activeClasses > 0 ? 100 : 0} className="h-2.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{upcomingSessions} buổi sắp diễn ra</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Escrow đang giữ</span>
              <span className="text-xs font-semibold text-success">
                {escrowBalance.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <div className="bg-success/150 h-full rounded-full transition-all" style={{ width: `${escrowBalance > 0 ? 100 : 0}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Khả dụng: {walletBalance.toLocaleString("vi-VN")}đ</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Đánh giá trung bình</span>
              <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)} ★</span>
            </div>
            <Progress value={(rating / 5) * 100} className="h-2.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{totalReviews} đánh giá</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Income Line Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-success" /> Thu nhập theo tháng
            </h3>
            {monthlyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString("vi-VN")}đ`} />} />
                  <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} activeDot={{ r: 7 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu thu nhập
              </div>
            )}
          </div>

          {/* Active Classes Progress */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Tiến độ lớp học
            </h3>
            <div className="space-y-4">
              {classes.map(c => (
                <button key={c.id} onClick={() => navigate(`/tutor/classes/${c.id}`)} className="w-full text-left group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                        {c.studentName?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.studentName} • {c.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{c.completedSessions}/{c.totalSessions}</p>
                      <p className="text-[10px] text-muted-foreground">{c.totalSessions > 0 ? Math.round((c.completedSessions / c.totalSessions) * 100) : 0}%</p>
                    </div>
                  </div>
                  <Progress value={c.totalSessions > 0 ? (c.completedSessions / c.totalSessions) * 100 : 0} className="h-1.5" />
                  {/* TODO(BE): add escrow fields to ClassListItemResponse */}
                  <div className="flex items-center justify-end mt-1">
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
              {classes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Không có lớp đang hoạt động</p>}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
              <span>Yêu cầu học thử</span>
              {trials.length > 0 && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-warning dark:bg-amber-900/30 dark:text-amber-400">{trials.length}</span>}
            </h3>
            {trials.length > 0 ? trials.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-2 last:mb-0">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {t.studentName?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.studentName}</p>
                  <p className="text-xs text-muted-foreground">{t.subjectName} • {new Date(t.requestedAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <button onClick={() => navigate("/tutor/classes")} className="text-xs text-primary font-medium">Xem</button>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">Không có yêu cầu mới</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Ví điện tử</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-success/15 dark:bg-emerald-900/20 rounded-xl">
                <span className="text-xs text-muted-foreground">Khả dụng</span>
                <span className="text-sm font-bold text-success">{walletBalance.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                <span className="text-xs text-muted-foreground">Escrow đang giữ</span>
                <span className="text-sm font-bold text-primary">{escrowBalance.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
            <button onClick={() => navigate("/tutor/wallet")} className="w-full mt-3 text-xs text-primary font-medium hover:underline">Xem chi tiết →</button>
          </div>

          {latestReview && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Đánh giá gần nhất</h3>
              <div className="flex items-start gap-3">
                <img src={latestReview.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < latestReview.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{latestReview.comment}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">– {latestReview.parentName || latestReview.studentName}</p>
                </div>
              </div>
            </div>
          )}

          {/* TODO(BE): GET /Tutors/me/students for student progress */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Tiến độ học sinh</h3>
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
          </div>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button onClick={() => setChatOpen(true)} className="relative w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-105">
            <MessageSquare className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground px-1">
                {totalUnread}
              </span>
            )}
          </button>
        ) : (
          <div className="w-[380px] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedConversation ? selectedConversation.className : "Tin nhắn"}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {selectedChatClass && (
                  <>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Gọi thoại"><Phone className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Gọi video"><Video className="w-4 h-4" /></button>
                    <button onClick={() => setSelectedChatClass(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                  </>
                )}
                <button onClick={() => { setChatOpen(false); setSelectedChatClass(null); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {!selectedChatClass ? (
              <div className="flex-1 overflow-y-auto">
                {conversations.map(c => (
                  <button key={c.classId} onClick={() => setSelectedChatClass(c.classId)} className="w-full text-left p-4 border-b border-border/50 hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <div className="relative">
                      {c.otherPartyAvatar ? (
                        <img src={c.otherPartyAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">{c.otherPartyName?.charAt(0) ?? "?"}</div>
                      )}
                      {c.unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-destructive text-destructive-foreground px-0.5">{c.unreadCount}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{c.className}</p>
                        {c.lastTimestamp && <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{new Date(c.lastTimestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage ? `${c.otherPartyName}: ${c.lastMessage}` : "Chưa có tin nhắn"}</p>
                    </div>
                  </button>
                ))}
                {conversations.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Chưa có cuộc trò chuyện</p>}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map(m => {
                    const own = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[75%] px-3 py-2 rounded-2xl text-sm", own ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                          {!own && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{m.senderName}</p>}
                          <p className="text-[13px]">{m.message}</p>
                          <p className={cn("text-[9px] mt-0.5", own ? "text-primary-foreground/60" : "text-muted-foreground")}>{new Date(m.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendChat()} className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm" placeholder="Nhập tin nhắn..." />
                  <button onClick={handleSendChat} disabled={!chatInput.trim()} className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"><Send className="w-4 h-4" /></button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorDashboard;
