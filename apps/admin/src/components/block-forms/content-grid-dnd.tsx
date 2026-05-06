"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Grid3X3, Image as ImageIcon, Layers, Type } from "lucide-react";
import { InspectorField, InspectorInput, InspectorNumber } from "@/components/inspector";

function cn(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
import { FieldGrid } from "./admin-control-kit";

type ContentItem = {
  id?: string;
  kind?: "image" | "text";
  heading?: string;
  body?: string;
  src?: string;
  alt?: string;
  grid?: GridPlacement;
};

export type GridPlacement = {
  col?: number;
  row?: number;
  colSpan?: number;
  rowSpan?: number;
};

export type ContentGridConfig = {
  enabled?: boolean;
  columns?: number;
  rows?: number;
  rowHeight?: string;
  gap?: string;
};

type BoardItem = {
  id: string;
  list: "left" | "right";
  index: number;
  item: ContentItem;
  grid: Required<GridPlacement>;
};

const DEFAULT_GRID: Required<ContentGridConfig> = {
  enabled: false,
  columns: 12,
  rows: 8,
  rowHeight: "44px",
  gap: "8px",
};

function makeId() {
  return crypto?.randomUUID?.() ?? `cp-item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeConfig(grid?: ContentGridConfig): Required<ContentGridConfig> {
  return {
    enabled: grid?.enabled === true,
    columns: clamp(Math.round(Number(grid?.columns ?? DEFAULT_GRID.columns)), 1, 24),
    rows: clamp(Math.round(Number(grid?.rows ?? DEFAULT_GRID.rows)), 1, 60),
    rowHeight: grid?.rowHeight || DEFAULT_GRID.rowHeight,
    gap: grid?.gap || DEFAULT_GRID.gap,
  };
}

function defaultSpan(item: ContentItem, columns: number): Pick<Required<GridPlacement>, "colSpan" | "rowSpan"> {
  if (item.kind === "image") return { colSpan: Math.min(4, columns), rowSpan: 3 };
  return { colSpan: Math.min(6, columns), rowSpan: 2 };
}

function defaultPlacement(
  item: ContentItem,
  list: "left" | "right",
  index: number,
  columns: number,
): Required<GridPlacement> {
  const span = defaultSpan(item, columns);
  const half = Math.max(1, Math.floor(columns / 2));
  const col = list === "right" && columns > 1 ? half + 1 : 1;
  return {
    col: clamp(col, 1, columns),
    row: index * 2 + 1,
    colSpan: list === "right" ? Math.min(span.colSpan, columns - half) : Math.min(span.colSpan, half),
    rowSpan: span.rowSpan,
  };
}

function normalizePlacement(
  item: ContentItem,
  list: "left" | "right",
  index: number,
  columns: number,
  rows: number,
): Required<GridPlacement> {
  const fallback = defaultPlacement(item, list, index, columns);
  const colSpan = clamp(Math.round(Number(item.grid?.colSpan ?? fallback.colSpan)), 1, columns);
  const rowSpan = clamp(Math.round(Number(item.grid?.rowSpan ?? fallback.rowSpan)), 1, rows);
  return {
    col: clamp(Math.round(Number(item.grid?.col ?? fallback.col)), 1, Math.max(1, columns - colSpan + 1)),
    row: clamp(Math.round(Number(item.grid?.row ?? fallback.row)), 1, Math.max(1, rows - rowSpan + 1)),
    colSpan,
    rowSpan,
  };
}

function flattenItems(left: ContentItem[], right: ContentItem[], grid: Required<ContentGridConfig>): BoardItem[] {
  return [
    ...left.map((item, index) => ({
      id: item.id ?? `left-${index}`,
      list: "left" as const,
      index,
      item,
      grid: normalizePlacement(item, "left", index, grid.columns, grid.rows),
    })),
    ...right.map((item, index) => ({
      id: item.id ?? `right-${index}`,
      list: "right" as const,
      index,
      item,
      grid: normalizePlacement(item, "right", index, grid.columns, grid.rows),
    })),
  ];
}

function overlaps(a: Required<GridPlacement>, b: Required<GridPlacement>) {
  return (
    a.col < b.col + b.colSpan &&
    a.col + a.colSpan > b.col &&
    a.row < b.row + b.rowSpan &&
    a.row + a.rowSpan > b.row
  );
}

function findOverlapIds(items: BoardItem[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (overlaps(items[i].grid, items[j].grid)) {
        ids.add(items[i].id);
        ids.add(items[j].id);
      }
    }
  }
  return ids;
}

function applyPlacement(
  left: ContentItem[],
  right: ContentItem[],
  items: BoardItem[],
  id: string,
  pos: Required<GridPlacement>,
  config: Required<ContentGridConfig>,
): { left: ContentItem[]; right: ContentItem[] } | null {
  const entry = items.find((i) => i.id === id);
  if (!entry) return null;
  const colSpan = clamp(pos.colSpan, 1, config.columns);
  const rowSpan = clamp(pos.rowSpan, 1, config.rows);
  const newGrid: Required<GridPlacement> = {
    colSpan,
    rowSpan,
    col: clamp(pos.col, 1, Math.max(1, config.columns - colSpan + 1)),
    row: Math.max(1, pos.row),
  };
  const nextLeft = left.slice();
  const nextRight = right.slice();
  if (entry.list === "left") nextLeft[entry.index] = { ...entry.item, grid: newGrid };
  else nextRight[entry.index] = { ...entry.item, grid: newGrid };
  return { left: nextLeft, right: nextRight };
}

export function prepareGridItems({
  left,
  right,
  columns = DEFAULT_GRID.columns,
  rows = DEFAULT_GRID.rows,
}: {
  left: ContentItem[];
  right: ContentItem[];
  columns?: number;
  rows?: number;
}) {
  const grid = normalizeConfig({ columns, rows });
  return {
    left: left.map((item, index) => ({
      ...item,
      id: item.id ?? makeId(),
      grid: item.grid ?? defaultPlacement(item, "left", index, grid.columns),
    })),
    right: right.map((item, index) => ({
      ...item,
      id: item.id ?? makeId(),
      grid: item.grid ?? defaultPlacement(item, "right", index, grid.columns),
    })),
  };
}

export function ContentGridDnd({
  left,
  right,
  grid,
  onGridChange,
  onItemsChange,
}: {
  left: ContentItem[];
  right: ContentItem[];
  grid?: ContentGridConfig;
  onGridChange: (next: ContentGridConfig) => void;
  onItemsChange: (next: { left: ContentItem[]; right: ContentItem[] }) => void;
}) {
  const config = normalizeConfig(grid);
  const items = useMemo(() => flattenItems(left, right, config), [left, right, config]);
  const overlapIds = useMemo(() => findOverlapIds(items), [items]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropCell, setDropCell] = useState<{ col: number; row: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  const getCellFromEvent = useCallback(
    (e: React.DragEvent | React.MouseEvent) => {
      const el = gridRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const rx = clamp((e.clientX - rect.left) / rect.width, 0, 0.9999);
      const ry = clamp((e.clientY - rect.top) / rect.height, 0, 0.9999);
      return {
        col: Math.floor(rx * config.columns) + 1,
        row: Math.floor(ry * config.rows) + 1,
      };
    },
    [config.columns, config.rows],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropCell(null);
    const id = e.dataTransfer.getData("application/x-content-item-id");
    if (!id) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    const entry = items.find((i) => i.id === id);
    if (!entry) return;
    const target: Required<GridPlacement> = {
      ...entry.grid,
      col: clamp(cell.col, 1, Math.max(1, config.columns - entry.grid.colSpan + 1)),
      row: clamp(cell.row, 1, Math.max(1, config.rows - entry.grid.rowSpan + 1)),
    };
    const next = applyPlacement(left, right, items, id, target, config);
    if (next) onItemsChange(next);
  };

  const updateActive = (patch: Partial<Required<GridPlacement>>) => {
    if (!activeItem) return;
    const next = applyPlacement(left, right, items, activeItem.id, { ...activeItem.grid, ...patch }, config);
    if (next) onItemsChange(next);
  };

  // Highlight which cells the dragged item will occupy when dropped
  const previewCells = useMemo(() => {
    if (!dropCell || !activeItem) return null;
    const col = clamp(dropCell.col, 1, Math.max(1, config.columns - activeItem.grid.colSpan + 1));
    const row = clamp(dropCell.row, 1, Math.max(1, config.rows - activeItem.grid.rowSpan + 1));
    const cells = new Set<string>();
    for (let c = col; c < col + activeItem.grid.colSpan; c++) {
      for (let r = row; r < row + activeItem.grid.rowSpan; r++) {
        cells.add(`${c}-${r}`);
      }
    }
    return cells;
  }, [dropCell, activeItem, config.columns, config.rows]);

  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-muted/10 p-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Grid3X3 className="h-3 w-3" />
        Grid layout
      </div>

      <FieldGrid>
        <InspectorField label="Cols">
          <InspectorNumber
            value={config.columns}
            min={1}
            max={24}
            onChange={(v) => onGridChange({ ...grid, columns: v ?? DEFAULT_GRID.columns })}
          />
        </InspectorField>
        <InspectorField label="Rows">
          <InspectorNumber
            value={config.rows}
            min={1}
            max={60}
            onChange={(v) => onGridChange({ ...grid, rows: v ?? DEFAULT_GRID.rows })}
          />
        </InspectorField>
        <InspectorField label="Row H">
          <InspectorInput
            value={config.rowHeight}
            onChange={(v) => onGridChange({ ...grid, rowHeight: v || DEFAULT_GRID.rowHeight })}
            placeholder="44px"
          />
        </InspectorField>
        <InspectorField label="Gap">
          <InspectorInput
            value={config.gap}
            onChange={(v) => onGridChange({ ...grid, gap: v || DEFAULT_GRID.gap })}
            placeholder="8px"
          />
        </InspectorField>
      </FieldGrid>

      {/* Grid canvas */}
      <div
        ref={gridRef}
        className="relative overflow-hidden rounded-md border border-primary/30"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${config.rows}, ${config.rowHeight})`,
          gap: config.gap,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          const cell = getCellFromEvent(e);
          if (cell) setDropCell(cell);
        }}
        onDragLeave={() => setDropCell(null)}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) setActiveId(null);
        }}
      >
        {/* Background cells */}
        {Array.from({ length: config.rows }, (_, ri) =>
          Array.from({ length: config.columns }, (_, ci) => {
            const col = ci + 1;
            const row = ri + 1;
            const isPreview = previewCells?.has(`${col}-${row}`) ?? false;
            return (
              <div
                key={`${col}-${row}`}
                className={cn(
                  "transition-colors",
                  isPreview ? "bg-primary/20 border border-primary/50" : "border border-primary/10",
                )}
              />
            );
          }),
        )}

        {/* Items */}
        {items.map((entry) => {
          const isActive = activeId === entry.id;
          const hasOverlap = overlapIds.has(entry.id);
          return (
            <div
              key={entry.id}
              draggable={isActive}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-content-item-id", entry.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(isActive ? null : entry.id);
              }}
              className={cn(
                "z-10 min-w-0 overflow-hidden rounded border-2 bg-card/95 p-1.5 shadow-sm transition-all select-none",
                isActive
                  ? "cursor-grab border-primary shadow-md ring-1 ring-primary/30 active:cursor-grabbing"
                  : "cursor-pointer border-primary/35 hover:border-primary/65",
                hasOverlap && !isActive && "border-amber-400/60",
              )}
              style={{
                gridColumn: `${entry.grid.col} / span ${entry.grid.colSpan}`,
                gridRow: `${entry.grid.row} / span ${entry.grid.rowSpan}`,
                zIndex: isActive ? 20 : 10,
              }}
              title={isActive ? "Drag to move" : "Click to select"}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-primary">
                  {entry.item.kind === "image"
                    ? <ImageIcon className="h-3 w-3 shrink-0" />
                    : <Type className="h-3 w-3 shrink-0" />}
                  <span className="truncate">
                    {entry.item.kind === "image" ? "Image" : (entry.item.heading || "Text")}
                  </span>
                </span>
                <span className={cn(
                  "shrink-0 text-[9px] font-bold",
                  entry.list === "left" ? "text-blue-400" : "text-emerald-400",
                )}>
                  {entry.list === "left" ? "L" : "R"}
                </span>
              </div>
              {entry.item.kind === "image" ? (
                entry.item.src ? (
                  <img
                    src={entry.item.src}
                    alt=""
                    className="h-full max-h-16 w-full rounded-sm object-cover opacity-75"
                  />
                ) : (
                  <div className="flex h-8 items-center justify-center rounded-sm border border-dashed border-border text-[10px] text-muted-foreground">
                    No image
                  </div>
                )
              ) : (
                <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                  {entry.item.body || "—"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Instruction */}
      <p className="text-[10px] text-muted-foreground/70">
        {activeId
          ? "Selected — drag to move freely. Click elsewhere to deselect."
          : "Click an item to select it, then drag to reposition."}
      </p>

      {/* Overlap warning */}
      {overlapIds.size > 0 && (
        <div className="rounded-md border border-amber-400/30 bg-amber-400/8 px-2 py-1.5 space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
            <Layers className="h-3 w-3 shrink-0" />
            {overlapIds.size} items overlap — click to select and reposition:
          </div>
          <div className="flex flex-wrap gap-1">
            {[...overlapIds].map((id) => {
              const it = items.find((i) => i.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveId(id)}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] border transition-colors",
                    activeId === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-amber-400/40 text-amber-600 hover:bg-amber-400/10",
                  )}
                >
                  {it?.item.kind === "image" ? "Image" : (it?.item.heading || "Text")}
                  <span className="ml-1 text-[9px] opacity-50">[{it?.list}]</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active item controls */}
      {activeItem && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-2 space-y-1.5">
          <div className="text-[10px] font-semibold text-primary">
            {activeItem.item.kind === "image" ? "Image" : (activeItem.item.heading || "Text")} — position & size
          </div>
          <div className="grid grid-cols-4 gap-1">
            <InspectorNumber
              value={activeItem.grid.col}
              min={1}
              max={config.columns}
              onChange={(v) => updateActive({ col: v ?? activeItem.grid.col })}
            />
            <InspectorNumber
              value={activeItem.grid.row}
              min={1}
              max={config.rows}
              onChange={(v) => updateActive({ row: v ?? activeItem.grid.row })}
            />
            <InspectorNumber
              value={activeItem.grid.colSpan}
              min={1}
              max={config.columns}
              onChange={(v) => updateActive({ colSpan: v ?? activeItem.grid.colSpan })}
            />
            <InspectorNumber
              value={activeItem.grid.rowSpan}
              min={1}
              max={config.rows}
              onChange={(v) => updateActive({ rowSpan: v ?? activeItem.grid.rowSpan })}
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[9px] text-muted-foreground">
            <span>Col</span><span>Row</span><span>W</span><span>H</span>
          </div>
        </div>
      )}
    </div>
  );
}
