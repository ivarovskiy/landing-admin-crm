"use client";

import { useState } from "react";
import type { BlockFormProps } from "./index";
import { arr, moveAt, removeAt, setAt } from "@/lib/array";
import { updatePath } from "@/lib/update-path";
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
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Image,
  LayoutTemplate,
  Layers,
  Plus,
  SlidersHorizontal,
  Trash2,
  Type,
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

export function HeroSliderV1Form({ value, onChange, viewMode }: BlockFormProps) {
  const slides: Slide[] = arr<Slide>(value?.slides);
  const options = value?.options ?? {};

  const showDots = options?.showDots !== false;
  const showArrows = options?.showArrows === true;
  const fillViewport = options?.fillViewport === true;
  const showGuides = options?.showGuides === true;
  const showElementGuides = options?.showElementGuides === true;
  const autoPlayMs = Number(options?.autoPlayMs ?? 0);
  const inlineIconMargin = options?.inlineIconMargin ?? "";
  const inlineIconSize = options?.inlineIconSize ?? "";

  const set = (path: (string | number)[], v: unknown) =>
    onChange(updatePath(value, path, v));

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
              tuningScope={viewMode === "ipadPro" ? "ipadPro" : "default"}
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
  tuningScope,
}: {
  slide: Slide;
  index: number;
  total: number;
  onChange: (next: Slide) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
  onDuplicate: () => void;
  tuningScope: HeroTuningScope;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const desktop = getScopedDesktopLayout(s, tuningScope);
  const desktopFallback = getScopeFallbackLayout(s, tuningScope);
  const mobile = s?.layout?.mobile ?? {};
  const template = s?.template ?? "copy-left-image-right";
  const tuningScopeLabel = tuningScope === "ipadPro" ? "iPad Pro overrides" : "Desktop/default";

  return (
    <div className="rounded-md border bg-muted/10">
      {/* Slide header — click to collapse/expand */}
      <div
        className={[
          "flex items-center justify-between px-2 py-1.5 border-b bg-muted/20 cursor-pointer select-none",
          s?.hidden ? "opacity-50" : "",
        ].filter(Boolean).join(" ")}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className={[
          "text-[11px] font-semibold text-muted-foreground truncate max-w-[160px]",
          s?.hidden ? "line-through" : "",
        ].filter(Boolean).join(" ")}>
          {collapsed ? "▸" : "▾"} {idx + 1}. {s?.title?.split("\n")[0] || template}
        </span>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowCanvas((v) => !v)}
            className={[
              "p-0.5",
              showCanvas
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
            title="Toggle canvas editor"
          >
            <Layers className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...s, hidden: !s?.hidden })}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title={s?.hidden ? "Show slide" : "Hide slide"}
          >
            {s?.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={idx === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={idx === total - 1}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title="Duplicate slide"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-500 p-0.5"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Canvas editor — shown independently of collapsed state */}
      {showCanvas && (
        <div className="border-t px-2 py-2">
          <SlideCanvas slide={s} tuningScope={tuningScope} onChange={onChange} />
        </div>
      )}

      {!collapsed && <div className="p-2 space-y-2">
        {/* Preset — applies full clean slide from Figma design */}
        <InspectorField label="Preset" stacked>
          <InspectorSelect
            value=""
            onChange={(v) => {
              const preset = presetSlide(v as PresetKey);
              onChange({ id: s.id, ...preset } as Slide);
            }}
            options={[{ value: "", label: "Select preset..." }, ...PRESET_OPTIONS]}
          />
        </InspectorField>

        {/* Template — only changes layout, keeps content */}
        <InspectorField label="Layout">
          <InspectorSelect
            value={template}
            onChange={(v) => onChange({ ...s, template: v as SlideTemplate })}
            options={TEMPLATE_OPTIONS}
          />
        </InspectorField>

        {/* Slide-level toggles — visibility, mirror, stretch, per-slide timer */}
        <InspectorSection
          title="Slide options"
          icon={<SlidersHorizontal className="h-3 w-3" />}
          defaultOpen={false}
        >
          <InspectorField
            label="Autoplay (this slide)"
            hint="ms — overrides global Autoplay for this slide. Empty/0 = use global."
          >
            <InspectorNumber
              value={s?.autoPlayMs || undefined}
              onChange={(v) => onChange({ ...s, autoPlayMs: v ?? 0 })}
              placeholder="3000"
            />
          </InspectorField>

          <div className="space-y-1.5">
            <InspectorToggle
              label="Hidden"
              checked={!!s?.hidden}
              onChange={(v) => onChange({ ...s, hidden: v || undefined })}
            />
            <InspectorToggle
              label="Mirror layout (swap media ↔ text)"
              checked={!!s?.mirror}
              onChange={(v) => onChange({ ...s, mirror: v || undefined })}
            />
            <InspectorToggle
              label="Stretch text to media height"
              checked={!!s?.stretchTextToMedia}
              onChange={(v) => onChange({ ...s, stretchTextToMedia: v || undefined })}
            />
          </div>
        </InspectorSection>

        {/* Text content — collapsible + reorderable cards */}
        <InspectorSection
          title="Text"
          icon={<Type className="h-3 w-3" />}
          defaultOpen
        >
          <TextElementsEditor slide={s} tuningScope={tuningScope} onChange={onChange} />
        </InspectorSection>

        {/* CTA */}
        <InspectorSection title="CTA" icon={<Type className="h-3 w-3" />} defaultOpen={false}>
          <InspectorToggle
            label="Enable link"
            checked={s?.cta?.enabled === true || (s?.cta?.enabled == null && !!s?.cta?.href)}
            onChange={(v) => onChange({ ...s, cta: { ...s?.cta, enabled: v ? true : false } })}
          />
          {(s?.cta?.enabled === true || (s?.cta?.enabled == null && !!s?.cta?.href)) && (
            <>
              <InspectorField label="Label">
                <InspectorInput
                  value={s?.cta?.label ?? ""}
                  onChange={(v) => onChange({ ...s, cta: { ...s?.cta, label: v } })}
                />
              </InspectorField>
              <div className="grid grid-cols-2 gap-1.5">
                <InspectorField label="Href">
                  <InspectorInput
                    value={s?.cta?.href ?? ""}
                    onChange={(v) => onChange({ ...s, cta: { ...s?.cta, href: v } })}
                  />
                </InspectorField>
                <InspectorField label="Open in">
                  <InspectorSelect
                    value={s?.cta?.target ?? "_self"}
                    onChange={(v) => onChange({ ...s, cta: { ...s?.cta, target: (v as "_self" | "_blank") || undefined } })}
                    options={[
                      { value: "_self", label: "Same tab" },
                      { value: "_blank", label: "New tab" },
                    ]}
                  />
                </InspectorField>
              </div>
              <InspectorField label="Align">
                <InspectorSelect
                  value={s.ctaStyle?.align ?? ""}
                  onChange={(v) => onChange({ ...s, ctaStyle: { ...s.ctaStyle, align: v || undefined } as any })}
                  options={[{ value: "", label: "Auto" }, ...ALIGN_OPTIONS]}
                />
              </InspectorField>
            </>
          )}
          {s?.cta?.enabled === false && s?.cta?.href && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Saved: {s.cta.href}
            </p>
          )}
        </InspectorSection>

        {/* Media */}
        <InspectorSection
          title="Media"
          icon={<Image className="h-3 w-3" />}

          defaultOpen={false}
        >
          <MediaFields
            label="Image"
            media={s?.media}
            onChange={(patch) => onChange(updateMedia(s, patch))}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorField label="Gap to text" hint="Space between media and text column">
              <InspectorInput
                value={desktop?.gap ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { gap: v }))}
                placeholder={desktopFallback.gap ?? "42px"}
              />
            </InspectorField>
            <InspectorField label="Media padding">
              <InspectorInput
                value={desktop?.mediaPadding ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaPadding: v }))}
                placeholder={desktopFallback.mediaPadding ?? "0 10px 30px 0"}
              />
            </InspectorField>
            <InspectorField label="Media height">
              <InspectorInput
                value={desktop?.mediaHeight ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaHeight: v }))}
                placeholder={desktopFallback.mediaHeight ?? "auto"}
              />
            </InspectorField>
            <InspectorField label="Media vertical align">
              <InspectorSelect
                value={desktop?.mediaAlign ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaAlign: v || undefined }))}
                options={MEDIA_ALIGN_OPTIONS}
              />
            </InspectorField>
          </div>
        </InspectorSection>

        {/* Desktop layout tuning */}
        <InspectorSection
          title={`Desktop Tuning - ${tuningScopeLabel}`}
          icon={<LayoutTemplate className="h-3 w-3" />}

          defaultOpen={false}
        >
          {tuningScope === "ipadPro" ? (
            <p className="text-[10px] text-muted-foreground/80">
              Editing iPad Pro-only layout values. Empty fields inherit Desktop/default.
            </p>
          ) : null}
          <div className="mb-1.5">
            <div className="mb-1 text-xs text-muted-foreground">Padding</div>
            <InspectorInput
              value={desktop?.padding ?? ""}
              onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { padding: v }))}
              placeholder={desktopFallback.padding ?? "10px 0"}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Media width</div>
              <InspectorInput
                value={desktop?.mediaWidth ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { mediaWidth: v }))}
                placeholder={desktopFallback.mediaWidth ?? "40%"}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Text width</div>
              <InspectorInput
                value={desktop?.textWidth ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { textWidth: v }))}
                placeholder={desktopFallback.textWidth ?? "92%"}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Offset X</div>
              <InspectorInput
                value={desktop?.contentOffsetX ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { contentOffsetX: v }))}
                placeholder={desktopFallback.contentOffsetX ?? "0px"}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Offset Y</div>
              <InspectorInput
                value={desktop?.contentOffsetY ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { contentOffsetY: v }))}
                placeholder={desktopFallback.contentOffsetY ?? "0px"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Title size</div>
              <InspectorInput
                value={desktop?.titleSize ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { titleSize: v }))}
                placeholder={desktopFallback.titleSize ?? "clamp(54px, 5.5vw, 84px)"}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Tagline size</div>
              <InspectorInput
                value={desktop?.subtitleSize ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { subtitleSize: v }))}
                placeholder={desktopFallback.subtitleSize ?? "clamp(20px, 2vw, 30px)"}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Kicker size</div>
              <InspectorInput
                value={desktop?.kickerSize ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { kickerSize: v }))}
                placeholder={desktopFallback.kickerSize ?? "clamp(22px, 1.8vw, 28px)"}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Body size</div>
              <InspectorInput
                value={desktop?.bodySize ?? ""}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { bodySize: v }))}
                placeholder={desktopFallback.bodySize ?? "clamp(13px, 1vw, 15px)"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <InspectorField label="Align">
              <InspectorSelect
                value={desktop?.textAlign ?? "center"}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { textAlign: v }))}
                options={ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Justify">
              <InspectorSelect
                value={desktop?.contentJustify ?? "center"}
                onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { contentJustify: v }))}
                options={JUSTIFY_OPTIONS}
              />
            </InspectorField>
          </div>

          <InspectorToggle
            label="Align text ignoring gap"
            checked={!!desktop?.textAlignFullWidth}
            onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { textAlignFullWidth: v || undefined }))}
          />

          <InspectorToggle
            label="Ignore gap while dragging"
            checked={!!desktop?.dragIgnoreGap}
            onChange={(v) => onChange(updateScopedDesktopLayout(s, tuningScope, { dragIgnoreGap: v || undefined }))}
          />

          <InspectorToggle
            label="Mobile: image first"
            checked={!!mobile?.imageFirst}
            onChange={(v) => onChange(updateMobileLayout(s, { imageFirst: v }))}
          />
        </InspectorSection>

      </div>}
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
  tuningScope = "default",
}: {
  label: string;
  style?: ElementStyle;
  onChange: (next: ElementStyle) => void;
  showTypo?: boolean;
  tuningScope?: HeroTuningScope;
}) {
  const s = getScopedElementStyle(style, tuningScope);
  const fallback = getScopeFallbackElementStyle(style, tuningScope);
  const patch = (key: ElementStyleField, v: string) =>
    onChange(updateScopedElementStyle(style, tuningScope, { [key]: v || undefined } as Partial<ElementStyleProfile>));

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
      <div className="grid grid-cols-3 gap-1">
        <div>
          <div className="text-[11px] text-muted-foreground mb-0.5">Align</div>
          <InspectorSelect
            value={s.align ?? ""}
            onChange={(v) => patch("align", v)}
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
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TextElementsEditor — unified reorderable list of all text elements */
/* ------------------------------------------------------------------ */

const EXTRA_KIND_OPTIONS = [
  { value: "text", label: "Text" },
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
}: {
  slide: Slide;
  tuningScope: HeroTuningScope;
  onChange: (next: Slide) => void;
}) {
  const extras = Array.isArray(s?.extras) ? s.extras : [];

  const activeFixed: string[] = [];
  if (s?.kicker !== undefined) activeFixed.push("kicker");
  activeFixed.push("title");
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

  const removeExtra = (id: string) => {
    const newExtras = extras.filter(e => e.id !== id);
    const newOrder = orderedKeys.filter(k => k !== id);
    onChange({ ...s, extras: newExtras, elementOrder: newOrder.length ? newOrder : undefined });
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

  return (
    <div className="space-y-1.5">
      {orderedKeys.map((key, idx) => (
        <TextElementCard
          key={key}
          elementKey={key}
          slide={s}
          index={idx}
          total={orderedKeys.length}
          tuningScope={tuningScope}
          onChange={onChange}
          onMove={(dir) => moveElement(idx, dir)}
          onRemove={extraKeys.includes(key) ? () => removeExtra(key) : undefined}
        />
      ))}
      <button
        type="button"
        onClick={addExtra}
        className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
      >
        <Plus className="h-2.5 w-2.5" /> Add text block
      </button>
    </div>
  );
}

function TextElementCard({
  elementKey,
  slide: s,
  index,
  total,
  tuningScope,
  onChange,
  onMove,
  onRemove,
}: {
  elementKey: string;
  slide: Slide;
  index: number;
  total: number;
  tuningScope: HeroTuningScope;
  onChange: (next: Slide) => void;
  onMove: (dir: "up" | "down") => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const extras = Array.isArray(s?.extras) ? s.extras : [];
  const extra = extras.find(e => e.id === elementKey);
  const isExtra = !!extra;

  const updateExtra = (patch: Partial<SlideExtra>) =>
    onChange({ ...s, extras: extras.map(e => e.id === elementKey ? { ...e, ...patch } : e) });

  const label = isExtra
    ? `Extra${extra.text ? ": " + extra.text.split("\n")[0].slice(0, 22) : ""}`
    : (FIXED_ELEMENT_LABELS[elementKey] ?? elementKey);

  return (
    <div className="rounded border bg-muted/5">
      <div
        className="flex items-center justify-between px-2 py-1 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[150px]">
          {open ? "▾" : "▸"} {label}
        </span>
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:text-red-500 p-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="px-2 pb-2 pt-1 space-y-1.5 border-t">
          {elementKey === "kicker" && (
            <>
              <InspectorTextarea value={s.kicker ?? ""} onChange={(v) => onChange({ ...s, kicker: v })} rows={2} />
              <IconInsertBar value={s.kicker ?? ""} onChange={(v) => onChange({ ...s, kicker: v })} />
              <ElementStyleEditor label="" style={s.kickerStyle} onChange={(es) => onChange({ ...s, kickerStyle: es })} showTypo tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "title" && (
            <>
              <InspectorTextarea value={s.title ?? ""} onChange={(v) => onChange({ ...s, title: v })} rows={2} />
              <IconInsertBar value={s.title ?? ""} onChange={(v) => onChange({ ...s, title: v })} />
              <ElementStyleEditor label="" style={s.titleStyle} onChange={(es) => onChange({ ...s, titleStyle: es })} showTypo tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "subtitle" && (
            <>
              <InspectorTextarea value={s.subtitle ?? ""} onChange={(v) => onChange({ ...s, subtitle: v })} rows={2} />
              <IconInsertBar value={s.subtitle ?? ""} onChange={(v) => onChange({ ...s, subtitle: v })} />
              <ElementStyleEditor label="" style={s.subtitleStyle} onChange={(es) => onChange({ ...s, subtitleStyle: es })} showTypo tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "body" && (
            <>
              <InspectorTextarea value={s.body ?? ""} onChange={(v) => onChange({ ...s, body: v })} rows={4} />
              <IconInsertBar value={s.body ?? ""} onChange={(v) => onChange({ ...s, body: v })} />
              <div>
                <div className="mb-0.5 text-[9px] text-muted-foreground">Variant</div>
                <InspectorSelect
                  value={s.bodyVariant ?? "plain"}
                  onChange={(v) => onChange({ ...s, bodyVariant: v as BodyVariant })}
                  options={BODY_VARIANT_OPTIONS}
                />
              </div>
              <ElementStyleEditor label="" style={s.bodyStyle} onChange={(es) => onChange({ ...s, bodyStyle: es })} showTypo tuningScope={tuningScope} />
            </>
          )}
          {elementKey === "quote" && (
            <>
              <InspectorTextarea value={s.quote ?? ""} onChange={(v) => onChange({ ...s, quote: v })} rows={2} />
              <IconInsertBar value={s.quote ?? ""} onChange={(v) => onChange({ ...s, quote: v })} />
              <ElementStyleEditor label="" style={s.quoteStyle} onChange={(es) => onChange({ ...s, quoteStyle: es })} showTypo tuningScope={tuningScope} />
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
              <InspectorTextarea value={extra.text} onChange={(v) => updateExtra({ text: v })} rows={2} placeholder="Text content..." />
              <ElementStyleEditor label="" style={extra.style} tuningScope={tuningScope} onChange={(es) => updateExtra({ style: es })} showTypo />
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
