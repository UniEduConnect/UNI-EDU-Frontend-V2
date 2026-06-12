import { Star, TrendingUp, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useMyReviews, useMyTutorProfile } from "@/hooks/useTutors";

const TutorReviews = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReviews(page);
  const { data: profile } = useMyTutorProfile();

  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState("all");

  const reviews = data?.items ?? [];
  const pageCount = Math.max(1, data?.totalPages ?? 1);

  const rating = profile?.rating ?? 0;
  const totalReviews = profile?.totalReviews ?? 0;
  const testPassRate = profile?.testPassRate ?? 0;

  // Filters apply to the current server page of reviews.
  const subjects = [...new Set(reviews.map(r => r.subject))];
  const filtered = reviews.filter(r => {
    if (search && !r.comment.toLowerCase().includes(search.toLowerCase()) && !r.parentName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRating && r.rating !== filterRating) return false;
    if (filterSubject !== "all" && r.subject !== filterSubject) return false;
    return true;
  });

  // Rating distribution + per-subject averages computed from fetched items.
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rv => rv.rating === r).length,
    pct: reviews.length > 0 ? (reviews.filter(rv => rv.rating === r).length / reviews.length) * 100 : 0,
  }));

  const barData = ratingDist.map(r => ({ name: `${r.stars}★`, count: r.count }));
  const subjectRatings = subjects.map(s => {
    const subReviews = reviews.filter(r => r.subject === s);
    return { subject: s, avg: subReviews.reduce((sum, r) => sum + r.rating, 0) / subReviews.length, count: subReviews.length };
  });

  // TODO(BE): add tags[] to the tutor review DTO to restore the keyword cloud

  const chartConfig = { count: { label: "Số lượng", color: "hsl(var(--primary))" } };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{rating.toFixed(1)}</p>
              <div className="flex items-center gap-0.5 justify-center my-1">
                {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />)}
              </div>
              <p className="text-xs text-muted-foreground">{totalReviews} đánh giá</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDist.map(r => (
                <button key={r.stars} onClick={() => setFilterRating(filterRating === r.stars ? null : r.stars)} className="flex items-center gap-2 w-full group">
                  <span className="text-xs text-muted-foreground w-4">{r.stars}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className={cn("rounded-full h-2 transition-all", filterRating === r.stars ? "bg-primary" : "bg-amber-400")} style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{r.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rating by subject */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Đánh giá theo môn</h3>
          <div className="space-y-3">
            {subjectRatings.map(s => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-12">{s.subject}</span>
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div className="bg-primary rounded-full h-3 transition-all flex items-center justify-end pr-1" style={{ width: `${(s.avg / 5) * 100}%` }}>
                    <span className="text-[8px] text-primary-foreground font-bold">{s.avg.toFixed(1)}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{s.count} đánh giá</span>
              </div>
            ))}
            {subjectRatings.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
          </div>
        </div>

        {/* Test pass rate */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-primary">{testPassRate}%</p>
          <p className="text-xs text-muted-foreground">Tỷ lệ đậu test</p>
          <TrendingUp className="w-4 h-4 text-success mx-auto mt-1" />
        </div>
      </div>

      {/* Rating Distribution Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Phân bố đánh giá</h3>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo nội dung, phụ huynh..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-xl text-sm">
          <option value="all">Tất cả môn</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-1">
          {[5, 4, 3, 2, 1].map(r => (
            <button key={r} onClick={() => setFilterRating(filterRating === r ? null : r)} className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-colors", filterRating === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {r}★
            </button>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.parentName}</p>
                    <p className="text-xs text-muted-foreground">{r.className} • HS: {r.studentName} • {r.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
                <div className="flex items-center gap-0.5 my-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />)}
                </div>
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Không có đánh giá nào</p>}
      </div>

      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  href="#"
                  isActive={page === idx + 1}
                  onClick={(e) => {
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
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(pageCount, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default TutorReviews;
