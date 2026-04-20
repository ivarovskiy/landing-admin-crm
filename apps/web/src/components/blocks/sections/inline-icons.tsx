import type { ComponentType, SVGProps } from "react";
import StarDt from "@/assets/icons/star_dt.svg";
import StarV1 from "@/assets/icons/star_v1.svg";
import StarV2 from "@/assets/icons/start_v2.svg";
import StarV3 from "@/assets/icons/star_v3.svg";

export type InlineIconName = "star" | "star-dt" | "star-v1" | "star-v2" | "star-v3";

const INLINE_ICONS: Record<InlineIconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  "star": StarV1 as any,
  "star-dt": StarDt as any,
  "star-v1": StarV1 as any,
  "star-v2": StarV2 as any,
  "star-v3": StarV3 as any,
};

const ICON_PATTERN = /\{\{icon:([a-z0-9-]+)\}\}/gi;

type Part = { kind: "text"; value: string } | { kind: "icon"; name: InlineIconName };

export function parseInlineText(text: string): Part[] {
  if (!text) return [];
  const parts: Part[] = [];
  let last = 0;
  for (const m of text.matchAll(ICON_PATTERN)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ kind: "text", value: text.slice(last, idx) });
    const name = m[1].toLowerCase();
    if (name in INLINE_ICONS) parts.push({ kind: "icon", name: name as InlineIconName });
    else parts.push({ kind: "text", value: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

/** Renders text with inline icon markers like {{icon:star-v1}} */
export function InlineText({ text }: { text: string }) {
  const parts = parseInlineText(text);
  if (parts.length === 0) return null;

  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "text") return <span key={i}>{p.value}</span>;
        const Comp = INLINE_ICONS[p.name];
        return <Comp key={i} className="hs-inline-icon" aria-hidden />;
      })}
    </>
  );
}
