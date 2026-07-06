import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional support. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
