import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, Bot, GraduationCap, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import { usePublicStats } from "@/hooks/useStats";
import tutor1 from "@/assets/tutor-1.jpg";
import tutor2 from "@/assets/tutor-2.jpg";
import tutor3 from "@/assets/tutor-3.jpg";
import tutor4 from "@/assets/tutor-4.jpg";
import tutor5 from "@/assets/tutor-5.jpg";

const avatars = [tutor1, tutor2, tutor3, tutor4, tutor5];

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

// Floating accent chips around the headline (hidden on small screens to avoid overlap).
const chips = [
  { icon: Bot, label: "AI chấm điểm & gợi ý", ring: "bg-emerald-400/20 border-emerald-200/40", iconBg: "bg-emerald-400 text-emerald-950", pos: "left-[4%] top-[26%]", delay: 0.5 },
  { icon: ShieldCheck, label: "Gia sư đã kiểm duyệt", ring: "bg-violet-400/20 border-violet-200/40", iconBg: "bg-violet-400 text-violet-950", pos: "left-[7%] bottom-[22%]", delay: 0.7 },
  { icon: CalendarCheck, label: "Đặt lịch học thông minh", ring: "bg-amber-400/20 border-amber-200/40", iconBg: "bg-amber-400 text-amber-950", pos: "right-[4%] top-[24%]", delay: 0.6 },
  { icon: GraduationCap, label: "Luyện thi cùng AI", ring: "bg-sky-300/20 border-sky-100/40", iconBg: "bg-sky-300 text-sky-950", pos: "right-[6%] bottom-[24%]", delay: 0.8 },
];

const HeroSection = () => {
  const { data: ps } = usePublicStats();
  const stats = [
    { value: ps ? `${fmt(ps.tutors)}+` : "—", label: "Gia sư & Giáo viên" },
    { value: ps ? `${fmt(ps.students)}+` : "—", label: "Học sinh" },
    { value: ps ? `${ps.satisfactionPct}%` : "—", label: "Hài lòng" },
  ];
  return (
    <section className="relative overflow-hidden gradient-blue text-white">
      {/* Concentric sonar rings emanating from the centre */}
      <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
            style={{ width: `${i * 260}px`, height: `${i * 260}px` }}
          />
        ))}
      </div>

      {/* Soft centre glow + grid texture */}
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-white/10 blur-[120px] rounded-full pointer-events-none" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Floating accent chips */}
      {chips.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: c.delay, duration: 0.6, ease: "easeOut" }}
          className={`hidden lg:flex absolute ${c.pos} z-20 items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full backdrop-blur-md border ${c.ring}`}
        >
          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${c.iconBg}`}>
            <c.icon className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-white whitespace-nowrap">{c.label}</span>
        </motion.div>
      ))}

      {/* Centred content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center pt-28 md:pt-36 pb-24 md:pb-32 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white text-sm font-semibold mb-7 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Nền tảng giáo dục hàng đầu Việt Nam
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-[2.6rem] sm:text-6xl lg:text-[4.4rem] font-extrabold leading-[1.08] tracking-tight mb-6"
          >
            Nền tảng Gia sư <span className="text-amber-300">&</span> Luyện thi{" "}
            <span className="bg-gradient-to-r from-sky-200 via-white to-amber-200 bg-clip-text text-transparent">thông minh</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-white/85 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl"
          >
            Kết nối gia sư chất lượng đã kiểm duyệt, luyện thi cùng AI và quản lý lịch học thông minh —
            đồng hành cùng hành trình học tập của bạn.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 text-base px-10 h-14 rounded-full font-bold shadow-[0_16px_40px_rgba(2,32,90,0.35)] group">
              <Link to="/find-tutor" className="flex items-center gap-2">
                Khám phá ngay
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white text-base px-10 h-14 rounded-full font-semibold">
              <Link to="/register-tutor">Đăng ký làm gia sư</Link>
            </Button>
          </motion.div>

          {/* Trust row + inline stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {avatars.map((src, i) => (
                  <img key={i} src={src} alt="Gia sư" className="w-10 h-10 rounded-full border-2 border-white/70 bg-muted object-cover" />
                ))}
              </div>
              <span className="text-sm text-white/85"><span className="font-bold text-white">+180</span> gia sư nổi bật</span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-white/25" />

            <div className="flex items-center gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xl md:text-2xl font-extrabold text-white leading-none">{s.value}</div>
                  <div className="text-xs text-white/70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Smooth wave transition into the light sections below */}
      <div className="absolute bottom-0 left-0 right-0 leading-none pointer-events-none" aria-hidden>
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="w-full h-[60px] md:h-[90px]">
          <path fill="hsl(var(--background))" d="M0,64 C240,110 480,110 720,80 C960,50 1200,16 1440,48 L1440,110 L0,110 Z" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
