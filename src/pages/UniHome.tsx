import { useEffect, useRef } from "react";
import { usePublicStats } from "@/hooks/useStats";
import { UniHomeTutors } from "@/components/home/UniHomeTutors";
import "@/styles/uni-home.css";
import bodyHtml from "./uniHomeBody.html?raw";
import logo from "@/assets/uni/8d5c1696.png";
import mascotA from "@/assets/uni/361443ea.png";
import mascotB from "@/assets/uni/81183032.png";
import mascotC from "@/assets/uni/9eeca117.png";
import mascotD from "@/assets/uni/c81a17b5.png";

// Faithful port of the standalone Uni Education homepage design (stats → footer).
const html = bodyHtml
  .replaceAll("__ASSET_logo__", logo)
  .replaceAll("__ASSET_mascotA__", mascotA)
  .replaceAll("__ASSET_mascotB__", mascotB)
  .replaceAll("__ASSET_mascotC__", mascotC)
  .replaceAll("__ASSET_mascotD__", mascotD);

// The featured-tutors section is rendered by <UniHomeTutors/> with real data at this slot.
const [part1, part2 = ""] = html.split("<!--TUTORS_SLOT-->");

export default function UniHome() {
  const ref = useRef<HTMLDivElement>(null);
  const { data: ps } = usePublicStats();

  // Swap the design's illustrative stat targets for real platform metrics once loaded.
  useEffect(() => {
    if (!ps || !ref.current) return;
    const map: Record<string, number> = {
      "1200": ps.tutors,
      "10000": ps.students,
      "50000": ps.sessionsCompleted,
      "98": ps.satisfactionPct,
    };
    ref.current.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const real = map[el.dataset.count ?? ""];
      if (real !== undefined) el.dataset.count = String(real);
    });
  }, [ps]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    // Safety: reveal anything still hidden after 1.5s (e.g. if observer never fires).
    const t = window.setTimeout(() => els.forEach((el) => el.classList.add("in")), 1500);

    // Count-up animation for the stat numbers ([data-count]).
    const fmt = new Intl.NumberFormat("vi-VN");
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));
    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count || "0");
      const dur = 1600;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const countIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCount(e.target as HTMLElement);
            countIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 },
    );
    counters.forEach((el) => countIo.observe(el));

    return () => {
      io.disconnect();
      countIo.disconnect();
      window.clearTimeout(t);
    };
  }, [ps]);

  return (
    <div className="uni-home" ref={ref}>
      <div dangerouslySetInnerHTML={{ __html: part1 }} />
      <UniHomeTutors />
      <div dangerouslySetInnerHTML={{ __html: part2 }} />
    </div>
  );
}
