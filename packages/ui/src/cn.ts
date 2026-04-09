import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind conflict resolution.
 * Replaces clsx + tailwind-merge combo with a single utility.
 */
export function cn(
  ...args: Array<string | undefined | null | false>
): string {
  return twMerge(args.filter(Boolean).join(" "));
}
