"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Image as ImageIcon, Type } from "lucide-react";

function cn(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

type ContentItem = { id?: string; kind?: "image" | "text"; heading?: string; src?: string; alt?: string };

export function ItemOrderList({
  left,
  right,
  onChange,
}: {
  left: ContentItem[];
  right: ContentItem[];
  onChange: (next: { left: ContentItem[]; right: ContentItem[] }) => void;
}) {
  if (left.length + right.length === 0) return null;

  const move = (col: "left" | "right", idx: number, dir: -1 | 1) => {
    const arr = col === "left" ? [...left] : [...right];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    onChange({ left: col === "left" ? arr : left, right: col === "right" ? arr : right });
  };

  const toOther = (col: "left" | "right", idx: number) => {
    const src = col === "left" ? [...left] : [...right];
    const dst = col === "left" ? [...right] : [...left];
    const [item] = src.splice(idx, 1);
    dst.push(item);
    onChange({ left: col === "left" ? src : dst, right: col === "right" ? src : dst });
  };

  const renderRow = (col: "left" | "right", item: ContentItem, idx: number, colLen: number) => (
    <div
      key={item.id ?? `${col}-${idx}`}
      className="group flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-muted/40"
    >
      <span className={cn(
        "shrink-0 rounded px-1 py-0.5 text-[9px] font-bold leading-none",
        col === "left" ? "bg-blue-400/15 text-blue-400" : "bg-emerald-400/15 text-emerald-400",
      )}>
        {col === "left" ? "L" : "R"}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {item.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <Type className="h-3 w-3" />}
      </span>
      <span className="flex-1 min-w-0 truncate text-[11px] text-foreground">
        {item.kind === "image"
          ? (item.alt || "Image")
          : ((item as any).heading || "Text block")}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => move(col, idx, -1)}
          title="Move up within column"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={idx === colLen - 1}
          onClick={() => move(col, idx, 1)}
          title="Move down within column"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => toOther(col, idx)}
          title={col === "left" ? "Move to right column" : "Move to left column"}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors"
        >
          {col === "left" ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-md border border-border/50 bg-muted/5">
      <div className="border-b border-border/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Item order
      </div>
      <div className="p-1">
        {left.map((item, idx) => renderRow("left", item, idx, left.length))}
        {left.length > 0 && right.length > 0 && (
          <div className="mx-1.5 my-1 h-px bg-border/40" />
        )}
        {right.map((item, idx) => renderRow("right", item, idx, right.length))}
      </div>
    </div>
  );
}
