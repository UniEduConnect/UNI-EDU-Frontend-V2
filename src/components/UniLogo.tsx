import logo from "@/assets/uni/logo.png";

/**
 * The official Uni Education logo lockup (infinity mark + wordmark).
 * Control the size with a Tailwind height class, e.g. `className="h-9 w-auto"`.
 */
const UniLogo = ({ className = "h-9 w-auto" }: { className?: string }) => (
  <img src={logo} alt="Uni Education" className={className} draggable={false} />
);

export default UniLogo;
