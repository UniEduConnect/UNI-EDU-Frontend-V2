import { useWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from "@/hooks/useFinance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Shield,
  Wallet,
  AlertTriangle,
  Banknote,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Chờ duyệt", variant: "outline" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

// Friendly Vietnamese label for a raw payout method ("bank" is the only one supported now).
const methodLabels: Record<string, string> = {
  bank: "Ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};
const methodLabel = (method?: string | null) =>
  method ? methodLabels[method.toLowerCase()] ?? method : "—";

const FinancePayouts = () => {
  // Live withdrawals from /api/Finance/withdrawals — sole source of truth.
  const { withdrawals, isLoading } = useWithdrawals();
  const approveMutation = useApproveWithdrawal();
  const rejectMutation = useRejectWithdrawal();
  const { toast } = useToast();

  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingPage, setPendingPage] = useState(1);
  const [processedPage, setProcessedPage] = useState(1);

  const pageSize = 10;

  const allFiltered = withdrawals.filter(w => {
    const matchSearch = w.tutorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending = allFiltered.filter(w => w.status === "pending");
  const processed = allFiltered.filter(w => w.status !== "pending");

  const pendingPageCount = Math.max(1, Math.ceil(pending.length / pageSize));
  const processedPageCount = Math.max(1, Math.ceil(processed.length / pageSize));

  const safePendingPage = Math.min(pendingPage, pendingPageCount);
  const safeProcessedPage = Math.min(processedPage, processedPageCount);

  const pagedPending = pending.slice(
    (safePendingPage - 1) * pageSize,
    safePendingPage * pageSize
  );

  const pagedProcessed = processed.slice(
    (safeProcessedPage - 1) * pageSize,
    safeProcessedPage * pageSize
  );

  const detail = withdrawals.find(w => w.id === detailId);

  const totalWithdrawnAll = withdrawals.reduce((s, w) => s + w.totalWithdrawn, 0);
  const totalPending = withdrawals
    .filter(w => w.status === "pending")
    .reduce((s, w) => s + w.amount, 0);
  const totalApproved = withdrawals
    .filter(w => w.status === "approved")
    .reduce((s, w) => s + w.amount, 0);
  const totalRejected = withdrawals.filter(w => w.status === "rejected").length;

  useEffect(() => {
    setPendingPage(1);
    setProcessedPage(1);
  }, [search, statusFilter]);

  const handleReject = () => {
    if (rejectDialog && rejectNote.trim()) {
      rejectMutation.mutate({ id: rejectDialog, payload: { note: rejectNote } }, {
        onSuccess: () => toast({ title: "Đã từ chối yêu cầu", variant: "destructive" }),
        onError: (e) => toast({ title: e instanceof Error ? e.message : "Từ chối thất bại", variant: "destructive" }),
      });
      setRejectDialog(null);
      setRejectNote("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải yêu cầu rút tiền...
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* HERO */}
      {/* <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row">
          <div>
            <h2 className="text-2xl font-bold">Giải ngân gia sư</h2>
            <p className="mt-1 text-sm text-white/80">
              Quản lý yêu cầu rút tiền, số dư escrow và lịch sử xử lý giải ngân
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Chờ duyệt</p>
              <p className="text-xl font-bold">{pending.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Escrow</p>
              <p className="text-xl font-bold">{totalEscrow.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {
            // TODO(BE): no per-tutor escrow/total-earned field on WithdrawalAdminResponse; showing total already-withdrawn instead.
            label: "Tổng đã rút",
            value: `${totalWithdrawnAll.toLocaleString("vi-VN")}đ`,
            sub: "Lũy kế đã giải ngân",
            color: "from-blue-700 to-blue-900",
            icon: Shield,
          },
          {
            label: "Chờ duyệt",
            value: pending.length,
            sub: "Yêu cầu đang chờ",
            color: "from-blue-700 to-blue-900",
            icon: Clock,
          },
          {
            label: "Tổng chờ duyệt",
            value: `${totalPending.toLocaleString("vi-VN")}đ`,
            sub: "Số tiền cần xử lý",
            color: "from-blue-700 to-blue-900",
            icon: Wallet,
          },
          {
            label: "Đã giải ngân",
            value: `${totalApproved.toLocaleString("vi-VN")}đ`,
            sub: "Yêu cầu đã duyệt",
            color: "from-blue-700 to-blue-900",
            icon: CheckCircle2,
          },
          {
            label: "Từ chối",
            value: totalRejected,
            sub: "Yêu cầu không hợp lệ",
            color: "from-blue-700 to-blue-900",
            icon: XCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`group rounded-2xl bg-gradient-to-r p-4 text-white transition-all hover:shadow-lg ${s.color}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-white/80">{s.label}</p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <s.icon className="h-[18px] w-[18px]" />
              </div>
            </div>
            <p className="mt-2 text-xl font-bold leading-tight break-words">{s.value}</p>
            <p className="mt-1 text-[10px] text-white/80">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* FILTER */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên gia sư..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PENDING */}
      {pending.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Yêu cầu chờ duyệt ({pending.length})
          </h3>

          <div className="space-y-4">
            {pagedPending.map(w => (
              <div
                key={w.id}
                className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
              >
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={w.tutorAvatar ?? undefined}
                      alt={w.tutorName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{w.tutorName}</p>
                      <p className="text-xs text-muted-foreground">Yêu cầu ngày {w.requestDate}</p>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-foreground">
                    {w.amount.toLocaleString("vi-VN")}đ
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <span className="block text-[10px] text-muted-foreground">Ngân hàng</span>
                    <span className="text-sm font-medium text-foreground">{w.bankName}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <span className="block text-[10px] text-muted-foreground">STK</span>
                    <span className="text-sm font-medium text-foreground">{w.bankAccount}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <span className="block text-[10px] text-muted-foreground">Hình thức</span>
                    <span className="text-sm font-medium text-foreground">{methodLabel(w.method)}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <span className="block text-[10px] text-muted-foreground">Đã rút lũy kế</span>
                    <span className="text-sm font-medium text-foreground">
                      {w.totalWithdrawn.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {w.note && (
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <span className="block text-[10px] text-muted-foreground">Nội dung chuyển tiền</span>
                    <span className="font-mono text-sm font-semibold text-foreground">{w.note}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setDetailId(w.id)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Chi tiết
                  </Button>

                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      approveMutation.mutate({ id: w.id }, {
                        onSuccess: () => toast({ title: "Đã duyệt yêu cầu rút tiền" }),
                        onError: (e) => toast({ title: e instanceof Error ? e.message : "Duyệt thất bại", variant: "destructive" }),
                      });
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Duyệt
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => setRejectDialog(w.id)}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Từ chối
                  </Button>
                </div>
              </div>
            ))}

            {pending.length > 0 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        setPendingPage(p => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: pendingPageCount }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink
                        href="#"
                        isActive={safePendingPage === idx + 1}
                        onClick={e => {
                          e.preventDefault();
                          setPendingPage(idx + 1);
                        }}
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        setPendingPage(p => Math.min(pendingPageCount, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}

      {/* PROCESSED */}
      {processed.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Đã xử lý ({processed.length})</h3>

          <div className="space-y-3">
            {pagedProcessed.map(w => {
              const cfg = statusConfig[w.status];

              return (
                <div
                  key={w.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={w.tutorAvatar ?? undefined}
                        alt={w.tutorName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{w.tutorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.requestDate} • {w.bankName} {w.bankAccount}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      <p className="text-sm font-bold text-foreground">
                        {w.amount.toLocaleString("vi-VN")}đ
                      </p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl p-0"
                        onClick={() => setDetailId(w.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {w.reviewNote && w.status === "rejected" && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <div>
                        <p className="text-xs font-semibold text-destructive">Lý do từ chối</p>
                        <p className="mt-0.5 text-xs text-destructive/80">{w.reviewNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {processed.length > 0 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        setProcessedPage(p => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: processedPageCount }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink
                        href="#"
                        isActive={safeProcessedPage === idx + 1}
                        onClick={e => {
                          e.preventDefault();
                          setProcessedPage(idx + 1);
                        }}
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        setProcessedPage(p => Math.min(processedPageCount, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}

      {/* EMPTY */}
      {allFiltered.length === 0 && (
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Không có yêu cầu phù hợp</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
          </p>
        </div>
      )}

      {/* DETAIL DIALOG */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4 pt-2">
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={detail.tutorAvatar ?? undefined}
                    alt={detail.tutorName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-base font-semibold text-foreground">{detail.tutorName}</p>
                    <p className="text-xs text-muted-foreground">
                      Yêu cầu ngày {detail.requestDate}
                    </p>
                    <Badge
                      variant={statusConfig[detail.status].variant}
                      className="mt-1"
                    >
                      {statusConfig[detail.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Số tiền yêu cầu rút</p>
                <p className="text-2xl font-bold text-foreground">
                  {detail.amount.toLocaleString("vi-VN")}đ
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Ngân hàng</Label>
                  <p className="text-sm font-medium text-foreground">{detail.bankName}</p>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Số tài khoản</Label>
                  <p className="text-sm font-medium text-foreground">{detail.bankAccount}</p>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Hình thức</Label>
                  <p className="text-sm font-medium text-foreground">{methodLabel(detail.method)}</p>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <Label className="text-[10px] text-muted-foreground">Đã rút lũy kế</Label>
                  <p className="text-sm font-medium text-foreground">
                    {detail.totalWithdrawn.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              {detail.note && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <Label className="text-[10px] text-muted-foreground">Nội dung chuyển tiền</Label>
                  <p className="font-mono text-sm font-semibold text-foreground">{detail.note}</p>
                </div>
              )}

              {detail.reviewNote && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">Lý do từ chối</p>
                    <p className="mt-0.5 text-xs text-destructive/80">{detail.reviewNote}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={() => {
          setRejectDialog(null);
          setRejectNote("");
        }}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Từ chối yêu cầu rút tiền
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập lý do từ chối để thông báo cho gia sư:
            </p>

            <Textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="VD: Số dư khả dụng không đủ, cần hoàn thành thêm buổi dạy..."
              className="rounded-xl"
              rows={3}
            />

            <Button
              onClick={handleReject}
              variant="destructive"
              className="w-full rounded-xl"
              disabled={!rejectNote.trim()}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancePayouts;