import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  X,
  Clock,
  Search,
  FileText,
  ArrowUpRight,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRefunds, useApproveRefund, useRejectRefund } from "@/hooks/useRefunds";
import type { RefundItem } from "@/types/api";

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning dark:bg-amber-900/20",
  approved: "bg-success/15 text-success dark:bg-emerald-900/20",
  rejected: "bg-destructive/10 text-destructive",
};

const pageSize = 10;

const FinanceRefunds = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [processDialog, setProcessDialog] = useState<{
    request: RefundItem;
    action: "approve" | "reject";
  } | null>(null);
  const [processNote, setProcessNote] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [page, setPage] = useState(1);

  const { refunds, isLoading, isError } = useRefunds({
    Status: filterStatus === "all" ? undefined : filterStatus,
    Page: page,
  });
  const approveRefund = useApproveRefund();
  const rejectRefund = useRejectRefund();

  const allRefundRequests = refunds;

  const filtered = allRefundRequests.filter(
    r =>
      !search ||
      r.tutorName.toLowerCase().includes(search.toLowerCase()) ||
      r.className.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRefunds = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pendingCount = allRefundRequests.filter(r => r.status === "pending").length;
  const approvedCount = allRefundRequests.filter(r => r.status === "approved").length;
  const rejectedCount = allRefundRequests.filter(r => r.status === "rejected").length;
  const totalRefundAmount = allRefundRequests
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  const handleProcess = () => {
    if (!processDialog || !processNote.trim()) {
      toast.error("Vui lòng nhập lý do xử lý");
      return;
    }

    const { request, action } = processDialog;
    const note = processNote.trim();
    const mutation = action === "approve" ? approveRefund : rejectRefund;

    mutation.mutate(
      { id: request.id, payload: { note } },
      {
        onSuccess: () => {
          toast.success(action === "approve" ? "Đã duyệt hoàn tiền" : "Đã từ chối hoàn tiền");
          setProcessDialog(null);
          setProcessNote("");
        },
        onError: () => {
          toast.error("Không thể xử lý yêu cầu. Vui lòng thử lại.");
        },
      }
    );
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* HERO */}
      {/* <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row">
          <div>
            <h2 className="text-2xl font-bold">Quản lý hoàn tiền</h2>
            <p className="mt-1 text-sm text-white/80">
              Theo dõi, xét duyệt và lưu nhật ký các yêu cầu hoàn tiền từ gia sư
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Chờ duyệt</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Đã hoàn</p>
              <p className="text-xl font-bold">{totalRefundAmount.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Chờ duyệt",
            value: pendingCount,
            sub: "Yêu cầu cần xử lý",
            color: "from-amber-500 to-orange-500",
            icon: Clock,
          },
          {
            label: "Đã duyệt",
            value: approvedCount,
            sub: "Yêu cầu đã chấp nhận",
            color: "from-emerald-500 to-teal-500",
            icon: CheckCircle2,
          },
          {
            label: "Từ chối",
            value: rejectedCount,
            sub: "Yêu cầu không hợp lệ",
            color: "from-rose-500 to-pink-500",
            icon: XCircle,
          },
          {
            label: "Tổng hoàn tiền",
            value: `${totalRefundAmount.toLocaleString("vi-VN")}đ`,
            sub: "Đã xử lý thành công",
            color: "from-blue-500 to-indigo-500",
            icon: RefreshCcw,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={cn(
              "group flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white transition-all hover:shadow-lg",
              s.color
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-white/80">{s.sub}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0" />
          </div>
        ))}
      </div>

      {/* LIST */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Danh sách yêu cầu hoàn tiền</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Xử lý yêu cầu hoàn tiền và theo dõi trạng thái từng trường hợp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm gia sư, lớp..."
                className="w-56 rounded-xl border border-border bg-muted/50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-1 rounded-2xl bg-muted p-1">
              {[
                { label: "Tất cả", value: "all" },
                { label: "Chờ duyệt", value: "pending" },
                { label: "Đã duyệt", value: "approved" },
                { label: "Từ chối", value: "rejected" },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                    filterStatus === f.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLogs(true)}
              className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              Log
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải yêu cầu hoàn tiền...
          </div>
        ) : isError && allRefundRequests.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không tải được danh sách hoàn tiền. Vui lòng thử lại.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không có yêu cầu hoàn tiền nào
          </p>
        ) : (
          <div className="space-y-3">
            {pagedRefunds.map(r => {
              const st = r.status;
              const pNote = r.reviewNote;
              const pAt = r.reviewedAt;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{r.tutorName}</p>
                        <span
                          className={cn(
                            "rounded-lg px-2 py-0.5 text-[10px] font-medium",
                            statusColors[st]
                          )}
                        >
                          {statusLabels[st]}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Lớp: <strong>{r.className}</strong> • HS: {r.studentName}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Số tiền:{" "}
                        <strong className="text-foreground">
                          {r.amount.toLocaleString("vi-VN")}đ
                        </strong>{" "}
                        / Escrow chưa giải ngân: {r.maxAmount.toLocaleString("vi-VN")}đ
                      </p>

                      <div className="mt-2 rounded-xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Lý do:</strong> {r.reason}
                        </p>
                      </div>

                      <p className="mt-2 text-[10px] text-muted-foreground/70">
                        Ngày tạo: {r.createdAt}
                      </p>

                      {(st === "approved" || st === "rejected") && pNote && (
                        <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3">
                          <p className="text-xs text-muted-foreground">
                            <strong>Ghi chú KT:</strong> {pNote}
                          </p>
                          {pAt && (
                            <p className="mt-1 text-[10px] text-muted-foreground/70">
                              Xử lý lúc {pAt}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {st === "pending" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => {
                            setProcessDialog({ request: r, action: "approve" });
                            setProcessNote("");
                          }}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Duyệt
                        </button>

                        <button
                          onClick={() => {
                            setProcessDialog({ request: r, action: "reject" });
                            setProcessNote("");
                          }}
                          className="flex items-center gap-1 rounded-xl bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                        >
                          <X className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setPage(p => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>

                {Array.from({ length: pageCount }).map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === idx + 1}
                      onClick={e => {
                        e.preventDefault();
                        setPage(idx + 1);
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
                      setPage(p => Math.min(pageCount, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* PROCESS DIALOG */}
      <Dialog open={!!processDialog} onOpenChange={() => setProcessDialog(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {processDialog?.action === "approve" ? (
                <>
                  <Check className="h-5 w-5 text-emerald-600" />
                  Duyệt hoàn tiền
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-destructive" />
                  Từ chối hoàn tiền
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {processDialog && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-sm font-medium text-foreground">
                  {processDialog.request.className}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gia sư: {processDialog.request.tutorName} • Số tiền:{" "}
                  {processDialog.request.amount.toLocaleString("vi-VN")}đ
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Lý do {processDialog.action === "approve" ? "duyệt" : "từ chối"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={processNote}
                  onChange={e => setProcessNote(e.target.value)}
                  placeholder={
                    processDialog.action === "approve"
                      ? "Nhập lý do duyệt hoàn tiền..."
                      : "Nhập lý do từ chối..."
                  }
                  className="mt-2 min-h-[100px] w-full resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={500}
                />
              </div>

              {processDialog.action === "approve" && (
                <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/15 p-3 dark:border-warning/40 dark:bg-amber-900/10">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-xs text-warning dark:text-amber-400">
                    Sau khi duyệt, hệ thống sẽ hoàn{" "}
                    {processDialog.request.amount.toLocaleString("vi-VN")}đ về ví phụ huynh/học
                    sinh và cập nhật Escrow.
                  </p>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={
                  !processNote.trim() || approveRefund.isPending || rejectRefund.isPending
                }
                className={cn(
                  "w-full rounded-xl py-2.5 font-medium transition-colors disabled:opacity-50",
                  processDialog.action === "approve"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
              >
                {processDialog.action === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LOG DIALOG */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Nhật ký xử lý hoàn tiền
            </DialogTitle>
          </DialogHeader>

          {/* TODO(BE): no moderation-log endpoint exists. Each refund only carries
              reviewNote/reviewedAt; a dedicated audit-log API is needed to populate this. */}
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceRefunds;