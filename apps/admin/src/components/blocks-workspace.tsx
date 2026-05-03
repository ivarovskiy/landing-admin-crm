"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Badge } from "@acme/ui";
import { AddBlockForm } from "@/components/add-block-form";
import { DeleteBlockButton } from "@/components/delete-block-button";
import { BlockVisibilityControls } from "@/components/block-visibility-controls";
import { BlockEditPanel } from "@/components/block-edit-panel";
import { PageSettingsPanel, type PageCanvasSettings } from "@/components/page-settings-panel";
import { readHide, desktopVisibilityState } from "@/lib/visibility";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Search,
  Smartphone,
  Monitor,
  Layers,
  EyeOff,
  Eye,
  ExternalLink,
  Minus,
  Plus,
  Maximize2,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
  LayoutGrid,
  Type,
  Image,
  MousePointerClick,
  Box,
  MousePointer2,
  Hand,
  Settings,
  Keyboard,
} from "lucide-react";

/* ================================================================
   Types
   ================================================================ */

type Block = {
  id: string;
  order: number;
  type: string;
  variant: string;
  data: any;
};

type Banner = { kind: "success" | "error"; message: string } | null;
type ViewportMode = "all" | "mobile" | "desktop";
type ViewMode = "desktop" | "ipadPro" | "mobile";

/* ================================================================
   Helpers
   ================================================================ */

function isVisibleIn(data: any, mode: ViewportMode): boolean {
  if (mode === "all") return true;
  const hide = readHide(data);
  if (mode === "mobile") return !hide.base;
  return desktopVisibilityState(hide) !== "hidden";
}

function visibilityLabel(data: any) {
  const hide = readHide(data);
  return {
    mobile: !hide.base,
    desktop: desktopVisibilityState(hide) !== "hidden",
  };
}

function blockIcon(type: string) {
  switch (type) {
    case "header":
    case "footer":
      return <LayoutGrid className="h-3.5 w-3.5" />;
    case "hero":
      return <Image className="h-3.5 w-3.5" />;
    case "features":
      return <Box className="h-3.5 w-3.5" />;
    case "scrapbook":
      return <Image className="h-3.5 w-3.5" />;
    case "content-page":
      return <Type className="h-3.5 w-3.5" />;
    default:
      return <MousePointerClick className="h-3.5 w-3.5" />;
  }
}

/* ================================================================
   Scale presets for canvas
   ================================================================ */

/** Zoom steps: 1 = fit-to-width (auto), >1 zoomed in, <1 zoomed out */
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const DEFAULT_ZOOM_IDX = 2; // "1x" = fit to container
const CANVAS_PADDING = 24; // vertical padding from canvas edge to artboard top
const VIEWPORT_PRESETS: Record<
  ViewMode,
  { width: number; label: string; tooltip: string }
> = {
  desktop: {
    width: 1440,
    label: "Desktop",
    tooltip: "Desktop view (1440px)",
  },
  ipadPro: {
    width: 1366,
    label: "iPad Pro",
    tooltip: "iPad Pro view (1366px)",
  },
  mobile: {
    width: 390,
    label: "Mobile",
    tooltip: "Mobile view (390px)",
  },
};

/* ================================================================
   Main workspace component
   ================================================================ */

export function BlocksWorkspace({
  pageId,
  pageSlug,
  pageStatus,
  pageParentId,
  allPages,
  blocks,
  initialActiveId,
}: {
  pageId: string;
  pageSlug: string;
  pageStatus: string;
  pageParentId?: string | null;
  allPages?: Array<{ id: string; slug: string; parentId?: string | null }>;
  blocks: Block[];
  initialActiveId?: string;
}) {
  const router = useRouter();

  /* ---------- state ---------- */
  const sorted = useMemo(
    () => [...(blocks ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [blocks],
  );

  const [q, setQ] = useState("");
  const [viewportMode, setViewportMode] = useState<ViewportMode>("all");
  const [activeId, setActiveId] = useState<string>(() => {
    if (initialActiveId && sorted.some((b) => b.id === initialActiveId))
      return initialActiveId;
    return sorted[0]?.id ?? "";
  });

  const [banner, setBanner] = useState<Banner>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Element selection (for visual editor ↔ preview sync)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [externalDraftUpdate, setExternalDraftUpdate] = useState<{
    blockId: string;
    data: any;
    version: number;
  } | null>(null);

  // Preview mode — hides all panels, toolbar; canvas only
  const [previewMode, setPreviewMode] = useState(false);

  // Page settings floating panel
  const [showPageSettings, setShowPageSettings] = useState(false);

  // Page-level canvas settings
  const [canvasSettings, setCanvasSettings] = useState<PageCanvasSettings>({
    canvasScroll: false,
    showGrid: true,
  });

  function updateCanvasSettings(patch: Partial<PageCanvasSettings>) {
    setCanvasSettings((prev) => ({ ...prev, ...patch }));
  }

  // Keyboard shortcuts guide
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Canvas tool
  const [tool, setTool] = useState<"pointer" | "hand">("pointer");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panDragRef = useRef({ active: false, startX: 0, startY: 0, panStartX: 0, panStartY: 0 });
  const isHandMode = tool === "hand" || spaceHeld;

  // Transform-based pan (Figma style — no canvas scroll)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  // ref to avoid stale closure in postMessage handler
  const scaleRef = useRef(1);

  // Canvas state
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM_IDX);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [iframeHeight, setIframeHeight] = useState(1200);

  const zoomMultiplier = ZOOM_STEPS[zoomIdx];


  // Measure canvas container width
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ctrl+scroll on the canvas element → zoom preview, block browser zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();
      setZoomIdx((i) => e.deltaY < 0
        ? Math.min(ZOOM_STEPS.length - 1, i + 1)
        : Math.max(0, i - 1));
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvasWidth]); // re-run when canvas mounts (canvasWidth goes from 0 → value)

  // Reset pan when switching viewport mode
  useEffect(() => { setPanX(0); setPanY(0); }, [viewMode]);

  // Notify iframe when preview mode toggles — enables/disables block highlights
  useEffect(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "set-preview-mode", enabled: previewMode },
        "*",
      );
    } catch { /* cross-origin */ }
  }, [previewMode]);

  const availableWidth = canvasWidth > 0 ? canvasWidth - CANVAS_PADDING * 2 : 1440;

  const viewportPreset = VIEWPORT_PRESETS[viewMode];
  const iframeWidth = viewportPreset.width;

  // Desktop/iPad: viewport is fixed to the selected device width, while canvas
  // scale is visual only (Figma-style). Mobile keeps the previous direct scale.
  const scale =
    viewMode === "mobile"
      ? zoomMultiplier
      : zoomMultiplier * (availableWidth / iframeWidth);
  const displayWidth = Math.round(iframeWidth * scale);

  // Artboard top-left in canvas coords (transform-based, no scroll)
  const artboardX = canvasWidth > 0 ? Math.round((canvasWidth - displayWidth) / 2) + panX : panX;
  const artboardY = CANVAS_PADDING + panY;

  // Keep scaleRef current for stale-closure-free postMessage handlers
  scaleRef.current = scale;

  /* ---------- effects ---------- */

  // Lock body scroll while workspace is mounted (prevents double scrollbar)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 2500);
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    if (!activeId || !sorted.some((b) => b.id === activeId)) {
      setActiveId(sorted[0]?.id ?? "");
    }
  }, [sorted, activeId]);

  // Scroll to active block in preview
  useEffect(() => {
    if (!activeId || !iframeRef.current) return;
    const timer = setTimeout(() => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "scroll-to-block", blockId: activeId },
          "*",
        );
      } catch {
        /* cross-origin */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeId, refreshKey]);

  // Listen for block-clicked / element-clicked / block-offset messages from preview iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const { type, blockId, elementId, offsetTop } = e.data ?? {};

      if (type === "block-clicked" && blockId && sorted.some((b) => b.id === blockId)) {
        if (previewMode) return; // preview mode — ignore selection, don't disturb iframe scroll
        setActiveId(blockId);
        setSelectedElementId(null);
        canvasRef.current?.focus({ preventScroll: true });
      }

      if (type === "page-height" && typeof e.data.height === "number" && e.data.height > 0) {
        setIframeHeight(e.data.height);
      }

      if (type === "element-clicked" && blockId && elementId && sorted.some((b) => b.id === blockId)) {
        setActiveId(blockId);
        setSelectedElementId(elementId);
      }

      if (type === "live-block-change" && blockId && e.data?.data && sorted.some((b) => b.id === blockId)) {
        setExternalDraftUpdate({
          blockId,
          data: e.data.data,
          version: Date.now(),
        });
      }

      // Navigate canvas to show the block: move artboard so block sits near top
      if (type === "block-offset" && typeof offsetTop === "number") {
        // artboardY + offsetTop * scale = 80  →  panY = 80 - CANVAS_PADDING - offsetTop * scale
        const newPanY = 80 - CANVAS_PADDING - offsetTop * scaleRef.current;
        setPanY(newPanY);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [previewMode, sorted]);

  // H / V / Space tool shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "KeyH") setTool("hand");
      if (e.code === "KeyV") setTool("pointer");
      if (e.code === "KeyP") setPreviewMode((v) => !v);
      if (e.code === "Escape") setPreviewMode(false);
      if (e.code === "Space" && !e.repeat) { e.preventDefault(); setSpaceHeld(true); }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") setSpaceHeld(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Canvas pan drag handler — moves artboard via transform (Figma style)
  function handleCanvasMouseDown(e: React.MouseEvent) {
    // Reclaim keyboard focus so V/H/Space shortcuts work after clicking canvas.
    // preventScroll: true — prevent canvas from jumping to top when focused.
    canvasRef.current?.focus({ preventScroll: true });
    if (!isHandMode) return;
    e.preventDefault();
    const ref = panDragRef.current;
    ref.active = true;
    ref.startX = e.clientX;
    ref.startY = e.clientY;
    ref.panStartX = panX;
    ref.panStartY = panY;

    const onMove = (ev: MouseEvent) => {
      if (!ref.active) return;
      setPanX(ref.panStartX + (ev.clientX - ref.startX));
      setPanY(ref.panStartY + (ev.clientY - ref.startY));
    };
    const onUp = () => {
      ref.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // When element is selected in admin visual editor → highlight in preview
  function handleElementSelect(elementId: string | null) {
    setSelectedElementId(elementId);
    try {
      if (elementId && activeId) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "highlight-element", blockId: activeId, elementId },
          "*",
        );
      } else {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "clear-element" },
          "*",
        );
      }
    } catch { /* cross-origin */ }
  }

  /* ---------- filtered lists ---------- */
  const searched = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((b) =>
      `${b.type}:${b.variant}`.toLowerCase().includes(query),
    );
  }, [sorted, q]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      mobile: searched.filter((b) => isVisibleIn(b.data, "mobile")).length,
      desktop: searched.filter((b) => isVisibleIn(b.data, "desktop")).length,
    }),
    [searched],
  );

  const filtered = useMemo(() => {
    if (viewportMode === "all") return searched;
    return searched.filter((b) => isVisibleIn(b.data, viewportMode));
  }, [searched, viewportMode]);

  const hidden = useMemo(() => {
    if (viewportMode === "all") return [];
    return searched.filter((b) => !isVisibleIn(b.data, viewportMode));
  }, [searched, viewportMode]);

  const active =
    filtered.find((b) => b.id === activeId) ??
    sorted.find((b) => b.id === activeId) ??
    sorted[0] ??
    null;

  /* ---------- actions ---------- */
  async function move(blockId: string, direction: "up" | "down") {
    setMoving(blockId);
    setBanner(null);
    try {
      const r = await fetch(`/api/admin/blocks/${blockId}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!r.ok) throw new Error(await r.text());
      router.refresh();
    } catch (e: any) {
      setBanner({ kind: "error", message: e?.message ?? "Move failed" });
    } finally {
      setMoving(null);
    }
  }

  /* ---------- drag-to-reorder ---------- */
  async function handleDrop(fromId: string, toIdx: number) {
    const fromIdx = filtered.findIndex((b) => b.id === fromId);
    if (fromIdx === -1 || fromIdx === toIdx) return;

    const steps = Math.abs(toIdx - fromIdx);
    const direction = toIdx < fromIdx ? "up" : "down";

    setMoving(fromId);
    setBanner(null);

    try {
      for (let i = 0; i < steps; i++) {
        const r = await fetch(`/api/admin/blocks/${fromId}/move`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ direction }),
        });
        if (!r.ok) throw new Error(await r.text());
      }
      setBanner({ kind: "success", message: "Reordered" });
      router.refresh();
    } catch (e: any) {
      setBanner({ kind: "error", message: e?.message ?? "Reorder failed" });
      router.refresh();
    } finally {
      setMoving(null);
      setDragId(null);
      setDropIdx(null);
    }
  }

  /* ---------- preview source ---------- */
  const previewSrc = useMemo(() => {
    const qs = new URLSearchParams({
      r: String(refreshKey),
      viewport: viewMode,
    });
    return `/api/preview/${pageId}?${qs.toString()}`;
  }, [pageId, refreshKey, viewMode]);

  const liveEditEnabled = !!active && active.type === "hero" && active.variant === "slider-v1" && showInspector && !previewMode;

  const postLiveEditMode = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "set-live-edit-mode", enabled: liveEditEnabled },
        "*",
      );
    } catch { /* cross-origin */ }
  }, [liveEditEnabled]);

  useEffect(() => {
    postLiveEditMode();
  }, [postLiveEditMode, previewSrc]);

  // Reset iframe height when preview source changes so stale size doesn't flash
  useEffect(() => { setIframeHeight(1200); }, [previewSrc]);

  // Preview JWT lives ~7 days by default, but if TTL is shorter we still want
  // the iframe to auto-renew before it expires. Refresh every 50 min while the
  // tab is visible — goes through /api/preview/:id which re-issues a fresh token.
  useEffect(() => {
    const PREVIEW_REFRESH_MS = 50 * 60 * 1000;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setRefreshKey((v) => v + 1);
    }, PREVIEW_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="dark fixed inset-0 z-50 flex flex-col bg-background">
      {/* ============================================================
          TOOLBAR
          ============================================================ */}
      <div className={["flex items-center justify-between gap-3 border-b border-border/50 bg-card px-3 h-11 shrink-0 relative z-30 text-foreground", previewMode ? "hidden" : ""].join(" ")}>
        {/* Left: breadcrumb + page info */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 text-foreground hover:text-foreground"
          >
            <Link href="/admin/pages">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Pages
            </Link>
          </Button>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{pageSlug}</span>
            <Badge
              variant={pageStatus === "published" ? "default" : "secondary"}
              className="text-[10px] shrink-0"
            >
              {pageStatus}
            </Badge>
          </div>
        </div>

        {/* Center: tool + viewport + zoom */}
        <div className="flex items-center gap-2">
          {/* Tool switcher */}
          <div className="flex rounded-lg border border-border/50 bg-muted/40 p-0.5">
            <TToolBtn
              label="Pointer tool"
              shortcut="V"
              active={tool === "pointer" && !spaceHeld}
              onClick={() => setTool("pointer")}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </TToolBtn>
            <TToolBtn
              label="Hand tool"
              shortcut="H"
              active={tool === "hand" || spaceHeld}
              onClick={() => setTool("hand")}
            >
              <Hand className="h-3.5 w-3.5" />
            </TToolBtn>
          </div>

          <div className="h-5 w-px bg-border/50" />

          {/* Viewport toggle */}
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            {([
              { mode: "desktop" as const, Icon: Monitor },
              { mode: "ipadPro" as const, Icon: Monitor },
              { mode: "mobile" as const, Icon: Smartphone },
            ]).map(({ mode, Icon }) => (
              <TToolBtn
                key={mode}
                label={VIEWPORT_PRESETS[mode].tooltip}
                active={viewMode === mode}
                onClick={() => setViewMode(mode)}
                wide
              >
                <Icon className="h-3.5 w-3.5" />
                {VIEWPORT_PRESETS[mode].label}
              </TToolBtn>
            ))}
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <TToolBtn label="Zoom out" shortcut="Ctrl+scroll" disabled={zoomIdx <= 0} onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}>
              <Minus className="h-3.5 w-3.5" />
            </TToolBtn>
            <span className="text-xs font-medium tabular-nums w-10 text-center">
              {Math.round(zoomMultiplier * 100)}%
            </span>
            <TToolBtn label="Zoom in" shortcut="Ctrl+scroll" disabled={zoomIdx >= ZOOM_STEPS.length - 1} onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}>
              <Plus className="h-3.5 w-3.5" />
            </TToolBtn>

            <div className="flex gap-0.5 ml-1">
              {ZOOM_STEPS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  title={s === 1 ? "Fit to canvas width" : `Zoom to ${Math.round(s * 100)}%`}
                  onClick={() => setZoomIdx(i)}
                  className={[
                    "text-[10px] px-1 py-0.5 rounded font-medium transition-all",
                    i === zoomIdx
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {s === 1 ? "Fit" : `${Math.round(s * 100)}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0 text-foreground">
          <TBtn label="Refresh preview" shortcut="—" onClick={() => setRefreshKey((v) => v + 1)}>
            <RefreshCw className="h-3.5 w-3.5" />
          </TBtn>

          <TBtn label="Open in new tab" shortcut="—" asLink href={previewSrc}>
            <ExternalLink className="h-3.5 w-3.5" />
          </TBtn>

          <TBtn
            label="Fit to screen"
            shortcut="—"
            onClick={() => { setZoomIdx(DEFAULT_ZOOM_IDX); setPanX(0); setPanY(0); }}
            active={zoomIdx === DEFAULT_ZOOM_IDX && panX === 0 && panY === 0}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </TBtn>

          <div className="h-5 w-px bg-border" />

          <TBtn
            label="Shortcuts guide"
            shortcut="?"
            onClick={() => setShowShortcuts((v) => !v)}
            active={showShortcuts}
          >
            <Keyboard className="h-3.5 w-3.5" />
          </TBtn>

          <TBtn
            label="Page settings"
            shortcut="—"
            onClick={() => setShowPageSettings((v) => !v)}
            active={showPageSettings}
          >
            <Settings className="h-4 w-4" />
          </TBtn>

          <div className="h-5 w-px bg-border" />

          <TBtn
            label="Preview mode"
            shortcut="P"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="h-4 w-4" />
          </TBtn>

          <div className="h-5 w-px bg-border" />

          <TBtn
            label={showLayers ? "Hide layers" : "Show layers"}
            shortcut="—"
            onClick={() => setShowLayers((v) => !v)}
            active={showLayers}
          >
            {showLayers ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </TBtn>

          <TBtn
            label={showInspector ? "Hide inspector" : "Show inspector"}
            shortcut="—"
            onClick={() => setShowInspector((v) => !v)}
            active={showInspector}
          >
            {showInspector ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </TBtn>
        </div>
      </div>

      {/* ============================================================
          MAIN AREA: Canvas + floating panels
          ============================================================ */}
      <div className="relative flex-1 overflow-hidden">
        {/* --------------------------------------------------------
            LAYERS PANEL (left) — floating
            -------------------------------------------------------- */}
        {showLayers && !previewMode && (
          <div className="absolute top-3 left-3 bottom-3 z-20 w-[240px] flex flex-col bg-card/95 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Layers header */}
            <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Layers
                  </span>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {sorted.length}
                </span>
              </div>

              {/* Viewport filter */}
              <div className="flex rounded-md border bg-muted/30 p-0.5">
                {(
                  [
                    { v: "all" as const, label: "All", tooltip: "Show all blocks", Icon: Layers },
                    { v: "mobile" as const, label: "Mob", tooltip: "Mobile visible", Icon: Smartphone },
                    { v: "desktop" as const, label: "Desk", tooltip: "Desktop visible", Icon: Monitor },
                  ] as const
                ).map(({ v, label, tooltip, Icon }) => (
                  <button
                    key={v}
                    type="button"
                    title={tooltip}
                    onClick={() => setViewportMode(v)}
                    className={[
                      "relative group flex-1 flex items-center justify-center gap-1 rounded px-1 py-1 text-[10px] font-medium transition-all",
                      v === viewportMode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                    <span className="opacity-60 tabular-nums">{counts[v]}</span>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center whitespace-nowrap rounded bg-popover border border-border/60 shadow px-1.5 py-0.5 text-[10px] text-popover-foreground z-50">
                      {tooltip}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2 top-[9px] text-muted-foreground" />
                <input
                  className="w-full h-7 rounded-md border bg-background pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter blocks..."
                />
              </div>
            </div>

            {/* Banner */}
            {banner && (
              <div
                className={[
                  "mx-3 mb-2 rounded-md px-2 py-1.5 text-[11px]",
                  banner.kind === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200",
                ].join(" ")}
              >
                {banner.message}
              </div>
            )}

            {/* Block layers list */}
            <div className="flex-1 overflow-y-auto px-1.5 pb-2">
              <div className="space-y-px">
                {filtered.map((b, idx) => (
                  <LayerItem
                    key={b.id}
                    block={b}
                    index={idx}
                    isActive={b.id === active?.id}
                    isBusy={moving === b.id}
                    isFirst={idx === 0}
                    isLast={idx === filtered.length - 1}
                    viewportMode={viewportMode}
                    isDragging={dragId === b.id}
                    isDropTarget={dropIdx === idx && dragId !== b.id}
                    onSelect={() => { setActiveId(b.id); setSelectedElementId(null); }}
                    onMove={(dir) => move(b.id, dir)}
                    onBanner={setBanner}
                    onDragStart={() => setDragId(b.id)}
                    onDragOver={() => setDropIdx(idx)}
                    onDragEnd={() => {
                      if (dragId && dropIdx !== null) {
                        handleDrop(dragId, dropIdx);
                      } else {
                        setDragId(null);
                        setDropIdx(null);
                      }
                    }}
                  />
                ))}
              </div>

              {/* Hidden in current viewport */}
              {hidden.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Hidden ({hidden.length})
                    </span>
                  </div>
                  <div className="space-y-px">
                    {hidden.map((b, idx) => (
                      <LayerItem
                        key={b.id}
                        block={b}
                        index={-1}
                        isActive={b.id === active?.id}
                        isBusy={moving === b.id}
                        isFirst={idx === 0}
                        isLast={idx === hidden.length - 1}
                        viewportMode={viewportMode}
                        dimmed
                        onSelect={() => { setActiveId(b.id); setSelectedElementId(null); }}
                        onMove={(dir) => move(b.id, dir)}
                        onBanner={setBanner}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && hidden.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No blocks
                </div>
              )}
            </div>

            {/* Add block form — scrollable when open */}
            {showAddBlock && (
              <div className="border-t flex-1 overflow-y-auto p-2 min-h-0">
                <AddBlockForm pageId={pageId} />
              </div>
            )}

            {/* Add block button — always at bottom */}
            <div className="border-t p-2 shrink-0">
              <button
                type="button"
                title={showAddBlock ? "Close add block form" : "Add a new block to this page"}
                onClick={() => setShowAddBlock((v) => !v)}
                className={[
                  "w-full flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all",
                  showAddBlock
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddBlock ? "Close" : "Add Block"}
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------
            CANVAS — overflow:hidden, artboard moves via transform pan
            In preview mode: overflow:auto for natural page scroll
            -------------------------------------------------------- */}
        <div
          ref={canvasRef}
          className="absolute inset-0"
          tabIndex={-1}
          style={{
            outline: "none",
            overflow: previewMode || canvasSettings.canvasScroll ? "auto" : "hidden",
            backgroundImage: previewMode || !canvasSettings.showGrid ? undefined :
              "radial-gradient(circle, hsl(var(--border) / 0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundColor: previewMode ? undefined : "oklch(0.09 0 0)",
            cursor: isHandMode && !previewMode ? "grab" : "default",
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Artboard — absolutely positioned, moved by panX/panY */}
          <div
            style={{
              position: "absolute",
              left: artboardX,
              top: artboardY,
              width: displayWidth,
              height: iframeHeight * scale,
              overflow: "hidden",
              borderRadius: viewMode === "mobile" ? 16 : 8,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              outline: "1px solid rgb(0 0 0 / 0.05)",
            }}
          >
            <iframe
              ref={iframeRef}
              key={previewSrc}
              title="Page preview"
              src={previewSrc}
              className="border-0 bg-white"
              onLoad={postLiveEditMode}
              style={{
                width: iframeWidth,
                height: iframeHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
            {/* Pointer capture overlay in hand mode */}
            {isHandMode && !previewMode && (
              <div className="absolute inset-0" style={{ cursor: "grab" }} />
            )}
          </div>
        </div>

        {/* --------------------------------------------------------
            PREVIEW MODE exit button — floating
            -------------------------------------------------------- */}
        {previewMode && (
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-md border border-border/50 shadow-2xl px-4 py-2 text-xs font-medium text-foreground hover:bg-card transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Exit Preview
            <kbd className="ml-1 text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">Esc</kbd>
          </button>
        )}

        {/* Shortcuts guide */}
        {showShortcuts && !previewMode && (
          <ShortcutsGuide onClose={() => setShowShortcuts(false)} />
        )}

        {/* --------------------------------------------------------
            INSPECTOR PANEL (right) — floating
            -------------------------------------------------------- */}
        {/* Inspector panel — Block only */}
        {showInspector && !previewMode && (
          <div className="absolute top-3 right-3 bottom-3 z-20 w-[350px] max-w-[calc(100vw-32px)] flex flex-col bg-card/95 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border/50 shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {active ? `${active.type}:${active.variant}` : "Inspector"}
              </span>
            </div>
            {active ? (
              <BlockEditPanel
                blockId={active.id}
                title={`${active.type}:${active.variant}`}
                type={active.type}
                variant={active.variant}
                initial={active.data}
                viewMode={viewMode}
                externalSelectedElementId={selectedElementId}
                externalDraftUpdate={externalDraftUpdate}
                onElementSelect={handleElementSelect}
                onDraftChange={(blockId, data) => {
                  try {
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: "update-block", blockId, data },
                      "*",
                    );
                  } catch { /* cross-origin */ }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6">
                Select a block to inspect
              </div>
            )}
          </div>
        )}

        {/* Page settings — standalone floating panel */}
        {showPageSettings && !previewMode && (
          <PageSettingsPanel
            pageId={pageId}
            slug={pageSlug}
            status={pageStatus}
            parentId={pageParentId ?? null}
            allPages={allPages ?? []}
            canvasSettings={canvasSettings}
            onCanvasSettingsChange={updateCanvasSettings}
            onClose={() => setShowPageSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================
   TToolBtn — tooltip button for grouped toolbar controls (tool/viewport/zoom)
   ================================================================ */

function TToolBtn({
  children,
  label,
  shortcut,
  active,
  wide,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  wide?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative group flex items-center justify-center gap-1 rounded transition-all disabled:opacity-40",
        wide ? "px-2 py-1 text-xs font-medium" : "px-2 py-1",
        active
          ? "bg-muted text-foreground shadow-sm"
          : "text-foreground/60 hover:text-foreground",
      ].join(" ")}
    >
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-md bg-popover border border-border/60 shadow-md px-2 py-1 text-[11px] text-popover-foreground z-50">
        {label}
        {shortcut && (
          <kbd className="ml-0.5 font-mono text-[10px] bg-muted text-muted-foreground px-1 py-0.5 rounded">
            {shortcut}
          </kbd>
        )}
      </span>
    </button>
  );
}

/* ================================================================
   TBtn — toolbar button with rich tooltip
   ================================================================ */

function TBtn({
  children,
  label,
  shortcut,
  onClick,
  active,
  asLink,
  href,
}: {
  children: React.ReactNode;
  label: string;
  shortcut: string;
  onClick?: () => void;
  active?: boolean;
  asLink?: boolean;
  href?: string;
}) {
  const cls = [
    "relative group flex items-center justify-center rounded px-2 py-1 h-7 w-7 transition-all",
    active
      ? "bg-primary/15 text-primary"
      : "text-foreground/70 hover:text-foreground hover:bg-muted/60",
  ].join(" ");

  const tooltip = (
    <span className="
      pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
      hidden group-hover:flex
      items-center gap-1.5 whitespace-nowrap
      rounded-md bg-popover border border-border/60 shadow-md
      px-2 py-1 text-[11px] text-popover-foreground z-50
    ">
      {label}
      {shortcut !== "—" && (
        <kbd className="ml-0.5 font-mono text-[10px] bg-muted text-muted-foreground px-1 py-0.5 rounded">
          {shortcut}
        </kbd>
      )}
    </span>
  );

  if (asLink && href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
        {tooltip}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
      {tooltip}
    </button>
  );
}

/* ================================================================
   ShortcutsGuide — floating keyboard shortcuts panel
   ================================================================ */

const SHORTCUTS = [
  { group: "Tools", items: [
    { key: "V", desc: "Pointer tool" },
    { key: "H", desc: "Hand / pan tool" },
    { key: "Space", desc: "Hold to pan temporarily" },
  ]},
  { group: "View", items: [
    { key: "P", desc: "Toggle preview mode" },
    { key: "Esc", desc: "Exit preview mode" },
    { key: "Ctrl + scroll", desc: "Zoom canvas" },
  ]},
  { group: "Canvas", items: [
    { key: "Desktop / Mobile", desc: "Switch viewport in toolbar" },
    { key: "50% – 200%", desc: "Zoom preset buttons in toolbar" },
  ]},
];

function ShortcutsGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 w-80 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Keyboard className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Keyboard Shortcuts</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>
      <div className="px-4 py-3 space-y-4 max-h-72 overflow-y-auto">
        {SHORTCUTS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {group}
            </p>
            <div className="space-y-1">
              {items.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground/80">{desc}</span>
                  <kbd className="shrink-0 font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/60 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   Layer Item (compact block row for layers panel)
   ================================================================ */

function LayerItem({
  block,
  index,
  isActive,
  isBusy,
  isFirst,
  isLast,
  viewportMode,
  dimmed,
  isDragging,
  isDropTarget,
  onSelect,
  onMove,
  onBanner,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  block: Block;
  index: number;
  isActive: boolean;
  isBusy: boolean;
  isFirst: boolean;
  isLast: boolean;
  viewportMode: ViewportMode;
  dimmed?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onSelect: () => void;
  onMove: (dir: "up" | "down") => void;
  onBanner: (b: Banner) => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
}) {
  const vis = visibilityLabel(block.data);
  const label = `${block.type}:${block.variant}`;

  return (
    <div
      draggable={!dimmed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", block.id);
        onDragStart?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd?.();
      }}
      onDragEnd={() => {
        onDragEnd?.();
      }}
      className={[
        "group rounded-md transition-all",
        dimmed ? "opacity-40" : "",
        isDragging ? "opacity-30" : "",
        isDropTarget ? "ring-2 ring-primary/40 ring-offset-1" : "",
        isActive
          ? "bg-primary/8 ring-1 ring-primary/20"
          : "hover:bg-muted/50",
      ].join(" ")}
    >
      {/* Main row */}
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left"
      >
        <span className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3 w-3" />
        </span>

        <span className="text-muted-foreground shrink-0">
          {blockIcon(block.type)}
        </span>

        <span
          className={[
            "flex-1 text-xs truncate",
            isActive ? "font-semibold text-foreground" : "text-foreground/80",
          ].join(" ")}
        >
          {label}
        </span>

        {/* Visibility dots */}
        <span className="flex items-center gap-1 shrink-0">
          <span
            className={
              vis.mobile
                ? "text-emerald-500"
                : "text-muted-foreground/30"
            }
          >
            <Smartphone className="h-2.5 w-2.5" />
          </span>
          <span
            className={
              vis.desktop
                ? "text-blue-500"
                : "text-muted-foreground/30"
            }
          >
            <Monitor className="h-2.5 w-2.5" />
          </span>
        </span>

        <span className="text-[10px] tabular-nums text-muted-foreground/60 shrink-0 w-4 text-right">
          {block.order}
        </span>
      </button>

      {/* Controls — show on active */}
      {isActive && (
        <div className="flex items-center gap-0.5 px-2 pb-1.5">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onMove("up")}
            disabled={isFirst || isBusy}
            title="Move up"
            type="button"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onMove("down")}
            disabled={isLast || isBusy}
            title="Move down"
            type="button"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>

          <div className="w-px h-3.5 bg-border mx-0.5" />

          <BlockVisibilityControls
            blockId={block.id}
            initial={block.data}
          />

          <div className="flex-1" />

          <DeleteBlockButton
            blockId={block.id}
            onResult={(r) =>
              onBanner({
                kind: r.ok ? "success" : "error",
                message: r.message ?? (r.ok ? "Done" : "Failed"),
              })
            }
          />
        </div>
      )}
    </div>
  );
}
