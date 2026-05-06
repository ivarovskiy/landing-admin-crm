"use client";

import type React from "react";
import { useMemo } from "react";
import { Grid3X3, Image as ImageIcon, Type } from "lucide-react";
import { InspectorField, InspectorInput, InspectorNumber } from "@/components/inspector";
import { AdvancedPanel, FieldGrid, SectionNote } from "./admin-control-kit";

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

function normalizeTarget(
  placement: Required<GridPlacement>,
  grid: Required<ContentGridConfig>,
): Required<GridPlacement> {
  const colSpan = clamp(placement.colSpan, 1, grid.columns);
  const rowSpan = clamp(placement.rowSpan, 1, grid.rows);
  return {
    colSpan,
    rowSpan,
    col: clamp(placement.col, 1, Math.max(1, grid.columns - colSpan + 1)),
    row: Math.max(1, placement.row),
  };
}

function pushDownPlacement(
  items: BoardItem[],
  movingId: string,
  target: Required<GridPlacement>,
  grid: Required<ContentGridConfig>,
) {
  const placements = new Map(items.map((item) => [item.id, { ...item.grid }] as const));
  const moving = placements.get(movingId);
  if (!moving) return null;

  placements.set(movingId, normalizeTarget(target, grid));

  let changed = true;
  let guard = 0;
  let rows = grid.rows;

  while (changed && guard < items.length * items.length * 4) {
    changed = false;
    guard += 1;

    const ordered = items
      .map((item) => ({ item, grid: placements.get(item.id)! }))
      .sort((a, b) => {
        if (a.item.id === movingId) return -1;
        if (b.item.id === movingId) return 1;
        return a.grid.row - b.grid.row || a.grid.col - b.grid.col;
      });

    for (const anchor of ordered) {
      const anchorGrid = placements.get(anchor.item.id)!;
      const blockers = ordered
        .filter((candidate) => candidate.item.id !== anchor.item.id)
        .filter((candidate) => overlaps(anchorGrid, placements.get(candidate.item.id)!))
        .sort((a, b) => placements.get(a.item.id)!.row - placements.get(b.item.id)!.row);

      for (const blocker of blockers) {
        const blockerGrid = placements.get(blocker.item.id)!;
        const next = {
          ...blockerGrid,
          row: anchorGrid.row + anchorGrid.rowSpan,
        };

        if (next.row !== blockerGrid.row) {
          placements.set(blocker.item.id, next);
          rows = Math.max(rows, next.row + next.rowSpan - 1);
          changed = true;
        }
      }
    }
  }

  rows = Math.max(
    rows,
    ...Array.from(placements.values()).map((placement) => placement.row + placement.rowSpan - 1),
  );

  return { placements, rows };
}

function updateBoardItems(
  left: ContentItem[],
  right: ContentItem[],
  items: BoardItem[],
  placements: Map<string, Required<GridPlacement>>,
) {
  const nextLeft = left.slice();
  const nextRight = right.slice();

  for (const boardItem of items) {
    const placement = placements.get(boardItem.id);
    if (!placement) continue;

    const nextItem = { ...boardItem.item, id: boardItem.item.id ?? boardItem.id, grid: placement };
    if (boardItem.list === "left") nextLeft[boardItem.index] = nextItem;
    else nextRight[boardItem.index] = nextItem;
  }

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

  const setItemGrid = (id: string, placement: Required<GridPlacement>) => {
    const pushed = pushDownPlacement(items, id, placement, config);
    if (!pushed) return;
    if (pushed.rows !== config.rows) {
      onGridChange({ ...grid, rows: pushed.rows });
    }
    onItemsChange(updateBoardItems(left, right, items, pushed.placements));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-content-item-id");
    if (!id) return;

    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const relX = clamp(event.clientX - rect.left, 0, rect.width);
    const relY = clamp(event.clientY - rect.top, 0, rect.height);
    const col = clamp(Math.floor((relX / rect.width) * config.columns) + 1, 1, config.columns);
    const row = clamp(Math.floor((relY / rect.height) * config.rows) + 1, 1, config.rows);
    const target = {
      ...item.grid,
      col: clamp(col, 1, Math.max(1, config.columns - item.grid.colSpan + 1)),
      row: clamp(row, 1, Math.max(1, config.rows - item.grid.rowSpan + 1)),
    };

    setItemGrid(id, target);
  };

  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-muted/10 p-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Grid3X3 className="h-3 w-3" />
        Grid layout
      </div>

      <SectionNote>
        Drag blocks inside the grid. If the target area is occupied, the block already there moves down without changing the rest of the layout.
      </SectionNote>

      <FieldGrid>
        <InspectorField label="Cols">
          <InspectorNumber
            value={config.columns}
            min={1}
            max={24}
            onChange={(value) => onGridChange({ ...grid, columns: value ?? DEFAULT_GRID.columns })}
          />
        </InspectorField>
        <InspectorField label="Rows">
          <InspectorNumber
            value={config.rows}
            min={1}
            max={60}
            onChange={(value) => onGridChange({ ...grid, rows: value ?? DEFAULT_GRID.rows })}
          />
        </InspectorField>
        <InspectorField label="Row H">
          <InspectorInput
            value={config.rowHeight}
            onChange={(value) => onGridChange({ ...grid, rowHeight: value || DEFAULT_GRID.rowHeight })}
            placeholder="44px"
          />
        </InspectorField>
        <InspectorField label="Gap">
          <InspectorInput
            value={config.gap}
            onChange={(value) => onGridChange({ ...grid, gap: value || DEFAULT_GRID.gap })}
            placeholder="8px"
          />
        </InspectorField>
      </FieldGrid>

      <div
        className="relative overflow-hidden rounded-md border border-primary/40 bg-background/70"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${config.rows}, ${config.rowHeight})`,
          gap: config.gap,
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-primary) 18%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 18%, transparent) 1px, transparent 1px)",
          backgroundSize: `calc((100% - (${config.columns - 1} * ${config.gap})) / ${config.columns} + ${config.gap}) calc(${config.rowHeight} + ${config.gap})`,
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {items.map((entry) => (
          <div
            key={entry.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-content-item-id", entry.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            className="group z-10 min-w-0 cursor-grab overflow-hidden rounded border border-primary/60 bg-card/95 p-1.5 shadow-sm active:cursor-grabbing"
            style={{
              gridColumn: `${entry.grid.col} / span ${entry.grid.colSpan}`,
              gridRow: `${entry.grid.row} / span ${entry.grid.rowSpan}`,
            }}
            title="Drag to a free grid area"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-primary">
                {entry.item.kind === "image" ? <ImageIcon className="h-3 w-3 shrink-0" /> : <Type className="h-3 w-3 shrink-0" />}
                <span className="truncate">{entry.item.kind === "image" ? "Image" : entry.item.heading || "Text"}</span>
              </span>
              <span className="text-[9px] text-muted-foreground">
                {entry.grid.col}:{entry.grid.row}
              </span>
            </div>
            {entry.item.kind === "image" ? (
              entry.item.src ? (
                <img src={entry.item.src} alt="" className="h-full max-h-20 w-full rounded-sm object-cover opacity-80" />
              ) : (
                <div className="flex h-12 items-center justify-center rounded-sm border border-dashed border-border text-[10px] text-muted-foreground">
                  Image
                </div>
              )
            ) : (
              <p className="line-clamp-3 text-[10px] leading-snug text-muted-foreground">
                {entry.item.body || "Text block"}
              </p>
            )}
          </div>
        ))}
      </div>

      <AdvancedPanel title="Manual cell controls">
        <div className="space-y-1.5">
          {items.map((entry) => (
            <div key={`controls-${entry.id}`} className="rounded border border-border/60 p-1.5">
              <div className="mb-1 text-[10px] font-semibold text-muted-foreground">
                {entry.item.kind === "image" ? "Image" : entry.item.heading || "Text block"}
              </div>
              <div className="grid grid-cols-4 gap-1">
                <InspectorNumber
                  value={entry.grid.col}
                  min={1}
                  max={config.columns}
                  onChange={(value) => setItemGrid(entry.id, { ...entry.grid, col: value ?? entry.grid.col })}
                />
                <InspectorNumber
                  value={entry.grid.row}
                  min={1}
                  max={config.rows}
                  onChange={(value) => setItemGrid(entry.id, { ...entry.grid, row: value ?? entry.grid.row })}
                />
                <InspectorNumber
                  value={entry.grid.colSpan}
                  min={1}
                  max={config.columns}
                  onChange={(value) => setItemGrid(entry.id, { ...entry.grid, colSpan: value ?? entry.grid.colSpan })}
                />
                <InspectorNumber
                  value={entry.grid.rowSpan}
                  min={1}
                  max={config.rows}
                  onChange={(value) => setItemGrid(entry.id, { ...entry.grid, rowSpan: value ?? entry.grid.rowSpan })}
                />
              </div>
              <div className="mt-0.5 grid grid-cols-4 gap-1 text-center text-[9px] text-muted-foreground">
                <span>Col</span>
                <span>Row</span>
                <span>W</span>
                <span>H</span>
              </div>
            </div>
          ))}
        </div>
      </AdvancedPanel>
    </div>
  );
}
