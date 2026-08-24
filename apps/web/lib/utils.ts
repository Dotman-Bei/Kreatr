import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 8:42 -> 522 */
export function toSeconds(stamp: string): number {
  const parts = stamp.split(":").map(Number);
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

/** 522 -> 08:42 */
export function toStamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
