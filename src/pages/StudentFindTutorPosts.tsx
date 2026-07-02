import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Star,
  Loader2,
  GraduationCap,
  Clock,
  Search,
  Eye,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpenTutorPosts, useApplyTutorPost } from "@/hooks/useTutorPosts";
import { useSubjects } from "@/hooks/useSubjects";
import PostTutorRequest from "@/components/student/PostTutorRequest";

const ALL_SUBJECTS = "Tất cả";

export default function StudentFindTutorPosts() {
  const [searchParams] = useSearchParams();
  const { subjects } = useSubjects();

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [subject, setSubject] = useState(
    () => searchParams.get("subject") ?? ALL_SUBJECTS,
  );

  const navigate = useNavigate();
  const applyPost = useApplyTutorPost();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const { posts, isLoading } = useOpenTutorPosts({
    Search: search || undefined,
    Subject: subject && subject !== ALL_SUBJECTS ? subject : undefined,
  });

  const handleApply = (postId: string) => {
    setApplyingId(postId);
    applyPost.mutate(postId, {
      onSuccess: () => toast.success("Đã đăng ký học! Gia sư sẽ làm bài test để nhận bạn."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Đăng ký thất bại"),
      onSettled: () => setApplyingId(null),
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Gia sư đang tìm học sinh
        </h1>
        <p className="mt-1 text-muted-foreground">
          Các gia sư đang muốn nhận thêm học sinh
        </p>
      </header>

      {/* Student's own "find a tutor" requests + post button (moved here from Học tập). */}
      <div className="mb-8">
        <PostTutorRequest />
      </div>

      <div className="mb-8 bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc môn học..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="rounded-xl sm:w-56">
              <SelectValue placeholder="Môn học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SUBJECTS}>{ALL_SUBJECTS}</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Chưa có gia sư nào đăng tìm học sinh
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-elevated transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                {post.tutorAvatar ? (
                  <img
                    src={post.tutorAvatar}
                    alt={post.tutorName}
                    className="w-14 h-14 rounded-xl object-cover bg-muted"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-lg font-semibold text-foreground">
                    {post.tutorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {post.tutorName}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-current text-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      {post.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {post.subject}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GraduationCap className="w-3 h-3" />
                  {post.gradeLevels || "Mọi trình độ"}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {post.preferredSchedule || "Linh hoạt"}
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground col-span-2">
                  {post.hourlyRate != null
                    ? post.hourlyRate.toLocaleString("vi-VN") + "đ/giờ"
                    : "Học phí: thỏa thuận"}
                </div>
              </div>

              {post.note && (
                <div className="mb-3 text-[11px] text-muted-foreground line-clamp-2">
                  {post.note}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => navigate(`/tutor-profile?id=${post.tutorId}`)}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem hồ sơ
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
                  disabled={applyingId === post.id}
                  onClick={() => handleApply(post.id)}
                >
                  {applyingId === post.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}{" "}
                  Đăng ký học
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
