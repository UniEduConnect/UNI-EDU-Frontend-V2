import { TrendingUp, Target, Clock, Trophy, BookOpen, Loader2 } from "lucide-react";
import { useStudentReport, useMyStudentProfile } from "@/hooks/useStudents";
import { useMySubmissions } from "@/hooks/useExams";

const StudentReport = () => {
  const { data: report, isLoading: reportLoading } = useStudentReport();
  const { data: profile, isLoading: profileLoading } = useMyStudentProfile();
  const { submissions, isLoading: submissionsLoading } = useMySubmissions();

  const isLoading = reportLoading || profileLoading || submissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải báo cáo...
      </div>
    );
  }

  const examsTaken = report?.examsTaken ?? 0;
  const avgScore = report?.avgScore ?? 0;
  const activeClasses = report?.activeClasses ?? 0;
  const completedSessions = report?.completedSessions ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Điểm TB", value: avgScore.toFixed(1), icon: TrendingUp },
          { label: "Bài thi đã làm", value: examsTaken, icon: Target },
          { label: "Lớp đang học", value: activeClasses, icon: BookOpen },
          { label: "Buổi đã hoàn thành", value: completedSessions, icon: Clock },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <s.icon className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPA Chart - colorful */}
        {/* TODO(BE): GET /Students/me/progress-series (monthly gpa/study-hours/sessions/tests) */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" /> Tiến độ GPA theo tháng
          </h3>
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        </div>

        {/* Study Hours Chart - colorful bars */}
        {/* TODO(BE): GET /Students/me/progress-series (monthly gpa/study-hours/sessions/tests) */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Giờ học theo tháng
          </h3>
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        </div>
      </div>

      {/* Sessions & Tests Chart - dual color */}
      {/* TODO(BE): GET /Students/me/progress-series (monthly gpa/study-hours/sessions/tests) */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" /> Buổi học & Bài test theo tháng
        </h3>
        <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
          Chưa có dữ liệu
        </div>
      </div>

      {/* Exam results */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" /> Kết quả bài thi
        </h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.examTitle}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.correctCount}/{s.totalQuestions} câu đúng • {s.submissionDate}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {s.score}/{s.scoreScale}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tutor Comments */}
        {/* TODO(BE): tutor comments about the student not modeled */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Nhận xét từ gia sư</h3>
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
        </div>

        {/* Goals & Achievements */}
        <div className="space-y-4">
          {/* TODO(BE): student achievements/goals not modeled */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" /> Mục tiêu tháng tới
            </h3>
            <p className="text-xs text-muted-foreground text-center py-6">Chưa có dữ liệu</p>
          </div>

          {/* TODO(BE): student achievements/goals not modeled */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" /> Thành tích
            </h3>
            <p className="text-xs text-muted-foreground text-center py-6">Chưa có dữ liệu</p>
          </div>

          {/* Student summary */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Tổng quan</h3>
            <div className="text-center mb-1">
              <p className="text-lg font-bold text-foreground">{profile?.fullName ?? "—"}</p>
            </div>
            <p className="text-3xl font-bold text-foreground text-center">{avgScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground text-center mt-1">Điểm trung bình</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReport;
