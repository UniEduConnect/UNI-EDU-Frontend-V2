import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarCog, CheckCircle2, Clock, BookOpen, Users, Monitor, Info, RefreshCw, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useGenerateAiSchedule, useRoomInventory } from "@/hooks/useOffice";

const OfficeAISchedule = () => {
  const { toast } = useToast();
  const { classes, isLoading: classesLoading } = useClasses();
  const generate = useGenerateAiSchedule();
  const { data: roomInventory, isLoading: roomsLoading } = useRoomInventory();

  const [isDone, setIsDone] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeFrame, setTimeFrame] = useState("next_week");
  const [branch, setBranch] = useState("all");
  const [objective, setObjective] = useState("balanced");
  const [hardConstraints, setHardConstraints] = useState({ noWeekend: true, maxSessions: true, matchSubject: true });

  // Constraints are form inputs only — no backend store. They feed the AiScheduleRequest payload.
  const [subject, setSubject] = useState("all");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("2");
  const dayOptions = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const [preferredDays, setPreferredDays] = useState<string[]>(["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"]);

  const isRunning = generate.isPending;

  const steps = [
    "Khởi tạo bộ dữ liệu lớp học, giáo viên và phòng học...",
    "Phân tích ràng buộc lịch giáo viên & học sinh...",
    "Tối ưu hóa phân bổ phòng học theo môn...",
    "Kiểm tra xung đột thời khóa biểu và hoàn tất..."
  ];

  const pendingClasses = classes.filter(c => c.status === "active" || c.status === "searching").length;
  const tutorCount = new Set(classes.map(c => c.tutorId).filter(Boolean)).size;

  const toggleDay = (day: string) =>
    setPreferredDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));

  const runScheduler = () => {
    setIsDone(false);
    setResult(null);
    setCurrentStep(0);

    generate.mutate(
      {
        subject: subject === "all" ? undefined : subject,
        preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
        sessionsPerWeek: Number(sessionsPerWeek) || undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data ?? null);
          setIsDone(true);
          setCurrentStep(steps.length - 1);
          toast({ title: "Đã tạo lịch gợi ý" });
        },
        onError: () => {
          toast({ title: "Không thể tạo lịch gợi ý", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* <div>
        <h1 className="text-2xl font-bold text-foreground">Xếp lịch AI</h1>
        <p className="text-muted-foreground text-sm">Sử dụng thuật toán AI để sắp xếp thời khóa biểu tối ưu</p>
      </div> */}

      {isDone && (
        <div className="flex items-center justify-between p-4 bg-success/15 dark:bg-emerald-950/30 border border-success/30 dark:border-success/40 rounded-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <div>
              <p className="text-sm font-semibold text-success dark:text-emerald-400">Đã tạo lịch gợi ý</p>
              <p className="text-xs text-success dark:text-success">Hệ thống đã đề xuất một thời khóa biểu dựa trên các ràng buộc đã chọn.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsDone(false); setResult(null); }}><RefreshCw className="w-4 h-4 mr-1" /> Làm lại</Button>
            <Button className="rounded-xl" onClick={() => toast({ title: "Đã duyệt và lưu lịch trình" })}><Save className="w-4 h-4 mr-1" /> Duyệt và Lưu</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!isDone && (
            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1"><CalendarCog className="w-5 h-5" /> Cấu hình tham số xếp lịch</h3>
                  <p className="text-xs text-muted-foreground">Thiết lập các ràng buộc và ưu tiên cho thuật toán xếp thời khóa biểu</p>
                </div>

                <div className="border-t border-border pt-4 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Thời gian dự kiến</p>
                    <Select value={timeFrame} onValueChange={setTimeFrame}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="next_week">Tuần tiếp theo</SelectItem><SelectItem value="next_month">Tháng tiếp theo</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Cơ sở áp dụng</p>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Tất cả cơ sở</SelectItem><SelectItem value="cs1">Cơ sở 1</SelectItem><SelectItem value="cs2">Cơ sở 2</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Mục tiêu tối ưu hóa hàng đầu</p>
                  <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger className="rounded-xl w-96"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Cân bằng đều tải giáo viên & phòng học</SelectItem>
                      <SelectItem value="room">Tối ưu phòng học</SelectItem>
                      <SelectItem value="tutor">Tối ưu lịch giáo viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-border pt-4 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Môn học ưu tiên</p>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả môn</SelectItem>
                        <SelectItem value="Toán">Toán</SelectItem>
                        <SelectItem value="Vật lý">Vật lý</SelectItem>
                        <SelectItem value="Hóa học">Hóa học</SelectItem>
                        <SelectItem value="Ngữ văn">Ngữ văn</SelectItem>
                        <SelectItem value="Tiếng Anh">Tiếng Anh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Số buổi mỗi tuần</p>
                    <Select value={sessionsPerWeek} onValueChange={setSessionsPerWeek}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 buổi</SelectItem>
                        <SelectItem value="2">2 buổi</SelectItem>
                        <SelectItem value="3">3 buổi</SelectItem>
                        <SelectItem value="4">4 buổi</SelectItem>
                        <SelectItem value="5">5 buổi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Ngày ưu tiên xếp lịch</p>
                  <div className="flex flex-wrap gap-4">
                    {dayOptions.map(day => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={preferredDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                        <span className="text-sm text-foreground">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Ràng buộc cứng</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={hardConstraints.noWeekend} onCheckedChange={v => setHardConstraints(p => ({ ...p, noWeekend: !!v }))} />
                      <span className="text-sm text-foreground">Không xếp lịch vào cuối tuần (Thứ 7, CN)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={hardConstraints.maxSessions} onCheckedChange={v => setHardConstraints(p => ({ ...p, maxSessions: !!v }))} />
                      <span className="text-sm text-foreground">Giáo viên không dạy quá 4 tiết một ngày</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={hardConstraints.matchSubject} onCheckedChange={v => setHardConstraints(p => ({ ...p, matchSubject: !!v }))} />
                      <span className="text-sm text-foreground">Giáo viên chỉ dạy đúng môn chuyên ngành</span>
                    </label>
                  </div>
                </div>

                {isRunning && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center">
                        <CalendarCog className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-foreground">Đang xếp thời khóa biểu...</p>
                        <p className="text-xs text-muted-foreground mt-1">Hệ thống đang kiểm tra chéo lịch giáo viên, phòng học và học sinh để đảm bảo không xung đột.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                      {steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {i === currentStep ? <Clock className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: "2s" }} /> : <div className="w-4 h-4" />}
                          <span className="text-xs text-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={runScheduler} disabled={isRunning} className="w-full rounded-xl h-12 text-sm font-semibold">
                  <CalendarCog className="w-5 h-5 mr-2" /> {isRunning ? "Đang xử lý..." : "Bắt đầu xếp lịch thông minh"}
                </Button>
              </CardContent>
            </Card>
          )}

          {isDone && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bản nháp thời khóa biểu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* TODO(BE): type the /Office/ai-schedule response (suggested sessions list) */}
                <div className="p-3 bg-muted/50 rounded-xl flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">Hệ thống đã trả về gợi ý lịch trình. Định dạng chi tiết sẽ được hiển thị khi backend chuẩn hóa cấu trúc phản hồi.</p>
                </div>
                {result != null && (
                  <pre className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-4 overflow-auto max-h-80 whitespace-pre-wrap break-words">
                    {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {isDone && (
            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">Thống kê lịch</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">Tỷ lệ sử dụng phòng học</span>
                    <span className="text-sm font-bold text-primary">88% (Tốt)</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">Phân bổ tiết dạy giáo viên</span>
                    <span className="text-sm font-bold text-primary">Cân bằng</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Dữ liệu đầu vào</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Trạng thái dữ liệu hiện tại</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-primary" /></div><span className="text-sm text-foreground">Lớp chờ xếp lịch</span></div>
                  <span className="text-lg font-bold text-foreground">{classesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pendingClasses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-success/150/10 flex items-center justify-center"><Users className="w-4 h-4 text-success" /></div><span className="text-sm text-foreground">Giáo viên tham gia</span></div>
                  <span className="text-lg font-bold text-foreground">{classesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tutorCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Monitor className="w-4 h-4 text-purple-600" /></div><span className="text-sm text-foreground">Phòng học trống</span></div>
                  <span className="text-lg font-bold text-purple-600">{roomsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (roomInventory?.summary.free ?? 0)}</span>
                </div>
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Thuật toán sẽ tối ưu hoá phân bổ phòng học cho các môn Toán, Lý, Hóa, Văn, Anh lớp 10-12.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfficeAISchedule;
