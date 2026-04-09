import { Kicker } from "./typography";
import { cn } from "@/lib/cn";

const DEFAULT_TAGLINE = "ENHANCE\nYOUR TECHNIQUE,\nGET\nPERSONALIZED\nATTENTION\nAND\nSHINE ON STAGE";

/**
 * Renders a multi-line kicker tagline with code-defined rhythm.
 * Content comes from CMS/seed (split by \n), spacing is controlled here.
 */
export function Tagline({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  const lines = (text ?? DEFAULT_TAGLINE)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const gaps: string[] = [
    "0px",
    "var(--s-8)",
    "0px",
    "var(--s-12)",
    "0px",
    "0px",
    "0px",
  ];

  return (
    <div className={cn("tagline", className)}>
      {lines.map((line, i) => (
        <Kicker
          key={i}
          style={{ marginBottom: gaps[i] ?? "var(--s-12)" }}
        >
          {line}
        </Kicker>
      ))}
    </div>
  );
}
