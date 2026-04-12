import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Drop-in replacement for <img> that routes through Next.js image optimization.
 * Uses `fill` mode — the parent element controls dimensions via CSS
 * (width + aspect-ratio, or explicit width + height).
 *
 * The `className` and `style` props apply to the wrapper <div>,
 * which becomes the visual container (same role as the old <img> tag).
 */
export interface MediaImageProps {
  src: string;
  alt?: string;
  /** True for above-the-fold images (hero). Disables lazy loading. */
  priority?: boolean;
  /**
   * Hint to the browser about the rendered width.
   * Use fixed px values that reflect the design size since CSS zoom
   * breaks viewport-relative calculations.
   * Default: "100vw" (safe fallback, slightly over-fetches on large screens).
   */
  sizes?: string;
  /** Applied to the wrapper <div> — same class that was on <img> before. */
  className?: string;
  style?: CSSProperties;
  objectFit?: "cover" | "contain";
}

export function MediaImage({
  src,
  alt = "",
  priority = false,
  sizes = "100vw",
  className,
  style,
  objectFit = "cover",
}: MediaImageProps) {
  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit }}
      />
    </div>
  );
}
