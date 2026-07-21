import { useFinanceTransactions } from "@/hooks/useFinance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  Download,
  Eye,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
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
import { cn } from "@/lib/utils";

// Matches the backend WalletTxType enum: deposit | escrow_in | escrow_release | withdrawal | refund | platform_fee.
const typeLabels: Record<string, string> = {
  deposit: "Nạp tiền",
  escrow_in: "Ký quỹ vào",
  escrow_release: "Giải ngân",
  withdrawal: "Rút tiền",
  refund: "Hoàn tiền",
  platform_fee: "Phí nền tảng",
};
const INFLOW_TYPES = ["deposit", "escrow_in", "platform_fee"];
const OUTFLOW_TYPES = ["withdrawal", "refund", "escrow_release"];

// Friendly Vietnamese label for a raw role code (tutor/teacher are both the "gia sư" side).
const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  tutor: "Gia sư",
  teacher: "Gia sư",
  student: "Học sinh",
  parent: "Phụ huynh",
  office: "Văn phòng",
  finance: "Kế toán",
  exam_manager: "Quản lý đề thi",
};
const roleLabel = (role?: string | null) =>
  role ? roleLabels[role.toLowerCase()] ?? role : "—";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed: { label: "Hoàn thành", variant: "default" },
  pending: { label: "Chờ xử lý", variant: "outline" },
  failed: { label: "Thất bại", variant: "destructive" },
  refunded: { label: "Đã hoàn", variant: "secondary" },
};

const FinanceTransactions = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pageSize = 10;

  // Live transactions from GET /api/Finance/transactions.
  // Type/Status/Page are server-side query params; search + date are filtered
  // client-side over the fetched page.
  const { transactions, isLoading, isError } = useFinanceTransactions({
    Type: typeFilter === "all" ? undefined : typeFilter,
    Status: statusFilter === "all" ? undefined : statusFilter,
    Page: page,
  });

  const filtered = transactions.filter(t => {
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || t.date.includes(dateFilter);
    return matchSearch && matchDate;
  });

  // TODO(BE): summary totals aggregate only the current fetched page; there is no
  // /Finance/transactions summary endpoint, so figures reset per page. Use
  // useFinanceReports() for portfolio-wide totals if exact numbers are required.
  const totalIn = transactions
    .filter(t => INFLOW_TYPES.includes(t.type) && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = transactions
    .filter(t => OUTFLOW_TYPES.includes(t.type) && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  const pendingCount = transactions.filter(t => t.status === "pending").length;

  const detail = transactions.find(t => t.id === detailId);
  // Server already paginates by Page; render the (client-filtered) fetched page as-is.
  const currentPage = page;
  const pagedTransactions = filtered;
  // No total-count is returned by the endpoint, so allow paging forward while the
  // current server page is full and offer the previous page.
  const hasNextPage = transactions.length >= pageSize;

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  const exportTransactions = (format: string) => {
    toast({ title: `Đã xuất danh sách giao dịch (${format})` });
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quản lý giao dịch</h2>
            <p className="mt-1 text-sm text-white/80">
              Theo dõi dòng tiền vào ra, trạng thái xử lý và chi tiết từng giao dịch
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="rounded-2xl border-0 bg-white/15 text-white backdrop-blur hover:bg-white/20"
              onClick={() => exportTransactions("PDF")}
            >
              <Download className="mr-1 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="secondary"
              className="rounded-2xl border-0 bg-white/15 text-white backdrop-blur hover:bg-white/20"
              onClick={() => exportTransactions("Excel")}
            >
              <Download className="mr-1 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng thu",
            value: `+${totalIn.toLocaleString("vi-VN")}đ`,
            sub: "Giao dịch đầu vào",
            color: "from-blue-700 to-blue-900",
            icon: ArrowUpRight,
          },
          {
            label: "Tổng chi",
            value: `-${totalOut.toLocaleString("vi-VN")}đ`,
            sub: "Giao dịch đầu ra",
            color: "from-blue-700 to-blue-900",
            icon: ArrowDownRight,
          },
          {
            label: "Lợi nhuận",
            value: `${(totalIn - totalOut).toLocaleString("vi-VN")}đ`,
            sub: "Thu - chi hoàn tất",
            color: "from-blue-700 to-blue-900",
            icon: DollarSign,
          },
          {
            label: "Chờ xử lý",
            value: pendingCount,
            sub: "Giao dịch đang đợi",
            color: "from-blue-700 to-blue-900",
            icon: Calendar,
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

      {/* LIST */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              Danh sách giao dịch ({filtered.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mô tả, người dùng..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 w-[150px] rounded-xl">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="deposit">Nạp tiền</SelectItem>
                <SelectItem value="escrow_in">Ký quỹ vào</SelectItem>
                <SelectItem value="escrow_release">Giải ngân</SelectItem>
                <SelectItem value="withdrawal">Rút tiền</SelectItem>
                <SelectItem value="refund">Hoàn tiền</SelectItem>
                <SelectItem value="platform_fee">Phí nền tảng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[150px] rounded-xl">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="refunded">Đã hoàn</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Lọc ngày (VD: 03/03)"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="h-10 w-[160px] rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải giao dịch...
            </div>
          )}

          {!isLoading && pagedTransactions.map(t => {
            const sCfg = statusConfig[t.status] ?? { label: t.status, variant: "outline" as const };
            const isIncome =
              t.type === "tuition" || t.type === "deposit" || t.type === "exam-fee";

            return (
              <div
                key={t.id}
                className="cursor-pointer rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                onClick={() => setDetailId(t.id)}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{t.description}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {typeLabels[t.type] ?? t.type}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Người dùng: {t.user}</span>
                      <span>Vai trò: {roleLabel(t.userRole)}</span>
                      <span>Ngày: {t.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        isIncome ? "text-primary" : "text-destructive"
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {Math.abs(t.amount).toLocaleString("vi-VN")}đ
                    </p>

                    <Badge variant={sCfg.variant}>{sCfg.label}</Badge>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 rounded-xl p-0"
                      onClick={e => {
                        e.stopPropagation();
                        setDetailId(t.id);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              {isError ? "Không tải được giao dịch. Vui lòng thử lại." : "Chưa có giao dịch nào"}
            </div>
          )}
        </div>

        {!isLoading && (currentPage > 1 || hasNextPage) && (
          <div className="pt-5">
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
                  <PaginationLink href="#" isActive>
                    {currentPage}
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
        )}
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4 pt-2">
              <div className="rounded-2xl bg-muted/40 p-4 text-center">
                <p
                  className={cn(
                    "text-2xl font-bold",
                    detail.type === "tuition" ||
                      detail.type === "deposit" ||
                      detail.type === "exam-fee"
                      ? "text-primary"
                      : "text-destructive"
                  )}
                >
                  {detail.type === "tuition" ||
                  detail.type === "deposit" ||
                  detail.type === "exam-fee"
                    ? "+"
                    : "-"}
                  {Math.abs(detail.amount).toLocaleString("vi-VN")}đ
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{detail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Mã giao dịch</Label>
                  <p className="font-mono text-sm font-medium text-foreground">
                    {detail.id.toUpperCase()}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Loại</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{typeLabels[detail.type] ?? detail.type}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Người dùng</Label>
                  <p className="text-sm font-medium text-foreground">{detail.user}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Vai trò</Label>
                  <p className="text-sm font-medium text-foreground">{roleLabel(detail.userRole)}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Ngày giao dịch</Label>
                  <p className="text-sm font-medium text-foreground">{detail.date}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[detail.status]?.variant ?? "outline"}>
                      {statusConfig[detail.status]?.label ?? detail.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceTransactions;