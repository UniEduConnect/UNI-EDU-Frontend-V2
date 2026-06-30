import { useState } from "react";
import { Link } from "react-router-dom";
import { useTutors } from "@/hooks/useTutors";

const gradients = [
  "linear-gradient(135deg,#2f7bf6,#5aa0ff)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#f5a623,#ffce3c)",
  "linear-gradient(135deg,#6d4ed6,#a48bff)",
];

// Avatar: shows the tutor's photo when available, falling back to the first letter
// on a coloured gradient when there's no image or the image fails to load.
function TutorAvatar({ name, avatar, gradient, verified }: {
  name: string;
  avatar?: string | null;
  gradient: string;
  verified?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = !!avatar && !failed;

  return (
    <div className="ava" style={{ background: showImg ? undefined : gradient }}>
      {showImg ? (
        <img
          src={avatar as string}
          alt={name}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      ) : (
        (name?.trim()?.charAt(0) || "G").toUpperCase()
      )}
      {verified && (
        <div className="vbadge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
      )}
    </div>
  );
}

// Real "featured tutors" grid for the landing page — same design classes as the ported HTML,
// rendered inside the .uni-home scope so the design CSS applies.
export function UniHomeTutors() {
  const { tutors } = useTutors({});
  const top = tutors.slice(0, 4);

  return (
    <section className="tutors" id="tutors">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow"><span className="dot" />Gia sư tiêu biểu</span>
          <h2>Đội ngũ gia sư <span className="text-grad">đã được kiểm duyệt</span></h2>
          <p>Mỗi gia sư đều có hồ sơ, bằng cấp xác thực và đánh giá thật từ học viên.</p>
        </div>
        <div className="tutor-grid">
          {top.length === 0 ? (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--ink-3)" }}>
              Chưa có gia sư nổi bật để hiển thị.
            </p>
          ) : (
            top.map((t, i) => (
              <div key={t.id} className="tcard reveal">
                <div className="top">
                  <TutorAvatar
                    name={t.name}
                    avatar={t.avatar}
                    gradient={gradients[i % gradients.length]}
                    verified={t.verified}
                  />
                  <div>
                    <div className="nm">{t.name}</div>
                    <div className="subj">{t.subjects?.[0] || t.school || "Gia sư"}</div>
                  </div>
                </div>
                <div className="rate">
                  <span className="star">★</span>
                  <b>{t.rating ? t.rating.toFixed(1) : "—"}</b> ({t.totalReviews}) · {t.yearsExperience} năm KN
                </div>
                <div className="tags">
                  {(t.subjects ?? []).slice(0, 3).map((s) => <span key={s}>{s}</span>)}
                </div>
                <div className="foot">
                  <div className="price">{Math.round((t.hourlyRate || 0) / 1000)}k<small>mỗi buổi</small></div>
                  <Link to="/find-tutor" className="book">Đặt lịch</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
