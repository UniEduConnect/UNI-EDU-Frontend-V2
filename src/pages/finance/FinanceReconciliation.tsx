import { useMemo, useState } from "react";
import { useFinanceTransactions, useWithdrawals } from "@/hooks/useFinance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Landmark,
  Hourglass,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const FinanceReconciliation = () => {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const { transactions, isLoading: txLoading } = useFinanceTransactions({ Page: page });
  const { withdrawals, isLoading: wLoading } = useWithdrawals({ Status: "pending" });
  const isLoading = txLoading || wLoading;

  // NOTE: backend transactions are paged server-side; summary is computed over
  // the currently-loaded page. Inflow = deposit/escrow_in, outflow = withdrawal/refund/escrow_release.
  const summary = useMemo(() => {
    const totalIn = transactions
      .filter(
        t =>
          (t.type === "deposit" || t.type === "escrow_in") &&
          t.status === "completed"
      )
      .reduce((s, t) => s + t.amount, 0);

    const totalOut = transactions
      .filter(
        t =>
          (t.type === "withdrawal" || t.type === "refund" || t.type === "escrow_release") &&
          t.status === "completed"
      )
      .reduce((s, t) => s + t.amount, 0);

    const pending = transactions
      .filter(t => t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);

    const pendingWithdraw = withdrawals
      .filter(w => w.status === "pending")
      .reduce((s, w) => s + w.amount, 0);

    const delta = totalIn - totalOut - pending;

    return { totalIn, totalOut, pending, pendingWithdraw, delta };
  }, [transactions, withdrawals]);

  // Server paginates; we render the page we fetched. Page-count is unknown from
  // this endpoint, so keep stepping while the current page is full.
  // TODO(BE): expose total/totalPages on the transactions list response for exact paging.
  const pageSize = 10;
  const hasNextPage = transactions.length >= pageSize;
  const pagedTransactions = transactions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <h2 className="text-2xl font-bold">Đối soát tài chính</h2>
            <p className="mt-1 text-sm text-white/80">
              Theo dõi dòng tiền vào ra, khoản treo và nhật ký đối soát hệ thống
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Chênh lệch</p>
              <p className="text-xl font-bold">{summary.delta.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/80">Khoản treo</p>
              <p className="text-xl font-bold">{summary.pending.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {
            label: "Đã thu",
            value: `${summary.totalIn.toLocaleString("vi-VN")}đ`,
            sub: "Dòng tiền vào",
            color: "from-blue-700 to-blue-900",
            icon: Landmark,
          },
          {
            label: "Đã chi",
            value: `${summary.totalOut.toLocaleString("vi-VN")}đ`,
            sub: "Dòng tiền ra",
            color: "from-blue-700 to-blue-900",
            icon: Wallet,
          },
          {
            label: "Khoản treo",
            value: `${summary.pending.toLocaleString("vi-VN")}đ`,
            sub: "Giao dịch chờ xử lý",
            color: "from-blue-700 to-blue-900",
            icon: Hourglass,
          },
          {
            label: "Chờ chi trả GS",
            value: `${summary.pendingWithdraw.toLocaleString("vi-VN")}đ`,
            sub: "Yêu cầu đang chờ",
            color: "from-blue-700 to-blue-900",
            icon: AlertTriangle,
          },
          {
            label: "Chênh lệch",
            value: `${summary.delta.toLocaleString("vi-VN")}đ`,
            sub: "Số liệu đối soát",
            color: "from-blue-700 to-blue-900",
            icon: Scale,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={cn(
              "group rounded-2xl bg-gradient-to-r p-4 text-white transition-all hover:shadow-lg",
              s.color
            )}
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

      {/* LOG */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4 text-primary" />
          Nhật ký đối soát
        </h3>

        {pagedTransactions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu đối soát
          </p>
        ) : (
        <div className="space-y-3">
          {pagedTransactions.map(tx => {
            const matched = tx.status === "completed";
            const isChecked = checkedItems.has(tx.id);

            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                      {isChecked && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Đã kiểm tra
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Người dùng: {tx.user}</span>
                      <span>Ngày: {tx.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-bold text-foreground">
                      {tx.amount.toLocaleString("vi-VN")}đ
                    </p>

                    <div className="flex items-center gap-2">
                      {matched ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}

                      <Badge variant={matched ? "secondary" : "outline"}>
                        {matched ? "Khớp" : "Cần kiểm tra"}
                      </Badge>
                    </div>

                    <button
                      onClick={() => setDetailId(tx.id)}
                      className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        <div className="mt-5">
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

              <PaginationItem>
                <PaginationLink href="#" isActive onClick={e => e.preventDefault()}>
                  {page}
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (hasNextPage) setPage(p => p + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Detail Modal */}
      {detailId && (
        <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chi tiết giao dịch</DialogTitle>
            </DialogHeader>

            {transactions.find((t) => t.id === detailId) && (
              <div className="space-y-4 py-4">
                {(() => {
                  const tx = transactions.find((t) => t.id === detailId);
                  if (!tx) return null;

                  const matched = tx.status === "completed";
                  const isChecked = checkedItems.has(tx.id);

                  return (
                    <>
                      <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-xs text-slate-600 font-medium">
                            Mô tả
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {tx.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-slate-600 font-medium">
                              Người dùng
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                              {tx.user}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-medium">
                              Ngày
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                              {tx.date}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600 font-medium">
                            Số tiền
                          </p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            {tx.amount.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-slate-600 font-medium">
                            Trạng thái khớp
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {matched ? "✓ Khớp" : "⚠ Cần kiểm tra"}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-slate-600 font-medium">
                            Đã kiểm tra
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {isChecked ? "✓ Có" : "Chưa"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            setCheckedItems(
                              (prev) => new Set(prev).add(detailId)
                            );
                          }}
                          disabled={isChecked}
                          className="w-full rounded-xl"
                          variant={isChecked ? "outline" : "default"}
                        >
                          {isChecked
                            ? "Đã kiểm tra ✓"
                            : "Đánh dấu đã kiểm tra"}
                        </Button>
                        <Button
                          onClick={() => setDetailId(null)}
                          variant="outline"
                          className="w-full rounded-xl"
                        >
                          Đóng
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FinanceReconciliation;