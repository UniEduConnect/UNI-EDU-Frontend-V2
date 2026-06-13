/**
 * Square Uni Education brand mark (infinity + star, brand blue) — the compact
 * icon form of the logo for sidebars, avatars and other square slots. For the
 * full lockup with the wordmark, use {@link UniLogo} instead.
 */
const UniMark = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Uni Education"
  >
    <defs>
      <linearGradient id="uniMarkGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#uniMarkGrad)" />
    <path
      d="M16 16 C 13.4 12.4, 8.4 12.4, 8.4 16 S 13.4 19.6, 16 16 C 18.6 12.4, 23.6 12.4, 23.6 16 S 18.6 19.6, 16 16 Z"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23.5 5.2 L24.4 7 L26.4 7.3 L25 8.7 L25.3 10.7 L23.5 9.8 L21.7 10.7 L22 8.7 L20.6 7.3 L22.6 7 Z"
      fill="#bfdbfe"
    />
  </svg>
);

export default UniMark;
