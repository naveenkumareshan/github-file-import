
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the correct image URL for display.
 * - If the path is already an absolute URL (starts with http), return as-is.
 * - Otherwise, treat as a legacy relative path and prepend the base URL.
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http')) return path;
  if (path.startsWith('blob:')) return path;
  // Legacy path from old Express backend - prepend base URL if available
  const baseURL = import.meta.env.VITE_BASE_URL || '';
  return baseURL ? `${baseURL}${path}` : path;
}
