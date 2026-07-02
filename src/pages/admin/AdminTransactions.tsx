import { useFinanceTransactions } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, Wallet, Receipt, Search, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const typeLabel: Record<string, string> = {
  deposit: "Nạp tiền",
  withdrawal: "Rút tiền",
  tuition_payment: "Thanh toán học phí",
  escrow_in: "Ký quỹ",
  escrow_release: "Giải ngân",
  refund: "Hoàn tiền",
  platform_fee: "Phí nền tảng",
  transferin: "Nhận chuyển khoản",
  transferout: "Chuyển khoản đi",
  // legacy labels
  tuition: "Học phí",
  salary: "Lương gia sư",
  "exam-fee": "Phí thi thử",
};
const typeVariant: Record<string, "default" | "success" | "warning"> = {
  deposit: "success",
  withdrawal: "warning",
  tuition_payment: "default",
  escrow_in: "default",
  escrow_release: "success",
  refund: "warning",
  platform_fee: "default",
  transferin: "success",
  transferout: "warning",
  tuition: "default",
  salary: "success",
  "exam-fee": "warning",
};
const statusLabel: Record<string, string> = { completed: "Hoàn thành", pending: "Đang xử lý", failed: "Thất bại", refunded: "Hoàn tiền" };
const statusVariant: Record<string, "success" | "warning" | "destructive" | "info"> = {
  completed: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "info",
};

const PAGE_SIZE = 10;

const AdminTransactions = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  // Live transactions from GET /api/Finance/transactions.
  // Type/Status/Page are server-side query params; search is filtered
  // client-side over the fetched page.
  const { transactions, isLoading, isError } = useFinanceTransactions({
    Type: filterType === "all" ? undefined : filterType,
    Status: filterStatus === "all" ? undefined : filterStatus,
    Page: page,
  });

  // System settings supply the escrow (profit) percentage shown on the cards.
  const { data: settings } = useSettings();
  const escrowPercent = settings?.escrowPercent ?? 0;

  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus]);

  const filtered = transactions.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.description.toLowerCase().includes(q) && !t.user.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // TODO(BE): paged total + transactions summary — the list response has no
  // total/totalPages (so we page via prev/next while the server page is full)
  // and no summary endpoint, so the aggregate cards reflect the current page
  // only (same as finance F-GAP-1/2).
  const hasNextPage = transactions.length >= PAGE_SIZE;

  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const escrowProfit = Math.round(totalRevenue * escrowPercent / 100);
  const pendingAmount = transactions.filter(t => t.status === "pending").reduce((s, t) => s + t.amount, 0);

  const stats = [
    { label: "Tổng giao dịch", value: transactions.length, icon: Receipt, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
    { label: "Tổng doanh thu", value: `${(totalRevenue / 1000000).toFixed(1)}M`, icon: CreditCard, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
    { label: `Lợi nhuận (${escrowPercent}%)`, value: `${(escrowProfit / 1000000).toFixed(1)}M`, icon: TrendingUp, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
    { label: "Đang chờ xử lý", value: `${(pendingAmount / 1000000).toFixed(1)}M`, icon: Wallet, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className={`border-0 shadow-soft bg-gradient-to-br ${s.bg} text-white`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} backdrop-blur-sm`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/80">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mô tả..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-10 rounded-xl bg-card border-border"
          />
        </div>
        <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-10 rounded-2xl bg-card border border-border shadow-sm"><SelectValue placeholder="Loại giao dịch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="tuition">Học phí</SelectItem>
            <SelectItem value="salary">Lương gia sư</SelectItem>
            <SelectItem value="exam-fee">Phí thi thử</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-10 rounded-2xl bg-card border border-border shadow-sm"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="pending">Đang xử lý</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="refunded">Hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 h-10 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Theo tháng</SelectItem>
            <SelectItem value="year">Theo năm</SelectItem>
            <SelectItem value="custom">Khoảng tùy chọn</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => toast({ title: "Đã xuất dữ liệu giao dịch" })}
          className="h-10 rounded-xl inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Người thanh toán</TableHead>
                <TableHead className="font-semibold">Loại</TableHead>
                <TableHead className="font-semibold">Số tiền</TableHead>
                <TableHead className="font-semibold">Ngày</TableHead>
                <TableHead className="font-semibold">Mô tả</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && filtered.map(tx => (
                <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">{tx.user || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeVariant[tx.type] ?? "default"}>
                      {typeLabel[tx.type] ?? tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground">{tx.amount.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tx.status] ?? "outline"}>
                      {statusLabel[tx.status] ?? tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <span className="inline-flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải giao dịch...</span>
                </TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {isError ? "Không tải được giao dịch. Vui lòng thử lại." : "Không tìm thấy giao dịch"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && (page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">Trang {page}</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 h-8 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNextPage}
              className="px-3 h-8 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
