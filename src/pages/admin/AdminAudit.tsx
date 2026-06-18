import { useAuditLogs } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Shield, Clock, User, Search, Loader2 } from "lucide-react";
import { useState } from "react";

const actionColor: Record<string, string> = {
  "Duyệt tài khoản": "bg-emerald-100 text-emerald-700",
  "Từ chối tài khoản": "bg-rose-100 text-rose-700",
  "Xóa người dùng": "bg-rose-100 text-rose-700",
  "Tạo lớp học": "bg-blue-100 text-blue-700",
  "Cập nhật lớp học": "bg-amber-100 text-amber-700",
  "Xóa lớp học": "bg-rose-100 text-rose-700",
  "Tạo bài test": "bg-blue-100 text-blue-700",
  "Cập nhật bài test": "bg-amber-100 text-amber-700",
  "Xóa bài test": "bg-rose-100 text-rose-700",
  "Cập nhật cài đặt": "bg-slate-100 text-slate-700",
  "Thêm giao dịch": "bg-green-100 text-green-700",
};

const actionOptions = [
  { value: "all", label: "Tất cả hành động" },
  { value: "Duyệt tài khoản", label: "Duyệt tài khoản" },
  { value: "Từ chối tài khoản", label: "Từ chối tài khoản" },
  { value: "Xóa người dùng", label: "Xóa người dùng" },
  { value: "Tạo lớp học", label: "Tạo lớp học" },
  { value: "Cập nhật lớp học", label: "Cập nhật lớp học" },
  { value: "Cập nhật cài đặt", label: "Cập nhật cài đặt" },
  { value: "Thêm giao dịch", label: "Thêm giao dịch" },
];

const AdminAudit = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // GET /Admin/audit-logs — server-paged. DTO exposes only actor/action/target/timestamp.
  const { logs, data, isLoading, isError } = useAuditLogs(page);
  const auditLogData = data?.items ?? logs;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const total = data?.total ?? auditLogData.length;

  // Sort + client-side filter over the current server page.
  const sortedAuditLog = [...auditLogData].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const filteredAuditLog = sortedAuditLog.filter(log => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.actor.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const totalLog = total;
  const approved = auditLogData.filter(l => l.action.includes("Duyệt")).length;
  const deleted = auditLogData.filter(l => l.action.includes("Xóa")).length;

  return (
    <div className="p-6 space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Tổng log", value: totalLog, icon: ScrollText, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
          { label: "Phê duyệt", value: approved, icon: Shield, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
          { label: "Xóa dữ liệu", value: deleted, icon: User, bg: "from-blue-700 to-blue-900", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
        ].map((s, idx) => (
          <Card key={idx} className={`border-0 shadow-soft bg-gradient-to-br ${s.bg} text-white`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} backdrop-blur-sm`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-white/80">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo người thực hiện, hành động, đối tượng..."
            className="w-full pl-10 h-10 rounded-2xl border border-border bg-card text-sm"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="w-full md:w-48 h-10 rounded-2xl border border-border bg-card px-3 text-sm"
        >
          {actionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Người thực hiện</TableHead>
                <TableHead className="font-semibold">Hành động</TableHead>
                <TableHead className="font-semibold">Đối tượng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải nhật ký...
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError && auditLogData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    Không tải được nhật ký. Vui lòng thử lại.
                  </TableCell>
                </TableRow>
              ) : filteredAuditLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    Chưa có log nào phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                filteredAuditLog.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{log.timestamp}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{log.actor}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${actionColor[log.action] || "bg-muted text-muted-foreground"}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.target}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">Trang {page} / {totalPages}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAudit;
