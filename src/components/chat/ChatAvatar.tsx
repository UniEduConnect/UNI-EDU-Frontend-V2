import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

/**
 * Chat participant avatar. Falls back to a circle with the first letter of `name`
 * when there's no avatar URL, or the image fails to load (e.g. broken/expired link).
 */
export default function ChatAvatar({ src, name, className }: ChatAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground text-sm",
        className,
      )}
    >
      {initial}
    </div>
  );
}
