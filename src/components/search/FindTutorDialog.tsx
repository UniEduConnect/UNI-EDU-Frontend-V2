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

interface FindTutorDialogProps {
  collapsed?: boolean;
  /** Custom trigger (e.g. a header-styled button). Falls back to the sidebar button. */
  trigger?: React.ReactNode;
}

const ALL_SUBJECTS = "Tất cả";

const FindTutorDialog = ({ collapsed = false, trigger }: FindTutorDialogProps) => {
  const navigate = useNavigate();
  const { subjects } = useSubjects();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const [type, setType] = useState<"all" | "tutor" | "teacher">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (subject && subject !== ALL_SUBJECTS) params.set("subject", subject);
    if (type !== "all") params.set("type", type);
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());

    navigate(`/find-tutor?${params.toString()}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            title={collapsed ? "Tìm gia sư" : undefined}
            className={cn(
              "flex items-center rounded-full text-sm font-medium transition-all duration-300 w-full mb-1 text-slate-200 hover:bg-slate-800 hover:text-white",
              collapsed ? "px-0 py-2.5 justify-center gap-0" : "px-4 py-3 gap-3"
            )}
          >
            <UserSearch className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Tìm gia sư</span>}
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tìm gia sư</DialogTitle>
          <DialogDescription>
            Điền tiêu chí để tìm gia sư phù hợp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ft-search">Từ khóa</Label>
            <Input
              id="ft-search"
              placeholder="Tên gia sư hoặc môn"
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
            <Label>Hình thức</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as "all" | "tutor" | "teacher")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="tutor">Gia sư</SelectItem>
                <SelectItem value="teacher">Giáo viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ft-min-price">Học phí tối thiểu</Label>
              <Input
                id="ft-min-price"
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-max-price">Học phí tối đa</Label>
              <Input
                id="ft-max-price"
                type="number"
                min={0}
                placeholder="VND"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            <UserSearch className="w-4 h-4" />
            Tìm gia sư
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindTutorDialog;
