"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Image as ImageIcon, Type } from "lucide-react";

function cn(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

function stripHtml(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type ContentItem = { id?: string; kind?: "image" | "text"; heading?: string; src?: string; alt?: string; fullWidth?: boolean };

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

  const leftNormal = left.filter(item => !item.fullWidth);
  const rightNormal = right.filter(item => !item.fullWidth);
  const fullWidthItems = [
    ...left.map((item, idx) => ({ item, col: "left" as const, idx })).filter(x => x.item.fullWidth),
    ...right.map((item, idx) => ({ item, col: "right" as const, idx })).filter(x => x.item.fullWidth),
  ];

  const moveNormal = (col: "left" | "right", item: ContentItem, dir: -1 | 1) => {
    const rawArr = col === "left" ? [...left] : [...right];
    const normalItems = rawArr.filter(x => !x.fullWidth);
    const normIdx = normalItems.indexOf(item);
    const normTarget = normIdx + dir;
    if (normTarget < 0 || normTarget >= normalItems.length) return;
    const aIdx = rawArr.indexOf(normalItems[normIdx]);
    const bIdx = rawArr.indexOf(normalItems[normTarget]);
    [rawArr[aIdx], rawArr[bIdx]] = [rawArr[bIdx], rawArr[aIdx]];
    onChange({ left: col === "left" ? rawArr : left, right: col === "right" ? rawArr : right });
  };

  const toOther = (col: "left" | "right", item: ContentItem) => {
    const src = col === "left" ? [...left] : [...right];
    const dst = col === "left" ? [...right] : [...left];
    const idx = src.indexOf(item);
    const [moved] = src.splice(idx, 1);
    dst.push(moved);
    onChange({ left: col === "left" ? src : dst, right: col === "right" ? src : dst });
  };

  const removeFullWidth = (col: "left" | "right", item: ContentItem) => {
    const arr = (col === "left" ? [...left] : [...right]).map(x =>
      x === item ? { ...x, fullWidth: undefined } : x,
    );
    onChange({ left: col === "left" ? arr : left, right: col === "right" ? arr : right });
  };

  const itemLabel = (item: ContentItem) =>
    item.kind === "image"
      ? (item.alt || "Image")
      : (stripHtml((item as any).heading) || "Text block");

  const renderNormalRow = (col: "left" | "right", item: ContentItem, normIdx: number, normLen: number) => (
    <div
      key={item.id ?? `${col}-${left.indexOf(item)}-${right.indexOf(item)}`}
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
        {itemLabel(item)}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          disabled={normIdx === 0}
          onClick={() => moveNormal(col, item, -1)}
          title="Move up within column"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={normIdx === normLen - 1}
          onClick={() => moveNormal(col, item, 1)}
          title="Move down within column"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => toOther(col, item)}
          title={col === "left" ? "Move to right column" : "Move to left column"}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors"
        >
          {col === "left" ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );

  const renderFullWidthRow = (col: "left" | "right", item: ContentItem) => (
    <div
      key={item.id ?? `fw-${col}-${left.indexOf(item)}-${right.indexOf(item)}`}
      className="group flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-muted/40"
    >
      <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold leading-none bg-violet-400/15 text-violet-400">
        FW
      </span>
      <span className="shrink-0 text-muted-foreground">
        {item.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <Type className="h-3 w-3" />}
      </span>
      <span className="flex-1 min-w-0 truncate text-[11px] text-foreground">
        {itemLabel(item)}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => removeFullWidth(col, item)}
          title="Remove from full width (move back to column)"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors"
        >
          {col === "left" ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );

  const hasNormal = leftNormal.length > 0 || rightNormal.length > 0;

  return (
    <div className="rounded-md border border-border/50 bg-muted/5">
      <div className="border-b border-border/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Item order
      </div>
      <div className="p-1">
        {leftNormal.map((item, normIdx) => renderNormalRow("left", item, normIdx, leftNormal.length))}
        {leftNormal.length > 0 && rightNormal.length > 0 && (
          <div className="mx-1.5 my-1 h-px bg-border/40" />
        )}
        {rightNormal.map((item, normIdx) => renderNormalRow("right", item, normIdx, rightNormal.length))}

        {fullWidthItems.length > 0 && (
          <>
            {hasNormal && <div className="mx-1.5 my-1 h-px bg-border/40" />}
            <div className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-400/80">
              Full Width
            </div>
            {fullWidthItems.map(({ item, col }) => renderFullWidthRow(col, item))}
          </>
        )}
      </div>
    </div>
  );
}
