import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubjects } from "@/hooks/useSubjects";

interface FindStudentDialogProps {
  collapsed?: boolean;
  /** Custom trigger (e.g. a header-styled button). Falls back to the sidebar button. */
  trigger?: React.ReactNode;
  /** Where to navigate on submit. Defaults to the tutor find-students page. */
  targetPath?: string;
}

const ALL_SUBJECTS = "Tất cả";

const FindStudentDialog = ({
  collapsed = false,
  trigger,
  targetPath = "/tutor/find-students",
}: FindStudentDialogProps) => {
  const navigate = useNavigate();
  const { subjects } = useSubjects();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const [grade, setGrade] = useState("");

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (subject && subject !== ALL_SUBJECTS) params.set("subject", subject);
    if (grade.trim()) params.set("grade", grade.trim());

    navigate(`${targetPath}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            title={collapsed ? "Tìm học sinh" : undefined}
            className={cn(
              "flex items-center rounded-full text-sm font-medium transition-all duration-300 w-full mb-1 text-slate-200 hover:bg-slate-800 hover:text-white",
              collapsed ? "px-0 py-2.5 justify-center gap-0" : "px-4 py-3 gap-3"
            )}
          >
            <UserSearch className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Tìm học sinh</span>}
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tìm học sinh</DialogTitle>
          <DialogDescription>
            Điền tiêu chí để tìm học sinh đang cần gia sư
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fs-search">Từ khóa</Label>
            <Input
              id="fs-search"
              placeholder="Tên học sinh hoặc môn"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Môn học</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBJECTS}>Tất cả</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fs-grade">Lớp</Label>
            <Input
              id="fs-grade"
              type="number"
              min={1}
              max={12}
              placeholder="1 - 12"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            <UserSearch className="w-4 h-4" />
            Tìm học sinh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindStudentDialog;
