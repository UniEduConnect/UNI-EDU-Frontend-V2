import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import UniLogo from "@/components/UniLogo";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTE } from "@/lib/roleRoutes";

const sectionLinks = [
  { id: "features", label: "Tính năng" },
  { id: "how-it-works", label: "Cách hoạt động" },
  { id: "subjects", label: "Môn học" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const dashboardPath = role ? ROLE_ROUTE[role] : "/";
  const isTutorRole = role === "tutor" || role === "teacher";
  const headerSearchBtn = "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-[#1E69E7] transition-all";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft" : "bg-background/50 backdrop-blur-md"}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center" aria-label="Uni Education">
          <UniLogo className="h-9 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {sectionLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-[#1E69E7] transition-all"
            >
              {link.label}
            </button>
          ))}
          {isTutorRole ? (
            <Link to={`${dashboardPath}/find-students`} className={headerSearchBtn}>Tìm học sinh</Link>
          ) : (
            <Link to="/find-tutor" className={headerSearchBtn}>Tìm gia sư</Link>
          )}
          {/* <Link
            to="/exam-online"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all"
          >
            Thi thử
          </Link> */}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-[#1E69E7] font-semibold text-sm shadow-neon px-6">
              <Link to={dashboardPath}>Vào trang quản lý</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full text-sm px-6">
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-[#1E69E7] font-semibold text-sm shadow-neon px-6">
                <Link to="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-background border-b border-border px-4 pb-4 space-y-2">
          {sectionLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="block w-full text-left py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-[#1E69E7]"
            >
              {link.label}
            </button>
          ))}
          {isTutorRole ? (
            <Link to={`${dashboardPath}/find-students`} className="block w-full text-left py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-[#1E69E7]" onClick={() => setMobileOpen(false)}>Tìm học sinh</Link>
          ) : (
            <Link to="/find-tutor" className="block w-full text-left py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-[#1E69E7]" onClick={() => setMobileOpen(false)}>Tìm gia sư</Link>
          )}
          <Link to="/exam-online" className="block py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-[#1E69E7]" onClick={() => setMobileOpen(false)}>Thi thử Online</Link>
          <div className="flex gap-2 pt-2">
            {isAuthenticated ? (
              <Button asChild className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-[#1E69E7]">
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>Vào trang quản lý</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="flex-1 rounded-full">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
                </Button>
                <Button asChild className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-[#1E69E7]">
                  <Link to="/register" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
