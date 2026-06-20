import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserAvatarDropdownProps {
  avatar?: string;
  name: string;
  role: string;
  profilePath?: string;
}

const UserAvatarDropdown = ({
  avatar,
  name,
  role,
  profilePath,
}: UserAvatarDropdownProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="pl-3 border-l border-border flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer outline-none">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {name}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {role}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <DropdownMenuSeparator />
        {profilePath && (
          <DropdownMenuItem
            onClick={() => navigate(profilePath)}
            className="cursor-pointer gap-2"
          >
            <User className="w-4 h-4" /> Hồ sơ cá nhân
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => navigate("/admin/settings")}
          className="cursor-pointer gap-2"
        >
          <Settings className="w-4 h-4" /> Cài đặt tài khoản
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarDropdown;
