import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a chat message's ISO timestamp for display: "HH:mm" for today,
 * "dd/MM HH:mm" for older messages — instead of the raw ISO string.
 */
export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;

  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  return `${date} ${time}`;
}
