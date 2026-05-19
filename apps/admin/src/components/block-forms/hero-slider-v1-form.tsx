"use client";

import { useState, useRef, useEffect } from "react";
import type { BlockFormProps } from "./index";
import { arr, moveAt, removeAt, setAt } from "@/lib/array";
import { updatePath } from "@/lib/update-path";
import {
  splitTextElement,
  setGroupLock,
  getSlideText as getTextLocal,
  getSlideStyle,
  migrateSlideToAbsolute,
} from "./slide-layout-utils";
import {
  BlockLayoutSection,
  ImageUpload,
  InspectorField,
  InspectorInput,
  InspectorNumber,
  InspectorSection,
  InspectorSelect,
  InspectorTextarea,
  InspectorToggle,
} from "@/components/inspector";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Grid,
  GripVertical,
  Image,
  LayoutTemplate,
  Layers,
  Lock,
  MoreHorizontal,
  Plus,
  ScissorsLineDashed,
  SlidersHorizontal,
  Trash2,
  Type,
  Unlock,
} from "lucide-react";
import { SlideCanvas } from "./slide-canvas";
import {
  type Slide,
  type SlideTemplate,
  type PresetKey,
  type ElementStyle,
  type ElementStyleProfile,
  type HeroDesktopLayout,
  type HeroViewportProfileKey,
  type HeroTuningScope,
  type SlideExtra,
  type TypoClass,
  type BodyVariant,
  type CanvasGuidelines,
  type ClassicGridSettings,
  type StyleGuidelinesConfig,
  TEMPLATE_OPTIONS,
  PRESET_OPTIONS,
  FIT_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  ALIGN_OPTIONS,
  JUSTIFY_OPTIONS,
  TYPO_OPTIONS,
  BODY_VARIANT_OPTIONS,
  presetSlide,
  newSlide,
  getTypoOffset,
} from "./hero-slider-presets";

const ELEMENT_ALIGN_OPTIONS = [
  { value: "", label: "Inherit" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const MEDIA_ALIGN_OPTIONS = [
  { value: "", label: "Stretch (default)" },
  { value: "start", label: "Top" },
  { value: "center", label: "Center" },
  { value: "end", label: "Bottom" },
  { value: "stretch", label: "Stretch" },
];

const CENTER_MODE_OPTIONS = [
  { value: "1", label: "1", title: "Slide edge to media edge" },
  { value: "2", label: "2", title: "Outer margin to media edge" },
  { value: "3", label: "3", title: "Outer margin to gap boundary" },
  { value: "4", label: "4", title: "Slide edge to gap boundary" },
] as const;

const STAR_VARIANTS: { marker: string; label: string }[] = [
  { marker: "{{icon:star-v1}}", label: "v1" },
  { marker: "{{icon:star-dt}}", label: "dt" },
  { marker: "{{icon:star-v2}}", label: "v2" },
  { marker: "{{icon:star-v3}}", label: "v3" },
];

type ElementStyleField = Exclude<keyof ElementStyle, "viewportProfiles">;

function IconInsertBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const insert = (marker: string) => onChange((value ?? "") + marker);
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
      <span className="opacity-70">Insert ★:</span>
      {STAR_VARIANTS.map((s) => (
        <button
          key={s.marker}
          type="button"
          onClick={() => insert(s.marker)}
          className="px-1.5 py-0.5 rounded border border-border hover:bg-muted/50 transition-colors"
          title={`Insert ${s.marker}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function updateDesktopLayout(slide: Slide, patch: Record<string, string | boolean | undefined>) {
  return updatePath(slide, ["layout", "desktop"], {
    ...(slide?.layout?.desktop ?? {}),
    ...patch,
  });
}

function updateScopedDesktopLayout(
  slide: Slide,
  scope: HeroTuningScope,
  patch: Record<string, string | boolean | undefined>,
) {
  if (scope === "default") {
    return updateDesktopLayout(slide, patch);
  }

  return updatePath(slide, ["layout", "viewportProfiles", scope, "desktop"], {
    ...(slide?.layout?.viewportProfiles?.[scope]?.desktop ?? {}),
    ...patch,
  });
}

function getScopedDesktopLayout(slide: Slide, scope: HeroTuningScope): HeroDesktopLayout {
  if (scope === "default") return slide?.layout?.desktop ?? {};
  return slide?.layout?.viewportProfiles?.[scope]?.desktop ?? {};
}

function getScopeFallbackLayout(slide: Slide, scope: HeroTuningScope): HeroDesktopLayout {
  return scope === "default" ? {} : (slide?.layout?.desktop ?? {});
}

function getScopedElementStyle(style: ElementStyle | undefined, scope: HeroTuningScope): ElementStyle {
  if (scope === "default") return style ?? {};
  return style?.viewportProfiles?.[scope] ?? {};
}

function getScopeFallbackElementStyle(style: ElementStyle | undefined, scope: HeroTuningScope): ElementStyle {
  return scope === "default" ? {} : (style ?? {});
}

function updateScopedElementStyle(
  style: ElementStyle | undefined,
  scope: HeroTuningScope,
  patch: Partial<ElementStyleProfile>,
): ElementStyle {
  const base = style ?? {};

  if (scope === "default") {
    return { ...base, ...patch } as ElementStyle;
  }

  return {
    ...base,
    viewportProfiles: {
      ...(base.viewportProfiles ?? {}),
      [scope]: {
        ...(base.viewportProfiles?.[scope] ?? {}),
        ...patch,
      } as ElementStyleProfile,
    },
  } as ElementStyle;
}

function updateMobileLayout(slide: Slide, patch: Record<string, boolean | undefined>) {
  return updatePath(slide, ["layout", "mobile"], {
    ...(slide?.layout?.mobile ?? {}),
    ...patch,
  });
}

function updateMedia(
  slide: Slide,
  patch: Record<string, string | undefined>,
) {
  return {
    ...slide,
    media: {
      ...(slide?.media ?? {}),
      kind: "image" as const,
      ...patch,
    },
  };
}

export function HeroSliderV1Form({ blockId, value, onChange, viewMode, externalSelectedElementId }: BlockFormProps) {
  const slides: Slide[] = arr<Slide>(value?.slides);
  const options = value?.options ?? {};
  const canvasGuidelines: CanvasGuidelines = value?.canvasGuidelines ?? {};

  const showDots = options?.showDots !== false;
  const showArrows = options?.showArrows === true;
  const fillViewport = options?.fillViewport === true;
  const showGuides = options?.showGuides === true;
  const showElementGuides = options?.showElementGuides === true;
  const enableCanvasDrag = options?.enableCanvasDrag !== false;
  const autoPlayMs = Number(options?.autoPlayMs ?? 0);
  const inlineIconMargin = options?.inlineIconMargin ?? "";
  const inlineIconSize = options?.inlineIconSize ?? "";

  const set = (path: (string | number)[], v: unknown) =>
    onChange(updatePath(value, path, v));

  const requestAbsoluteConversion = (slideIndex: number) => {
    if (blockId) {
      window.dispatchEvent(new CustomEvent("hero-slider-convert-to-absolute", {
        detail: { blockId, slideIndex },
      }));
      return;
    }
    onChange({
      ...(value ?? {}),
      slides: setAt(slides, slideIndex, migrateSlideToAbsolute(slides[slideIndex])),
    });
  };

  return (
    <div>
      <InspectorSection
        title="Options"
        icon={<SlidersHorizontal className="h-3 w-3" />}
        defaultOpen={false}
      >
        <InspectorField label="Autoplay">
          <InspectorNumber
            value={autoPlayMs || undefined}
            onChange={(v) => set(["options", "autoPlayMs"], v ?? 0)}
            placeholder="0 = off, 3000 = 3s"
          />
        </InspectorField>

        <InspectorToggle
          label="Dots"
          checked={showDots}
          onChange={(v) => set(["options", "showDots"], v)}
        />
        <InspectorToggle
          label="Arrows"
          checked={showArrows}
          onChange={(v) => set(["options", "showArrows"], v)}
        />
        <InspectorToggle
          label="Fill viewport height"
          checked={fillViewport}
          onChange={(v) => set(["options", "fillViewport"], v)}
        />
        <InspectorToggle
          label="Show guidelines"
          checked={showGuides}
          onChange={(v) => set(["options", "showGuides"], v || undefined)}
        />
        <InspectorToggle
          label="Show element guidelines"
          checked={showElementGuides}
          onChange={(v) => set(["options", "showElementGuides"], v || undefined)}
        />
        <InspectorToggle
          label="Canvas drag editing"
          checked={enableCanvasDrag}
          onChange={(v) => set(["options", "enableCanvasDrag"], v === false ? false : undefined)}
        />
        <InspectorToggle
          label="Composition guides"
          checked={!!options?.compositionGuides}
          onChange={(v) => set(["options", "compositionGuides"], v || undefined)}
        />
        {options?.compositionGuides ? (
          <InspectorField label="Guide color">
            <InspectorInput
              value={options?.compositionGuideColor ?? ""}
              onChange={(v) => set(["options", "compositionGuideColor"], v || undefined)}
              placeholder="rgba(0,200,100,0.8)"
            />
          </InspectorField>
        ) : null}
        <InspectorToggle
          label="Layout guides"
          checked={!!options?.showLayoutGuides}
          onChange={(v) => set(["options", "showLayoutGuides"], v || undefined)}
        />
        {options?.showLayoutGuides ? (
          <InspectorField label="Bottom offset" hint="Distance from slide bottom (e.g. 120px)">
            <InspectorInput
              value={options?.layoutGuideBottomOffset ?? ""}
              onChange={(v) => set(["options", "layoutGuideBottomOffset"], v || undefined)}
              placeholder="120px"
            />
          </InspectorField>
        ) : null}

        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Star size" hint="width/height of inline star icons (e.g. 0.9em, 24px)">
            <InspectorInput
              value={inlineIconSize}
              onChange={(v) => set(["options", "inlineIconSize"], v || undefined)}
              placeholder="0.9em"
            />
          </InspectorField>
          <InspectorField label="Star margin" hint="margin around inline stars (e.g. 0 0.1em, 0 8px)">
            <InspectorInput
              value={inlineIconMargin}
              onChange={(v) => set(["options", "inlineIconMargin"], v || undefined)}
              placeholder="0 0.1em"
            />
          </InspectorField>
        </div>

        {/* Figma / design-guideline grid */}
        <InspectorSection
          title="Figma Guideline Grid"
          icon={<Grid className="h-3 w-3" />}
          defaultOpen={false}
        >
          <p className="text-[10px] text-muted-foreground/70 mb-1">
            Named design guidelines shown on the canvas. Set pixel offsets to match Figma specs.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorField label="Gap guide (px from top)" hint="Amber dashed line">
              <InspectorNumber
                value={canvasGuidelines.gapOffset ?? undefined}
                onChange={(v) => set(["canvasGuidelines", "gapOffset"], v ?? undefined)}
                placeholder="e.g. 80"
              />
            </InspectorField>
            <InspectorField label="Baseline (px from bottom)" hint="Purple dashed line; elements snap to it">
              <InspectorNumber
                value={canvasGuidelines.baselineOffset ?? undefined}
                onChange={(v) => set(["canvasGuidelines", "baselineOffset"], v ?? undefined)}
                placeholder="e.g. 23"
              />
            </InspectorField>
            <InspectorField label="Italic baseline (px from bottom)" hint="Teal dashed line — lowest allowed italic design-element position">
              <InspectorNumber
                value={canvasGuidelines.italicBaselineOffset ?? undefined}
                onChange={(v) => set(["canvasGuidelines", "italicBaselineOffset"], v ?? undefined)}
                placeholder="e.g. 18"
              />
            </InspectorField>
          </div>
        </InspectorSection>

        {/* Classic design grid */}
        <InspectorSection
          title="Classic Design Grid"
          icon={<Grid className="h-3 w-3" />}
          defaultOpen={false}
        >
          <InspectorToggle
            label="Show classic grid"
            checked={!!(canvasGuidelines.classicGrid?.enabled)}
            onChange={(v) => set(["canvasGuidelines", "classicGrid", "enabled"], v || undefined)}
          />
          {canvasGuidelines.classicGrid?.enabled && (
            <>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <InspectorField label="Columns">
                  <InspectorNumber
                    value={canvasGuidelines.classicGrid?.columns ?? undefined}
                    onChange={(v) => set(["canvasGuidelines", "classicGrid", "columns"], v ?? 6)}
                    placeholder="6"
                  />
                </InspectorField>
                <InspectorField label="Rows">
                  <InspectorNumber
                    value={canvasGuidelines.classicGrid?.rows ?? undefined}
                    onChange={(v) => set(["canvasGuidelines", "classicGrid", "rows"], v ?? 4)}
                    placeholder="4"
                  />
                </InspectorField>
              </div>
              <InspectorToggle
                label="Show horizontal center line"
                checked={!!(canvasGuidelines.classicGrid?.showHorizontalCenter)}
                onChange={(v) => set(["canvasGuidelines", "classicGrid", "showHorizontalCenter"], v || undefined)}
              />
              <InspectorField label="Line color" hint="CSS color (default: cornflower blue)">
                <InspectorInput
                  value={canvasGuidelines.classicGrid?.color ?? ""}
                  onChange={(v) => set(["canvasGuidelines", "classicGrid", "color"], v || undefined)}
                  placeholder="rgba(100,149,237,0.35)"
                />
              </InspectorField>
              <InspectorField label="Outer margin (px)" hint="Columns inset from each side in design-canvas px (1440 basis, e.g. 80)">
                <InspectorNumber
                  value={canvasGuidelines.classicGrid?.marginPx ?? undefined}
                  onChange={(v) => set(["canvasGuidelines", "classicGrid", "marginPx"], v ?? undefined)}
                  placeholder="0"
                />
              </InspectorField>
              <InspectorToggle
                label="Show margin edge lines"
                checked={!!(canvasGuidelines.classicGrid?.showMarginLines)}
                onChange={(v) => set(["canvasGuidelines", "classicGrid", "showMarginLines"], v || undefined)}
              />
            </>
          )}
        </InspectorSection>

        {/* Custom guide lines — full-page vertical & full-slider horizontal */}
        <InspectorSection
          title="Custom Guide Lines"
          icon={<Grid className="h-3 w-3" />}
          defaultOpen={false}
        >
          <p className="text-[10px] text-muted-foreground/70 mb-1">
            Optional single-line guides. Vertical spans the full page height; horizontal spans the full slider width.
          </p>
          <InspectorField label="Vertical line position" hint="CSS left value, e.g. 50%, 720px">
            <InspectorInput
              value={canvasGuidelines.globalVerticalGuide ?? ""}
              onChange={(v) => set(["canvasGuidelines", "globalVerticalGuide"], v || undefined)}
              placeholder="e.g. 50%"
            />
          </InspectorField>
          <InspectorField label="Vertical line color">
            <InspectorInput
              value={canvasGuidelines.globalVerticalGuideColor ?? ""}
              onChange={(v) => set(["canvasGuidelines", "globalVerticalGuideColor"], v || undefined)}
              placeholder="rgba(239, 68, 68, 0.9)"
            />
          </InspectorField>
          <InspectorField label="Horizontal line position" hint="CSS top value within slider, e.g. 50%, 200px">
            <InspectorInput
              value={canvasGuidelines.sliderHorizontalGuide ?? ""}
              onChange={(v) => set(["canvasGuidelines", "sliderHorizontalGuide"], v || undefined)}
              placeholder="e.g. 50%"
            />
          </InspectorField>
          <InspectorField label="Horizontal line color">
            <InspectorInput
              value={canvasGuidelines.sliderHorizontalGuideColor ?? ""}
              onChange={(v) => set(["canvasGuidelines", "sliderHorizontalGuideColor"], v || undefined)}
              placeholder="rgba(239, 68, 68, 0.9)"
            />
          </InspectorField>
        </InspectorSection>

        {/* Stylistic guidelines overlay */}
        <InspectorSection
          title="Style Guidelines"
          icon={<Layers className="h-3 w-3" />}
          defaultOpen={false}
        >
          <p className="text-[10px] text-muted-foreground/70 mb-1">
            Layout helper lines for photo placement, text fields, and italic limits. Color-coded for client review.
          </p>
          <InspectorToggle
            label="Show style guidelines"
            checked={!!options?.showStyleGuides}
            onChange={(v) => set(["options", "showStyleGuides"], v || undefined)}
          />
          {!!options?.showStyleGuides && (() => {
            const sg: StyleGuidelinesConfig = canvasGuidelines.styleGuidelines ?? {};
            const setSg = (path: (string | number)[], v: unknown) =>
              set(["canvasGuidelines", "styleGuidelines", ...path], v);
            return (
              <>
                <p className="text-[10px] text-muted-foreground/60 mt-1 mb-0.5">
                  🔴 Boundaries &nbsp;🔵 Photo margins &nbsp;🟢 Inner offsets &nbsp;🟣 Photo edges &nbsp;🟡 Italic limit
                </p>
                <InspectorToggle
                  label="① ② Slide boundaries"
                  checked={sg.showBoundaries !== false}
                  onChange={(v) => setSg(["showBoundaries"], v ? undefined : false)}
                />
                <InspectorToggle
                  label="③ ④ Photo margin guides"
                  checked={sg.showPhotoMargins !== false}
                  onChange={(v) => setSg(["showPhotoMargins"], v ? undefined : false)}
                />
                {sg.showPhotoMargins !== false && (
                  <div className="grid grid-cols-2 gap-1.5 pl-2">
                    <InspectorField label="③ Left margin (px)" hint="Design-canvas px from left edge (1440 basis)">
                      <InspectorNumber
                        value={sg.photoMarginLeft ?? undefined}
                        onChange={(v) => setSg(["photoMarginLeft"], v ?? undefined)}
                        placeholder="e.g. 80"
                      />
                    </InspectorField>
                    <InspectorField label="④ Right margin (px)" hint="Design-canvas px from right edge">
                      <InspectorNumber
                        value={sg.photoMarginRight ?? undefined}
                        onChange={(v) => setSg(["photoMarginRight"], v ?? undefined)}
                        placeholder="e.g. 80"
                      />
                    </InspectorField>
                  </div>
                )}
                <InspectorToggle
                  label="⑤ ⑥ Photo inner offset guides"
                  checked={sg.showPhotoInnerOffsets !== false}
                  onChange={(v) => setSg(["showPhotoInnerOffsets"], v ? undefined : false)}
                />
                {sg.showPhotoInnerOffsets !== false && (
                  <div className="grid grid-cols-2 gap-1.5 pl-2">
                    <InspectorField label="⑤ Inner offset left (px)" hint="Layout px inward from photo left edge">
                      <InspectorNumber
                        value={sg.photoInnerOffsetLeft ?? undefined}
                        onChange={(v) => setSg(["photoInnerOffsetLeft"], v ?? undefined)}
                        placeholder="e.g. 40"
                      />
                    </InspectorField>
                    <InspectorField label="⑥ Inner offset right (px)" hint="Layout px inward from photo right edge">
                      <InspectorNumber
                        value={sg.photoInnerOffsetRight ?? undefined}
                        onChange={(v) => setSg(["photoInnerOffsetRight"], v ?? undefined)}
                        placeholder="e.g. 40"
                      />
                    </InspectorField>
                  </div>
                )}
                <InspectorToggle
                  label="⑦ ⑧ Photo top/bottom edge guides"
                  checked={sg.showPhotoEdges !== false}
                  onChange={(v) => setSg(["showPhotoEdges"], v ? undefined : false)}
                />
                <InspectorToggle
                  label="⑨ Italic text lower-limit guide"
                  checked={sg.showItalicLimit !== false}
                  onChange={(v) => setSg(["showItalicLimit"], v ? undefined : false)}
                />
                {sg.showItalicLimit !== false && (
                  <InspectorField label="⑨ Italic limit (px from bottom)" hint="Design-canvas px from bottom (574 basis). Falls back to Figma italic baseline if not set.">
                    <InspectorNumber
                      value={sg.italicLimitOffset ?? undefined}
                      onChange={(v) => setSg(["italicLimitOffset"], v ?? undefined)}
                      placeholder="e.g. 60"
                    />
                  </InspectorField>
                )}
                <InspectorToggle
                  label="Vertical center of text area"
                  checked={!!sg.showTextCenterV}
                  onChange={(v) => setSg(["showTextCenterV"], v || undefined)}
                />
                <InspectorToggle
                  label="Horizontal center of text area"
                  checked={!!sg.showTextCenterH}
                  onChange={(v) => setSg(["showTextCenterH"], v || undefined)}
                />
                <InspectorToggle
                  label={(() => {
                    const t = slides[0]?.template ?? "copy-left-image-right";
                    return t === "image-left-copy-right"
                      ? "🩵 Right alignment for text"
                      : "🩵 Left alignment for text";
                  })()}
                  checked={!!sg.showMediaGap}
                  onChange={(v) => setSg(["showMediaGap"], v || undefined)}
                />
                <InspectorToggle
                  label="🟡 Media edge guides (inner: vertical / outer: vertical + horizontal)"
                  checked={!!sg.showMediaEdgeGuides}
                  onChange={(v) => setSg(["showMediaEdgeGuides"], v || undefined)}
                />
                <InspectorToggle
                  label="🟢 Canvas center vertical"
                  checked={!!sg.showColumnCenter}
                  onChange={(v) => setSg(["showColumnCenter"], v || undefined)}
                />
                {!!sg.showColumnCenter && (
                  <>
                    <InspectorField label="Center mode" hint="Which zone to bisect: 1=slide↔media, 2=margin↔media, 3=margin↔gap, 4=slide↔gap">
                      <select
                        className="w-full h-7 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        value={sg.columnCenterMode ?? 4}
                        onChange={(e) => setSg(["columnCenterMode"], Number(e.target.value) as 1 | 2 | 3 | 4)}
                      >
                        <option value={1}>1 — slide edge ↔ media (no gap)</option>
                        <option value={2}>2 — outer margin ↔ media (no gap)</option>
                        <option value={3}>3 — outer margin ↔ gap boundary</option>
                        <option value={4}>4 — slide edge ↔ gap boundary</option>
                      </select>
                    </InspectorField>
                    <InspectorField label="Outer margin (layout px)" hint="Outer text zone margin in layout px (default 13)">
                      <InspectorNumber
                        value={sg.columnCenterOuterMarginPx ?? undefined}
                        onChange={(v) => setSg(["columnCenterOuterMarginPx"], v ?? undefined)}
                        placeholder="13"
                      />
                    </InspectorField>
                  </>
                )}
              </>
            );
          })()}
        </InspectorSection>
      </InspectorSection>

      <InspectorSection
        title="Slides"
        icon={<Image className="h-3 w-3" />}
        badge={
          <span className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{slides.length}</span>
            <button
              type="button"
              onClick={() => set(["slides"], [...slides, newSlide()])}
              className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
            >
              <Plus className="h-3 w-3" />
            </button>
          </span>
        }
      >
        <div className="space-y-3">
          {slides.map((s, idx) => (
            <SlideEditor
              key={s.id ?? idx}
              slide={s}
              index={idx}
              total={slides.length}
              onChange={(next) => set(["slides"], setAt(slides, idx, next))}
              onRemove={() => set(["slides"], removeAt(slides, idx))}
              onMove={(dir) => set(["slides"], moveAt(slides, idx, dir))}
              onDuplicate={() => {
                const clone = { ...s, id: crypto?.randomUUID?.() ?? `slide-${Date.now()}` };
                const next = [...slides.slice(0, idx + 1), clone, ...slides.slice(idx + 1)];
                set(["slides"], next);
              }}
              enableCanvasDrag={enableCanvasDrag}
              tuningScope={viewMode === "ipadPro" ? "ipadPro" : "default"}
              canvasGuidelines={canvasGuidelines}
              onRequestAbsolute={() => requestAbsoluteConversion(idx)}
              externalSelectedElementId={externalSelectedElementId}
            />
          ))}
        </div>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SlideEditor — extracted sub-component for a single slide          */
/* ------------------------------------------------------------------ */

function SlideEditor({
  slide: s,
  index: idx,
  total,
  onChange,
  onRemove,
  onMove,
  onDuplicate,
  enableCanvasDrag,
  tuningScope,
  canvasGuidelines,
  onRequestAbsolute,
  externalSelectedElementId,
}: {
  slide: Slide;
  index: number;
  total: number;
  onChange: (next: Slide) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
  onDuplicate: () => void;
  enableCanvasDrag: boolean;
  tuningScope: HeroTuningScope;
  canvasGuidelines: CanvasGuidelines;
  onRequestAbsolute: () => void;
  externalSelectedElementId?: string | null;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [slideTab, setSlideTab] = useState<"text" | "layout" | "media" | "cta">("text");

  // Auto-expand this slide and switch to Text tab when an element is clicked
  useEffect(() => {
    if (externalSelectedElementId?.startsWith(`slide-${idx}-`)) {
      setCollapsed(false);
      setSlideTab("text");
    }
  }, [externalSelectedElementId, idx]);

  const desktop = getScopedDesktopLayout(s, tuningScope);
  const desktopFallback = getScopeFallbackLayout(s, tuningScope);
  const mobile = s?.layout?.mobile ?? {};
  const template = s?.template ?? "copy-left-image-right";
  const tuningScopeLabel = tuningScope === "ipadPro" ? "iPad Pro overrides" : "Desktop/default";
  const isAbsoluteSlide = s?.positioningMode === "absolute";

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  return (
    <div className={["rounded-md border transition-colors", s?.hidden ? "opacity-60" : ""].join(" ")}>
      {/* Slide header */}
      <div
        className="flex items-center gap-1 px-1 py-1 cursor-pointer select-none min-h-[36px] bg-muted/10 rounded-t-md border-b"
        onClick={() => setCollapsed((c) => !c)}
      >
        {/* Drag grip */}
        <div className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing px-0.5" onClick={e => e.stopPropagation()}>
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* Canvas toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowCanvas((v) => !v); }}
          className={["flex-shrink-0 p-0.5 rounded transition-colors", showCanvas ? "text-primary" : "text-muted-foreground hover:text-foreground"].join(" ")}
          title="Toggle canvas editor"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>

        {/* Label */}
        <span className={[
          "text-[11px] font-semibold text-muted-foreground truncate flex-1",
          s?.hidden ? "line-through opacity-60" : "",
        ].join(" ")}>
          {collapsed ? "▸" : "▾"} {idx + 1}. {s?.name || s?.title?.split("\n")[0] || template}
        </span>

        {/* 3-dot menu */}
        <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1 text-[12px]">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => { onMove("up"); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="h-3.5 w-3.5" /> Move up
              </button>
              <button
                type="button"
                disabled={idx === total - 1}
                onClick={() => { onMove("down"); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="h-3.5 w-3.5" /> Move down
              </button>
              <div className="my-1 border-t border-border/50" />
              <button
                type="button"
                onClick={() => { onChange({ ...s, hidden: !s?.hidden }); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted"
              >
                {s?.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {s?.hidden ? "Show" : "Hide"}
              </button>
              <button
                type="button"
                onClick={() => { onDuplicate(); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <div className="my-1 border-t border-border/50" />
              <button
                type="button"
                onClick={() => { onRemove(); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas editor — shown independently of collapsed state */}
      {showCanvas && (
        <div className="border-t px-2 py-2">
          {!isAbsoluteSlide && (
            <div className="mb-2 rounded-md border border-red-500/40 bg-red-500/10 p-2">
              <button
                type="button"
                className="w-full rounded-md bg-red-600 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm hover:bg-red-700"
                onClick={onRequestAbsolute}
              >
                Перенести на absolute
              </button>
              <p className="mt-1.5 text-[10px] leading-snug text-red-700">
                Конвертує поточні каскадні відступи у незалежні top/left координати для drag.
              </p>
            </div>
          )}
          <SlideCanvas
            slide={s}
            tuningScope={tuningScope}
            enableDrag={enableCanvasDrag && isAbsoluteSlide}
            onChange={onChange}
            gapOffset={canvasGuidelines.gapOffset}
            baselineOffset={canvasGuidelines.baselineOffset}
            italicBaselineOffset={canvasGuidelines.italicBaselineOffset}
          />
        </div>
      )}

      {!collapsed && (
        <div>
          {/* Absolute mode status */}
          <div className="px-2 pt-2">
            {!isAbsoluteSlide ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2">
                <button
                  type="button"
                  className="w-full rounded-md bg-red-600 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm hover:bg-red-700"
                  onClick={onRequestAbsolute}
                >
                  Перенести на absolute
                </button>
                <p className="mt-1.5 text-[10px] leading-snug text-red-700">
                  Старі слайди лишаються у flow, щоб вигляд збігався з сайтом. Натисни перед незалежним drag.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-medium text-emerald-700">
                <Check className="h-3 w-3" /> Absolute positioning enabled
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex gap-px px-2 pt-2 pb-0">
            {(["text", "layout", "media", "cta"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSlideTab(tab)}
                className={[
                  "flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide rounded-sm transition-all",
                  slideTab === tab
                    ? "bg-sky-500/15 text-sky-600"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                ].join(" ")}
              >
                {tab === "text" ? "Text" : tab === "layout" ? "Layout" : tab === "media" ? "Media" : "CTA"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-2 space-y-2">

            {/* ── TEXT tab ── */}
            {slideTab === "text" && (
              <TextElementsEditor
                slide={s}
                tuningScope={tuningScope}
                onChange={onChange}
                externalSelectedElementId={externalSelectedElementId}
              />
            )}

            {/* ── LAYOUT tab ── */}
            {slideTab === "layout" && (
              <div className="space-y-2">
                <InspectorField label="Slide name">
                  <InspectorInput
                    value={s?.name ?? ""}
                    onChange={(v) => onChange({ ...s, name: v || undefined })}
                    placeholder={s?.title?.split("\n")[0] || template}
                  />
                </InspectorField>

                <InspectorField label="Preset" stacked>
                  <InspectorSelect
                    value=""
                    onChange={(v) => {
                      const preset = presetSlide(v as PresetKey);
                      onChange({ id: s.id, name: s.name, ...preset } as Slide);
                    }}
                    options={[{ value: "", label: "Select preset..." }, ...PRESET_OPTIONS]}
                  />
                </InspectorField>

                <InspectorField label="Layout">
                  <InspectorSelect
                    value={template}
                    onChange={(v) => onChange({ ...s, template: v as SlideTemplate })}
                    options={TEMPLATE_OPTIONS}
                  />
                </InspectorField>

                <InspectorSection title="Slide options" icon={<SlidersHorizontal className="h-3 w-3" />} defaultOpen={false}>
                  <InspectorField label="Autoplay (this slide)" hint="ms — overrides global. Empty/0 = use global.">
                    <InspectorNumber
                      value={s?.autoPlayMs || undefined}
                      onChange={(v) => onChange({ ...s, autoPlayMs: v ?? 0 })}
                      placeholder="3000"
                    />
                  </InspectorField>
                  <div className="space-y-1.5">
                    <InspectorToggle label="Hidden" checked={!!s?.hidden} onChange={(v) => onChange({ ...s, hidden: v || undefined })} />
                    <InspectorToggle label="Mirror layout (swap media ↔ text)" checked={!!s?.mirror} onChange={(v) => onChange({ ...s, mirror: v || undefined })} />
                    <InspectorToggle label="Stretch text to media height" checked={!!s?.stretchTextToMedia} onChange={(v) => onChange({ ...s, stretchTextToMedia: v || undefined })} />
                  </div>
                </InspectorSection>

                <InspectorSection title={`Desktop Tuning - ${tuningScopeLabel}`} icon={<LayoutTemplate className="h-3 w-3" />} defaultOpen={false}>
                  {tuningScope === "ipadPro" && (
                    <p className="text-[10px] text-muted-foreground/80">Editing iPad Pro-only layout values. Empty fields inherit Desktop/default.</p>
                  )}
                  <div className="mb-1.5">
                    <div className="mb-1 text-xs text-muted-foreground">Padding</div>
                    <InspectorInput value={desktop?.padding ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { padding: v }))} placeholder={desktopFallback.padding ?? "10px 0"} />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Media width</div>
                      <InspectorInput value={desktop?.mediaWidth ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaWidth: v }))} placeholder={desktopFallback.mediaWidth ?? "40%"} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Text width</div>
                      <InspectorInput value={desktop?.textWidth ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { textWidth: v }))} placeholder={desktopFallback.textWidth ?? "92%"} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Offset X</div>
                      <InspectorInput value={desktop?.contentOffsetX ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { contentOffsetX: v }))} placeholder={desktopFallback.contentOffsetX ?? "0px"} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Offset Y</div>
                      <InspectorInput value={desktop?.contentOffsetY ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { contentOffsetY: v }))} placeholder={desktopFallback.contentOffsetY ?? "0px"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Title size</div>
                      <InspectorInput value={desktop?.titleSize ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { titleSize: v }))} placeholder={desktopFallback.titleSize ?? "clamp(54px, 5.5vw, 84px)"} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Tagline size</div>
                      <InspectorInput value={desktop?.subtitleSize ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { subtitleSize: v }))} placeholder={desktopFallback.subtitleSize ?? "clamp(20px, 2vw, 30px)"} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Kicker size</div>
                      <InspectorInput value={desktop?.kickerSize ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { kickerSize: v }))} placeholder={desktopFallback.kickerSize ?? "clamp(22px, 1.8vw, 28px)"} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">Body size</div>
                      <InspectorInput value={desktop?.bodySize ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { bodySize: v }))} placeholder={desktopFallback.bodySize ?? "clamp(13px, 1vw, 15px)"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <InspectorField label="Align">
                      <InspectorSelect value={desktop?.textAlign ?? "center"} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { textAlign: v }))} options={ALIGN_OPTIONS} />
                    </InspectorField>
                    <InspectorField label="Justify">
                      <InspectorSelect value={desktop?.contentJustify ?? "center"} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { contentJustify: v }))} options={JUSTIFY_OPTIONS} />
                    </InspectorField>
                  </div>
                  <InspectorToggle label="Align text ignoring gap" checked={!!desktop?.textAlignFullWidth} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { textAlignFullWidth: v || undefined }))} />
                  <InspectorToggle label="Ignore gap while dragging" checked={!!desktop?.dragIgnoreGap} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { dragIgnoreGap: v || undefined }))} />
                  <InspectorToggle label="Mobile: image first" checked={!!mobile?.imageFirst} onChange={(v) => onChange(updateMobileLayout(s, { imageFirst: v }))} />
                </InspectorSection>
              </div>
            )}

            {/* ── MEDIA tab ── */}
            {slideTab === "media" && (
              <div className="space-y-2">
                <MediaFields label="Image" media={s?.media} onChange={(patch) => onChange(updateMedia(s, patch))} />
                <div className="grid grid-cols-2 gap-1.5">
                  <InspectorField label="Gap to text" hint="Space between media and text column">
                    <InspectorInput value={desktop?.gap ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { gap: v }))} placeholder={desktopFallback.gap ?? "42px"} />
                  </InspectorField>
                  <InspectorField label="Outer padding" hint="Centering modes 2 & 4">
                    <InspectorInput value={desktop?.outerPadding ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { outerPadding: v || undefined }))} placeholder={desktopFallback.outerPadding ?? "0px"} />
                  </InspectorField>
                  <InspectorField label="Media padding">
                    <InspectorInput value={desktop?.mediaPadding ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaPadding: v }))} placeholder={desktopFallback.mediaPadding ?? "0 10px 30px 0"} />
                  </InspectorField>
                  <InspectorField label="Media height">
                    <InspectorInput value={desktop?.mediaHeight ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaHeight: v }))} placeholder={desktopFallback.mediaHeight ?? "auto"} />
                  </InspectorField>
                  <InspectorField label="Media vertical align">
                    <InspectorSelect value={desktop?.mediaAlign ?? ""} onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaAlign: v || undefined }))} options={MEDIA_ALIGN_OPTIONS} />
                  </InspectorField>
                </div>
              </div>
            )}

            {/* ── CTA tab ── */}
            {slideTab === "cta" && (
              <div className="space-y-2">
                <InspectorToggle
                  label="Enable link"
                  checked={s?.cta?.enabled === true || (s?.cta?.enabled == null && !!s?.cta?.href)}
                  onChange={(v) => onChange({ ...s, cta: { ...s?.cta, enabled: v ? true : false } })}
                />
                {(s?.cta?.enabled === true || (s?.cta?.enabled == null && !!s?.cta?.href)) && (
                  <>
                    <InspectorField label="Label">
                      <InspectorInput value={s?.cta?.label ?? ""} onChange={(v) => onChange({ ...s, cta: { ...s?.cta, label: v } })} />
                    </InspectorField>
                    <div className="grid grid-cols-2 gap-1.5">
                      <InspectorField label="Href">
                        <InspectorInput value={s?.cta?.href ?? ""} onChange={(v) => onChange({ ...s, cta: { ...s?.cta, href: v } })} />
                      </InspectorField>
                      <InspectorField label="Open in">
                        <InspectorSelect
                          value={s?.cta?.target ?? "_self"}
                          onChange={(v) => onChange({ ...s, cta: { ...s?.cta, target: (v as "_self" | "_blank") || undefined } })}
                          options={[{ value: "_self", label: "Same tab" }, { value: "_blank", label: "New tab" }]}
                        />
                      </InspectorField>
                    </div>
                    <InspectorField label="Align">
                      <InspectorSelect value={s.ctaStyle?.align ?? ""} onChange={(v) => onChange({ ...s, ctaStyle: { ...s.ctaStyle, align: v || undefined } as any })} options={[{ value: "", label: "Auto" }, ...ALIGN_OPTIONS]} />
                    </InspectorField>
                  </>
                )}
                {s?.cta?.enabled === false && s?.cta?.href && (
                  <p className="text-[10px] text-muted-foreground/60">Saved: {s.cta.href}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ElementStyleEditor — per-element margin/align controls             */
/* ------------------------------------------------------------------ */

function ElementStyleEditor({
  label,
  style,
  onChange,
  showTypo = false,
  showSnap = false,
  tuningScope = "default",
}: {
  label: string;
  style?: ElementStyle;
  onChange: (next: ElementStyle) => void;
  showTypo?: boolean;
  showSnap?: boolean;
  tuningScope?: HeroTuningScope;
}) {
  const s = getScopedElementStyle(style, tuningScope);
  const fallback = getScopeFallbackElementStyle(style, tuningScope);
  const patch = (key: ElementStyleField, v: string) =>
    onChange(updateScopedElementStyle(style, tuningScope, { [key]: v || undefined } as Partial<ElementStyleProfile>));
  const patchAlign = (v: string) => {
    const align = (v || undefined) as ElementStyleProfile["align"] | undefined;
    onChange(updateScopedElementStyle(style, tuningScope, {
      align,
      alignMode: align === "center" ? "1" : undefined,
    }));
  };

  return (
    <div className="space-y-1">
      {label ? (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}{tuningScope === "ipadPro" ? " - iPad" : ""}
        </span>
      ) : null}
      {showTypo && (
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Typography</div>
          <InspectorSelect
            value={s.typo ?? ""}
            onChange={(v) => patch("typo", v)}
            options={TYPO_OPTIONS}
          />
        </div>
      )}
      <div className="grid grid-cols-4 gap-1">
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Top</div>
          <InspectorInput
            value={s.mt ?? ""}
            onChange={(v) => patch("mt", v)}
            placeholder={fallback.mt ?? "0"}
          />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Bottom</div>
          <InspectorInput
            value={s.mb ?? ""}
            onChange={(v) => patch("mb", v)}
            placeholder={fallback.mb ?? "0"}
          />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Left</div>
          <InspectorInput
            value={s.ml ?? ""}
            onChange={(v) => patch("ml", v)}
            placeholder={fallback.ml ?? "0"}
          />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Right</div>
          <InspectorInput
            value={s.mr ?? ""}
            onChange={(v) => patch("mr", v)}
            placeholder={fallback.mr ?? "0"}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Align</div>
          <InspectorSelect
            value={s.align ?? ""}
            onChange={patchAlign}
            options={ELEMENT_ALIGN_OPTIONS}
          />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Size</div>
          <InspectorInput
            value={s.size ?? ""}
            onChange={(v) => patch("size", v)}
            placeholder={fallback.size ?? "inherit"}
          />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Stroke</div>
          <InspectorInput
            value={s.strokeW ?? ""}
            onChange={(v) => patch("strokeW", v)}
            placeholder={fallback.strokeW ?? "3.6px"}
          />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Spacing</div>
          <InspectorInput
            value={s.letterSpacing ?? ""}
            onChange={(v) => patch("letterSpacing", v)}
            placeholder={fallback.letterSpacing ?? "0"}
          />
        </div>
      </div>
      {s.align === "center" && (
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Center mode</div>
          <div className="flex gap-1">
            {CENTER_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.title}
                onClick={() => patch("alignMode", s.alignMode === option.value ? "" : option.value)}
                className={`flex-1 rounded text-[11px] py-0.5 border transition-colors ${s.alignMode === option.value ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {showSnap && tuningScope === "default" && (
        <InspectorToggle
          label="Snap to baseline"
          checked={!!(style?.snapToBaseline)}
          onChange={(v) => onChange({ ...(style ?? {}), snapToBaseline: v || undefined })}
        />
      )}
      <InspectorToggle
        label="Lock position"
        checked={!!(style?.locked)}
        onChange={(v) => onChange({ ...(style ?? {}), locked: v || undefined })}
      />
      {showTypo && !!getTypoOffset(s.typo) && (
        <InspectorToggle
          label="Apply font offset"
          checked={!!(style?.useFontOffset)}
          onChange={(v) => onChange({ ...(style ?? {}), useFontOffset: v || undefined })}
        />
      )}
    </div>
  );
}

/** Apply a partial style patch to any element identified by key. Always operates on the root style (not viewport profiles). */
function applyStylePatch(slide: Slide, key: string, patch: Partial<ElementStyle>): Slide {
  const extrasArr = Array.isArray(slide.extras) ? slide.extras : [];
  if (key === "title") return { ...slide, titleStyle: { ...(slide.titleStyle ?? {}), ...patch } as ElementStyle };
  if (key === "subtitle") return { ...slide, subtitleStyle: { ...(slide.subtitleStyle ?? {}), ...patch } as ElementStyle };
  if (key === "kicker") return { ...slide, kickerStyle: { ...(slide.kickerStyle ?? {}), ...patch } as ElementStyle };
  if (key === "body") return { ...slide, bodyStyle: { ...(slide.bodyStyle ?? {}), ...patch } as ElementStyle };
  if (key === "quote") return { ...slide, quoteStyle: { ...(slide.quoteStyle ?? {}), ...patch } as ElementStyle };
  return {
    ...slide,
    extras: extrasArr.map(e => e.id === key ? { ...e, style: { ...(e.style ?? {}), ...patch } as ElementStyle } : e),
  };
}

/** Like applyStylePatch but also writes patch into the given viewport profile so viewport overrides don't win. */
function applyStylePatchViewport(
  slide: Slide,
  key: string,
  patch: Partial<ElementStyle>,
  viewMode: "desktop" | "ipadPro" | "mobile",
): Slide {
  const profile = viewMode === "ipadPro" ? "ipadPro" : null;
  let updated = applyStylePatch(slide, key, patch);
  if (!profile) return updated;
  const rawStyle = (
    key === "title" ? updated.titleStyle :
    key === "subtitle" ? updated.subtitleStyle :
    key === "kicker" ? updated.kickerStyle :
    key === "body" ? updated.bodyStyle :
    key === "quote" ? updated.quoteStyle :
    (Array.isArray(updated.extras) ? updated.extras : []).find(e => e.id === key)?.style
  ) as ElementStyle | undefined;
  if (!rawStyle) return updated;
  const withProfile = {
    ...rawStyle,
    viewportProfiles: {
      ...(rawStyle.viewportProfiles ?? {}),
      [profile]: {
        ...((rawStyle.viewportProfiles as any)?.[profile] ?? {}),
        ...patch,
      },
    },
  } as ElementStyle;
  return applyStylePatch(updated, key, withProfile);
}

/* ------------------------------------------------------------------ */
/*  TextElementsEditor — unified reorderable list of all text elements */
/* ------------------------------------------------------------------ */

const EXTRA_KIND_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "tagline", label: "Tagline (oblique)" },
  { value: "kicker", label: "Kicker" },
  { value: "stamp", label: "Stamp" },
];

const FIXED_ELEMENT_LABELS: Record<string, string> = {
  quote: "Quote",
  kicker: "Kicker",
  title: "Title",
  subtitle: "Tagline",
  body: "Body",
};

function TextElementsEditor({
  slide: s,
  tuningScope,
  onChange,
  externalSelectedElementId,
}: {
  slide: Slide;
  tuningScope: HeroTuningScope;
  onChange: (next: Slide) => void;
  externalSelectedElementId?: string | null;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  // Accordion: only one card open at a time
  const [openKey, setOpenKey] = useState<string | null>(null);

  // When canvas element is clicked, open its card and collapse others.
  // externalSelectedElementId is "slide-N-key" — strip the prefix to get the card key.
  useEffect(() => {
    if (!externalSelectedElementId) return;
    const key = externalSelectedElementId.replace(/^slide-\d+-/, "");
    setOpenKey(key);
  }, [externalSelectedElementId]);
  const dragIdxRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const extras = Array.isArray(s?.extras) ? s.extras : [];

  const activeFixed: string[] = [];
  if (s?.kicker !== undefined) activeFixed.push("kicker");
  if (s?.title !== undefined) activeFixed.push("title");
  if (s?.subtitle !== undefined) activeFixed.push("subtitle");
  if (s?.body !== undefined) activeFixed.push("body");
  if (s?.quote !== undefined) activeFixed.push("quote");

  const extraKeys = extras.map((e, i) => e.id ?? String(i));
  const allKeys = [...activeFixed, ...extraKeys];
  const allKeysSet = new Set(allKeys);

  const stored = s?.elementOrder ?? [];
  const orderedKeys = [
    ...stored.filter(k => allKeysSet.has(k)),
    ...allKeys.filter(k => !stored.includes(k)),
  ];

  const moveElement = (idx: number, dir: "up" | "down") => {
    const next = [...orderedKeys];
    const target = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...s, elementOrder: next });
  };

  const reorderElement = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const next = [...orderedKeys];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange({ ...s, elementOrder: next });
  };

  const removeExtra = (id: string) => {
    const newExtras = extras.filter(e => e.id !== id);
    const newOrder = orderedKeys.filter(k => k !== id);
    onChange({ ...s, extras: newExtras, elementOrder: newOrder.length ? newOrder : undefined });
  };

  const NAMED_FIELD_MAP: Record<string, keyof Slide> = {
    title: "title", kicker: "kicker", subtitle: "subtitle", body: "body", quote: "quote",
  };
  const NAMED_STYLE_MAP: Record<string, keyof Slide> = {
    title: "titleStyle", kicker: "kickerStyle", subtitle: "subtitleStyle", body: "bodyStyle", quote: "quoteStyle",
  };

  const removeNamedElement = (key: string) => {
    if (!(key in NAMED_FIELD_MAP)) return;
    const newOrder = orderedKeys.filter(k => k !== key);
    onChange({ ...s, [NAMED_FIELD_MAP[key]]: undefined, [NAMED_STYLE_MAP[key]]: undefined, elementOrder: newOrder.length ? newOrder : undefined });
  };

  const duplicateNamedElement = (key: string) => {
    const NAMED_KIND: Record<string, SlideExtra["kind"]> = {
      kicker: "kicker", title: "stamp", subtitle: "text", body: "text", quote: "text",
    };
    const textField = NAMED_FIELD_MAP[key];
    const styleField = NAMED_STYLE_MAP[key];
    if (!textField) return;
    const text = (s[textField] as string | undefined) ?? "";
    const style = s[styleField] as ElementStyle | undefined;
    const newId = crypto?.randomUUID?.() ?? `ex-${Date.now()}`;
    const newExtra: SlideExtra = { id: newId, kind: NAMED_KIND[key] ?? "text", text, style: style ? { ...style } : undefined };
    const insertAt = orderedKeys.indexOf(key) + 1;
    const newOrder = [...orderedKeys.slice(0, insertAt), newId, ...orderedKeys.slice(insertAt)];
    onChange({ ...s, extras: [...extras, newExtra], elementOrder: newOrder });
  };

  const addExtra = () => {
    const newExtra: SlideExtra = {
      id: crypto?.randomUUID?.() ?? `ex-${Date.now()}`,
      kind: "text",
      text: "",
    };
    onChange({
      ...s,
      extras: [...extras, newExtra],
      elementOrder: [...orderedKeys, newExtra.id!],
    });
  };

  const getAllStyles = (): ElementStyle[] =>
    [
      s.titleStyle, s.subtitleStyle, s.kickerStyle, s.bodyStyle, s.quoteStyle,
      ...extras.map(e => e.style),
    ].filter((st): st is ElementStyle => !!st);

  const allGroupIds = Array.from(
    new Set(getAllStyles().map(st => st.groupId).filter((g): g is string => !!g))
  );

  const getGroupKeys = (groupId: string): string[] => {
    const keys: string[] = [];
    if (s.titleStyle?.groupId === groupId) keys.push("title");
    if (s.subtitleStyle?.groupId === groupId) keys.push("subtitle");
    if (s.kickerStyle?.groupId === groupId) keys.push("kicker");
    if (s.bodyStyle?.groupId === groupId) keys.push("body");
    if (s.quoteStyle?.groupId === groupId) keys.push("quote");
    extras.forEach(e => { if (e.style?.groupId === groupId) keys.push(e.id!); });
    return keys;
  };

  const vMode = tuningScope === "ipadPro" ? "ipadPro" as const : "desktop" as const;

  const handleGroupAlign = (groupId: string, align: "left" | "center" | "right" | undefined) => {
    let updated = s;
    for (const key of getGroupKeys(groupId)) {
      updated = applyStylePatchViewport(updated, key, {
        align,
        alignMode: align === "center" ? "4" : undefined,
      }, vMode);
    }
    onChange(updated);
  };

  const handleGroupAlignMode = (groupId: string, mode: "1" | "2" | "3" | "4" | undefined) => {
    let updated = s;
    for (const key of getGroupKeys(groupId)) updated = applyStylePatchViewport(updated, key, { alignMode: mode }, vMode);
    onChange(updated);
  };

  // ── Select mode helpers ──────────────────────────────────────────────

  const exitSelectMode = () => { setSelectMode(false); setSelectedKeys(new Set()); };

  const toggleSelect = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleGroup = () => {
    const groupId = `grp-${Math.random().toString(36).slice(2, 6)}`;
    let updated = s;
    for (const key of selectedKeys) updated = applyStylePatch(updated, key, { groupId });
    onChange(updated);
    exitSelectMode();
  };

  const handleLockSelected = () => {
    const selArr = [...selectedKeys];
    const allLocked = selArr.every(key => !!(getSlideStyle(s, key)?.locked));
    let updated = s;
    for (const key of selArr) {
      updated = applyStylePatch(updated, key, { locked: allLocked ? undefined : true });
    }
    onChange(updated);
  };

  const handleRemoveGroup = (groupId: string) => {
    const keysInGroup: string[] = [];
    if (s.titleStyle?.groupId === groupId) keysInGroup.push("title");
    if (s.subtitleStyle?.groupId === groupId) keysInGroup.push("subtitle");
    if (s.kickerStyle?.groupId === groupId) keysInGroup.push("kicker");
    if (s.bodyStyle?.groupId === groupId) keysInGroup.push("body");
    if (s.quoteStyle?.groupId === groupId) keysInGroup.push("quote");
    extras.forEach(e => { if (e.style?.groupId === groupId) keysInGroup.push(e.id!); });
    let updated = s;
    for (const key of keysInGroup) updated = applyStylePatch(updated, key, { groupId: undefined });
    onChange(updated);
  };

  const selArr = [...selectedKeys];
  const selAllLocked = selArr.length > 0 && selArr.every(k => !!(getSlideStyle(s, k)?.locked));

  return (
    <div className="space-y-1.5">
      {/* Header row with Select toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Elements</span>
        <button
          type="button"
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          className={[
            "text-[11px] font-medium px-2 py-0.5 rounded transition-colors",
            selectMode
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {selectMode ? "Cancel" : "Select"}
        </button>
      </div>

      {orderedKeys.map((key, idx) => (
        <TextElementCard
          key={key}
          elementKey={key}
          slide={s}
          index={idx}
          total={orderedKeys.length}
          tuningScope={tuningScope}
          onChange={onChange}
          open={openKey === key}
          onOpenChange={(v) => setOpenKey(v ? key : null)}
          onMove={(dir) => moveElement(idx, dir)}
          onRemove={extraKeys.includes(key)
            ? () => removeExtra(key)
            : key in NAMED_FIELD_MAP ? () => removeNamedElement(key) : undefined}
          onDuplicate={extraKeys.includes(key)
            ? () => {
                const extra = extras.find(e => e.id === key)!;
                const newId = crypto?.randomUUID?.() ?? `ex-${Date.now()}`;
                const newExtra: SlideExtra = { ...extra, id: newId };
                const insertAt = orderedKeys.indexOf(key) + 1;
                const newOrder = [...orderedKeys.slice(0, insertAt), newId, ...orderedKeys.slice(insertAt)];
                onChange({ ...s, extras: [...extras, newExtra], elementOrder: newOrder });
              }
            : key in NAMED_FIELD_MAP ? () => duplicateNamedElement(key) : undefined}
          onToggleHidden={() => {
            const es = getSlideStyle(s, key);
            onChange(applyStylePatch(s, key, { hidden: es?.hidden ? undefined : true }));
          }}
          isHidden={!!(getSlideStyle(s, key)?.hidden)}
          selectMode={selectMode}
          isSelected={selectedKeys.has(key)}
          onToggleSelect={() => toggleSelect(key)}
          isDragOver={dragOverIdx === idx}
          onDragStart={() => { dragIdxRef.current = idx; }}
          onDragOver={() => setDragOverIdx(idx)}
          onDrop={() => {
            if (dragIdxRef.current !== null) reorderElement(dragIdxRef.current, idx);
            dragIdxRef.current = null;
            setDragOverIdx(null);
          }}
          onDragEnd={() => { dragIdxRef.current = null; setDragOverIdx(null); }}
        />
      ))}

      {/* Select mode action bar */}
      {selectMode ? (
        <div className="flex items-center gap-1.5 border-t pt-2 mt-1">
          <span className="text-[11px] text-muted-foreground flex-1">
            {selectedKeys.size} selected
          </span>
          {selectedKeys.size >= 2 && (
            <button
              type="button"
              onClick={handleGroup}
              className="text-[11px] font-medium px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
            >
              Group
            </button>
          )}
          {selectedKeys.size >= 1 && (
            <button
              type="button"
              onClick={handleLockSelected}
              className="flex items-center gap-0.5 text-[11px] font-medium px-2.5 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground"
            >
              {selAllLocked
                ? <><Unlock className="h-2.5 w-2.5 mr-0.5" />Unlock</>
                : <><Lock className="h-2.5 w-2.5 mr-0.5" />Lock</>
              }
            </button>
          )}
          <button
            type="button"
            onClick={exitSelectMode}
            className="text-[11px] font-medium px-2.5 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={addExtra}
          className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
        >
          <Plus className="h-2.5 w-2.5" /> Add text block
        </button>
      )}

      {/* Group controls — shown when any element has a groupId */}
      {!selectMode && allGroupIds.length > 0 && (
        <div className="mt-2 space-y-1 rounded border border-dashed border-border/60 p-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Groups</span>
          {allGroupIds.map((gid) => {
            const groupStyles = getAllStyles().filter(st => st.groupId === gid);
            const allLocked = groupStyles.every(st => st.locked);
            const anyLocked = groupStyles.some(st => st.locked);
            const groupAligns = groupStyles.map(st => st.align);
            const commonAlign = groupAligns.length > 0 && groupAligns.every(a => a === groupAligns[0]) ? groupAligns[0] : undefined;
            const groupModes = groupStyles.map(st => st.alignMode ?? "");
            const commonAlignMode = groupModes.every(m => m === groupModes[0]) ? groupModes[0] as ("1" | "2" | "3" | "4" | "") : "";
            return (
              <div key={gid} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                    #{gid}{" "}
                    <span className="text-[9px] text-muted-foreground/40">({groupStyles.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {anyLocked && !allLocked && (
                      <span className="text-[9px] text-amber-500">partial</span>
                    )}
                    <button
                      type="button"
                      title={allLocked ? "Unlock group" : "Lock group"}
                      onClick={() => onChange(setGroupLock(s, gid, !allLocked))}
                      className={[
                        "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium border",
                        allLocked
                          ? "border-amber-400/50 text-amber-500 hover:text-amber-400"
                          : "border-border/60 text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {allLocked
                        ? <><Unlock className="h-2.5 w-2.5" /> Unlock</>
                        : <><Lock className="h-2.5 w-2.5" /> Lock</>
                      }
                    </button>
                    <button
                      type="button"
                      title="Remove group"
                      onClick={() => handleRemoveGroup(gid)}
                      className="text-[12px] leading-none text-muted-foreground/40 hover:text-red-400 px-1 py-0.5 rounded"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground/50 mr-0.5">Align</span>
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      title={`Align ${a}`}
                      onClick={() => handleGroupAlign(gid, commonAlign === a ? undefined : a)}
                      className={[
                        "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                        commonAlign === a
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
                      ].join(" ")}
                    >
                      {a === "left" ? "≡L" : a === "center" ? "≡C" : "≡R"}
                    </button>
                  ))}
                </div>
                {commonAlign === "center" && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground/50 mr-0.5">Mode</span>
                    {CENTER_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        title={option.title}
                        onClick={() => handleGroupAlignMode(gid, commonAlignMode === option.value ? undefined : option.value)}
                        className={[
                          "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                          commonAlignMode === option.value
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function TextElementCard({
  elementKey,
  slide: s,
  index,
  total,
  tuningScope,
  onChange,
  open,
  onOpenChange,
  onMove,
  onRemove,
  onDuplicate,
  onToggleHidden,
  isHidden = false,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  elementKey: string;
  slide: Slide;
  index: number;
  total: number;
  tuningScope: HeroTuningScope;
  onChange: (next: Slide) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onMove: (dir: "up" | "down") => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onToggleHidden?: () => void;
  isHidden?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const extras = Array.isArray(s?.extras) ? s.extras : [];
  const extra = extras.find(e => e.id === elementKey);
  const isExtra = !!extra;
  const elementStyle = getSlideStyle(s, elementKey);
  const groupId = elementStyle?.groupId;

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const updateExtra = (patch: Partial<SlideExtra>) =>
    onChange({ ...s, extras: extras.map(e => e.id === elementKey ? { ...e, ...patch } : e) });

  const rawText = isExtra ? (extra?.text ?? "") : getTextLocal(s, elementKey);
  const canSplit = rawText.includes("\n") && rawText.split("\n").filter(l => l.trim()).length >= 2;

  const textForLabel = isExtra ? (extra?.text ?? "") : rawText;
  const label = textForLabel
    ? stripHtml(textForLabel).split("\n")[0].slice(0, 30) || (FIXED_ELEMENT_LABELS[elementKey] ?? elementKey)
    : (FIXED_ELEMENT_LABELS[elementKey] ?? elementKey);

  return (
    <div
      className={[
        "rounded border transition-colors",
        isSelected ? "bg-primary/5 border-primary/30" : "bg-muted/5",
        isHidden ? "opacity-50" : "",
        isDragOver ? "border-primary/60 bg-primary/5" : "",
      ].join(" ")}
      draggable={!selectMode}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver?.(); }}
      onDrop={(e) => { e.preventDefault(); onDrop?.(); }}
      onDragEnd={onDragEnd}
    >
      <div
        className="flex items-center gap-1 px-1 py-1 cursor-pointer select-none min-h-[36px]"
        onClick={() => selectMode ? onToggleSelect?.() : onOpenChange(!open)}
      >
        {/* Drag handle */}
        {!selectMode && (
          <div
            className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing px-0.5"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Checkbox (select mode) */}
        {selectMode && (
          <div className={[
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground/40",
          ].join(" ")}>
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        )}

        {/* Label */}
        <span className="text-[11px] font-semibold text-muted-foreground truncate flex-1">
          {!selectMode && (open ? "▾" : "▸")} {label}
          {groupId ? (
            <span className="ml-1.5 inline-flex items-center text-[9px] px-1 rounded bg-primary/10 text-primary/70 font-normal align-middle">
              #{groupId.slice(0, 8)}
            </span>
          ) : null}
        </span>

        {/* 3-dot menu */}
        {!selectMode && (
          <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1 text-[12px]">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => { onMove("up"); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-3.5 w-3.5" /> Move up
                </button>
                <button
                  type="button"
                  disabled={index === total - 1}
                  onClick={() => { onMove("down"); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-3.5 w-3.5" /> Move down
                </button>
                <div className="my-1 border-t border-border/50" />
                {onToggleHidden && (
                  <button
                    type="button"
                    onClick={() => { onToggleHidden(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted"
                  >
                    {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {isHidden ? "Show" : "Hide"}
                  </button>
                )}
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => { onDuplicate(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                )}
                {canSplit && (
                  <button
                    type="button"
                    onClick={() => { onChange(splitTextElement(s, elementKey)); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted text-primary"
                  >
                    <ScissorsLineDashed className="h-3.5 w-3.5" /> Split lines
                  </button>
                )}
                {onRemove && (
                  <>
                    <div className="my-1 border-t border-border/50" />
                    <button
                      type="button"
                      onClick={() => { onRemove(); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!selectMode && open && (
        <div className="px-2 pb-2 pt-1 space-y-1.5 border-t">
          {elementKey === "kicker" && (
            <>
              <InspectorTextarea value={stripHtml(s.kicker ?? "")} onChange={(v) => onChange({ ...s, kicker: `<p>${v.replace(/\n+/g, "</p><p>")}</p>` })} rows={2} />
              <IconInsertBar value={s.kicker ?? ""} onChange={(v) => onChange({ ...s, kicker: v })} />
              <ElementStyleEditor label="" style={s.kickerStyle} onChange={(es) => onChange({ ...s, kickerStyle: es })} showTypo showSnap tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "title" && (
            <>
              <InspectorTextarea value={stripHtml(s.title ?? "")} onChange={(v) => onChange({ ...s, title: `<p>${v.replace(/\n+/g, "</p><p>")}</p>` })} rows={2} />
              <IconInsertBar value={s.title ?? ""} onChange={(v) => onChange({ ...s, title: v })} />
              <ElementStyleEditor label="" style={s.titleStyle} onChange={(es) => onChange({ ...s, titleStyle: es })} showTypo showSnap tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "subtitle" && (
            <>
              <InspectorTextarea value={stripHtml(s.subtitle ?? "")} onChange={(v) => onChange({ ...s, subtitle: `<p>${v.replace(/\n+/g, "</p><p>")}</p>` })} rows={2} />
              <IconInsertBar value={s.subtitle ?? ""} onChange={(v) => onChange({ ...s, subtitle: v })} />
              <ElementStyleEditor label="" style={s.subtitleStyle} onChange={(es) => onChange({ ...s, subtitleStyle: es })} showTypo showSnap tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "body" && (
            <>
              <InspectorTextarea value={stripHtml(s.body ?? "")} onChange={(v) => onChange({ ...s, body: `<p>${v.replace(/\n+/g, "</p><p>")}</p>` })} rows={4} />
              <IconInsertBar value={s.body ?? ""} onChange={(v) => onChange({ ...s, body: v })} />
              <div>
                <div className="mb-0.5 text-[9px] text-muted-foreground">Variant</div>
                <InspectorSelect
                  value={s.bodyVariant ?? "plain"}
                  onChange={(v) => onChange({ ...s, bodyVariant: v as BodyVariant })}
                  options={BODY_VARIANT_OPTIONS}
                />
              </div>
              <ElementStyleEditor label="" style={s.bodyStyle} onChange={(es) => onChange({ ...s, bodyStyle: es })} showTypo showSnap tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "quote" && (
            <>
              <InspectorTextarea value={stripHtml(s.quote ?? "")} onChange={(v) => onChange({ ...s, quote: `<p>${v.replace(/\n+/g, "</p><p>")}</p>` })} rows={2} />
              <IconInsertBar value={s.quote ?? ""} onChange={(v) => onChange({ ...s, quote: v })} />
              <ElementStyleEditor label="" style={s.quoteStyle} onChange={(es) => onChange({ ...s, quoteStyle: es })} showTypo showSnap tuningScope={tuningScope} />
            </>
          )}
          {isExtra && extra && (
            <>
              <div>
                <div className="mb-0.5 text-[9px] text-muted-foreground">Kind</div>
                <InspectorSelect
                  value={extra.kind}
                  onChange={(v) => updateExtra({ kind: v as SlideExtra["kind"] })}
                  options={EXTRA_KIND_OPTIONS}
                />
              </div>
              <InspectorTextarea
                value={stripHtml(extra.text)}
                onChange={(v) => updateExtra({ text: `<p>${v.replace(/\n+/g, "</p><p>")}</p>` })}
                rows={2}
                placeholder="Text content..."
              />
              <ElementStyleEditor label="" style={extra.style} tuningScope={tuningScope} onChange={(es) => updateExtra({ style: es })} showTypo showSnap />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MediaFields — reusable media input group                          */
/* ------------------------------------------------------------------ */

function MediaFields({
  label,
  media,
  onChange,
}: {
  label: string;
  media?: Slide["media"];
  onChange: (patch: Record<string, string | undefined>) => void;
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <ImageUpload
        value={media?.src ?? ""}
        onChange={(url) => onChange({ src: url })}
        apiBase={apiBase}
      />
      <InspectorField label="Alt">
        <InspectorInput
          value={media?.alt ?? ""}
          onChange={(v) => onChange({ alt: v })}
        />
      </InspectorField>
      <div className="grid grid-cols-2 gap-1.5">
        <InspectorField label="Aspect ratio">
          <InspectorSelect
            value={media?.aspectRatio ?? "1/1"}
            onChange={(v) => onChange({ aspectRatio: v })}
            options={ASPECT_RATIO_OPTIONS}
          />
        </InspectorField>
        <InspectorField label="Fit">
          <InspectorSelect
            value={media?.objectFit ?? "cover"}
            onChange={(v) => onChange({ objectFit: v })}
            options={FIT_OPTIONS}
          />
        </InspectorField>
      </div>
    </div>
  );
}
