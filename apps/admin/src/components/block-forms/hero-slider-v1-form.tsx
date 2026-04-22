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
  Image,
  LayoutTemplate,
  Move,
  Plus,
  SlidersHorizontal,
  Trash2,
  Type,
} from "lucide-react";
import {
  type Slide,
  type SlideTemplate,
  type PresetKey,
  type ElementStyle,
  type SlideExtra,
  type TypoClass,
  TEMPLATE_OPTIONS,
  PRESET_OPTIONS,
  FIT_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  ALIGN_OPTIONS,
  JUSTIFY_OPTIONS,
  TYPO_OPTIONS,
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

export function HeroSliderV1Form({ value, onChange }: BlockFormProps) {
  const slides: Slide[] = arr<Slide>(value?.slides);
  const options = value?.options ?? {};

  const showDots = options?.showDots !== false;
  const showArrows = options?.showArrows === true;
  const fillViewport = options?.fillViewport === true;
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
}: {
  slide: Slide;
  index: number;
  total: number;
  onChange: (next: Slide) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const desktop = s?.layout?.desktop ?? {};
  const mobile = s?.layout?.mobile ?? {};
  const template = s?.template ?? "copy-left-image-right";

  return (
    <div className="rounded-md border bg-muted/10">
      {/* Slide header — click to collapse/expand */}
      <div
        className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/20 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[160px]">
          {collapsed ? "▸" : "▾"} {idx + 1}. {s?.title?.split("\n")[0] || template}
        </span>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
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
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-500 p-0.5"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

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

        {/* Text content */}
        <InspectorSection
          title="Text"
          icon={<Type className="h-3 w-3" />}

          defaultOpen
        >
          {s?.quote !== undefined && (
            <>
              <InspectorField label="Quote" stacked>
                <InspectorTextarea
                  value={s.quote ?? ""}
                  onChange={(v) => onChange({ ...s, quote: v })}
                  rows={2}
                />
                <IconInsertBar
                  value={s.quote ?? ""}
                  onChange={(v) => onChange({ ...s, quote: v })}
                />
              </InspectorField>
              <InspectorField label="Quote typography">
                <InspectorSelect
                  value={s.quoteStyle?.typo ?? ""}
                  onChange={(v) => onChange({ ...s, quoteStyle: { ...s.quoteStyle, typo: (v || undefined) as TypoClass | undefined } })}
                  options={TYPO_OPTIONS}
                />
              </InspectorField>
            </>
          )}

          {s?.kicker !== undefined && (
            <>
              <InspectorField label="Kicker" stacked>
                <InspectorTextarea
                  value={s.kicker ?? ""}
                  onChange={(v) => onChange({ ...s, kicker: v })}
                  rows={2}
                />
                <IconInsertBar
                  value={s.kicker ?? ""}
                  onChange={(v) => onChange({ ...s, kicker: v })}
                />
              </InspectorField>
              <div className="grid grid-cols-2 gap-1.5">
                <InspectorField label="Kicker typography">
                  <InspectorSelect
                    value={s.kickerStyle?.typo ?? ""}
                    onChange={(v) => onChange({ ...s, kickerStyle: { ...s.kickerStyle, typo: (v || undefined) as TypoClass | undefined } })}
                    options={TYPO_OPTIONS}
                  />
                </InspectorField>
                <InspectorField label="Kicker align">
                  <InspectorSelect
                    value={s.kickerStyle?.align ?? ""}
                    onChange={(v) => onChange({ ...s, kickerStyle: { ...s.kickerStyle, align: v || undefined } as any })}
                    options={ELEMENT_ALIGN_OPTIONS}
                  />
                </InspectorField>
              </div>
            </>
          )}

          <InspectorField label="Title" stacked>
            <InspectorTextarea
              value={s?.title ?? ""}
              onChange={(v) => onChange({ ...s, title: v })}
              rows={2}
            />
            <IconInsertBar
              value={s?.title ?? ""}
              onChange={(v) => onChange({ ...s, title: v })}
            />
          </InspectorField>
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorField label="Title typography">
              <InspectorSelect
                value={s.titleStyle?.typo ?? ""}
                onChange={(v) => onChange({ ...s, titleStyle: { ...s.titleStyle, typo: (v || undefined) as TypoClass | undefined } })}
                options={TYPO_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Title align">
              <InspectorSelect
                value={s.titleStyle?.align ?? ""}
                onChange={(v) => onChange({ ...s, titleStyle: { ...s.titleStyle, align: v || undefined } as any })}
                options={ELEMENT_ALIGN_OPTIONS}
              />
            </InspectorField>
          </div>

          {s?.subtitle !== undefined && (
            <>
              <InspectorField label="Tagline" stacked>
                <InspectorTextarea
                  value={s.subtitle ?? ""}
                  onChange={(v) => onChange({ ...s, subtitle: v })}
                  rows={2}
                />
                <IconInsertBar
                  value={s.subtitle ?? ""}
                  onChange={(v) => onChange({ ...s, subtitle: v })}
                />
              </InspectorField>
              <div className="grid grid-cols-2 gap-1.5">
                <InspectorField label="Tagline typography">
                  <InspectorSelect
                    value={s.subtitleStyle?.typo ?? ""}
                    onChange={(v) => onChange({ ...s, subtitleStyle: { ...s.subtitleStyle, typo: (v || undefined) as TypoClass | undefined } })}
                    options={TYPO_OPTIONS}
                  />
                </InspectorField>
                <InspectorField label="Tagline align">
                  <InspectorSelect
                    value={s.subtitleStyle?.align ?? ""}
                    onChange={(v) => onChange({ ...s, subtitleStyle: { ...s.subtitleStyle, align: v || undefined } as any })}
                    options={ELEMENT_ALIGN_OPTIONS}
                  />
                </InspectorField>
              </div>
            </>
          )}

          {s?.body !== undefined && (
            <>
              <InspectorField label="Body" stacked>
                <InspectorTextarea
                  value={s.body ?? ""}
                  onChange={(v) => onChange({ ...s, body: v })}
                  rows={4}
                />
                <IconInsertBar
                  value={s.body ?? ""}
                  onChange={(v) => onChange({ ...s, body: v })}
                />
              </InspectorField>
              <div className="grid grid-cols-2 gap-1.5">
                <InspectorField label="Body typography">
                  <InspectorSelect
                    value={s.bodyStyle?.typo ?? ""}
                    onChange={(v) => onChange({ ...s, bodyStyle: { ...s.bodyStyle, typo: (v || undefined) as TypoClass | undefined } })}
                    options={TYPO_OPTIONS}
                  />
                </InspectorField>
                <InspectorField label="Body align">
                  <InspectorSelect
                    value={s.bodyStyle?.align ?? ""}
                    onChange={(v) => onChange({ ...s, bodyStyle: { ...s.bodyStyle, align: v || undefined } as any })}
                    options={ELEMENT_ALIGN_OPTIONS}
                  />
                </InspectorField>
              </div>
            </>
          )}

          <InspectorField label="CTA label">
            <InspectorInput
              value={s?.cta?.label ?? ""}
              onChange={(v) => onChange({ ...s, cta: { ...s?.cta, label: v } })}
            />
          </InspectorField>
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorField label="CTA href">
              <InspectorInput
                value={s?.cta?.href ?? ""}
                onChange={(v) => onChange({ ...s, cta: { ...s?.cta, href: v } })}
              />
            </InspectorField>
            <InspectorField label="CTA align">
              <InspectorSelect
                value={s.ctaStyle?.align ?? ""}
                onChange={(v) => onChange({ ...s, ctaStyle: { ...s.ctaStyle, align: v || undefined } as any })}
                options={[{ value: "", label: "Auto" }, ...ALIGN_OPTIONS]}
              />
            </InspectorField>
          </div>
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
                onChange={(v) => onChange(updateDesktopLayout(s, { gap: v }))}
                placeholder="42px"
              />
            </InspectorField>
            <InspectorField label="Media padding">
              <InspectorInput
                value={desktop?.mediaPadding ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { mediaPadding: v }))}
                placeholder="0 10px 30px 0"
              />
            </InspectorField>
            <InspectorField label="Media height">
              <InspectorInput
                value={desktop?.mediaHeight ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { mediaHeight: v }))}
                placeholder="auto"
              />
            </InspectorField>
            <InspectorField label="Media vertical align">
              <InspectorSelect
                value={desktop?.mediaAlign ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { mediaAlign: v || undefined }))}
                options={MEDIA_ALIGN_OPTIONS}
              />
            </InspectorField>
          </div>
        </InspectorSection>

        {/* Desktop layout tuning */}
        <InspectorSection
          title="Desktop Tuning"
          icon={<LayoutTemplate className="h-3 w-3" />}

          defaultOpen={false}
        >
          <div className="mb-1.5">
            <div className="mb-1 text-[10px] text-muted-foreground">Padding</div>
            <InspectorInput
              value={desktop?.padding ?? ""}
              onChange={(v) => onChange(updateDesktopLayout(s, { padding: v }))}
              placeholder="10px 0"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Media width</div>
              <InspectorInput
                value={desktop?.mediaWidth ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { mediaWidth: v }))}
                placeholder="40%"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Text width</div>
              <InspectorInput
                value={desktop?.textWidth ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { textWidth: v }))}
                placeholder="92%"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Offset X</div>
              <InspectorInput
                value={desktop?.contentOffsetX ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { contentOffsetX: v }))}
                placeholder="0px"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Offset Y</div>
              <InspectorInput
                value={desktop?.contentOffsetY ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { contentOffsetY: v }))}
                placeholder="0px"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Title size</div>
              <InspectorInput
                value={desktop?.titleSize ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { titleSize: v }))}
                placeholder="clamp(54px, 5.5vw, 84px)"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Tagline size</div>
              <InspectorInput
                value={desktop?.subtitleSize ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { subtitleSize: v }))}
                placeholder="clamp(20px, 2vw, 30px)"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Kicker size</div>
              <InspectorInput
                value={desktop?.kickerSize ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { kickerSize: v }))}
                placeholder="clamp(22px, 1.8vw, 28px)"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-muted-foreground">Body size</div>
              <InspectorInput
                value={desktop?.bodySize ?? ""}
                onChange={(v) => onChange(updateDesktopLayout(s, { bodySize: v }))}
                placeholder="clamp(13px, 1vw, 15px)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <InspectorField label="Align">
              <InspectorSelect
                value={desktop?.textAlign ?? "center"}
                onChange={(v) => onChange(updateDesktopLayout(s, { textAlign: v }))}
                options={ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Justify">
              <InspectorSelect
                value={desktop?.contentJustify ?? "center"}
                onChange={(v) => onChange(updateDesktopLayout(s, { contentJustify: v }))}
                options={JUSTIFY_OPTIONS}
              />
            </InspectorField>
          </div>

          <InspectorToggle
            label="Align text ignoring gap"
            checked={!!desktop?.textAlignFullWidth}
            onChange={(v) => onChange(updateDesktopLayout(s, { textAlignFullWidth: v || undefined }))}
          />

          <InspectorToggle
            label="Mobile: image first"
            checked={!!mobile?.imageFirst}
            onChange={(v) => onChange(updateMobileLayout(s, { imageFirst: v }))}
          />
        </InspectorSection>

        {/* Per-element positioning */}
        <InspectorSection
          title="Element Positioning"
          icon={<Move className="h-3 w-3" />}
          defaultOpen={false}
        >
          {s?.quote !== undefined && (
            <ElementStyleEditor
              label="Quote"
              style={s.quoteStyle}
              onChange={(es) => onChange({ ...s, quoteStyle: es })}
              showTypo
            />
          )}
          {s?.kicker !== undefined && (
            <ElementStyleEditor
              label="Kicker"
              style={s.kickerStyle}
              onChange={(es) => onChange({ ...s, kickerStyle: es })}
              showTypo
            />
          )}
          <ElementStyleEditor
            label="Title"
            style={s.titleStyle}
            onChange={(es) => onChange({ ...s, titleStyle: es })}
            showTypo
          />
          {s?.subtitle !== undefined && (
            <ElementStyleEditor
              label="Tagline"
              style={s.subtitleStyle}
              onChange={(es) => onChange({ ...s, subtitleStyle: es })}
              showTypo
            />
          )}
          {s?.body !== undefined && (
            <ElementStyleEditor
              label="Body"
              style={s.bodyStyle}
              onChange={(es) => onChange({ ...s, bodyStyle: es })}
              showTypo
            />
          )}
          <ElementStyleEditor
            label="CTA"
            style={s.ctaStyle}
            onChange={(es) => onChange({ ...s, ctaStyle: es })}
          />
        </InspectorSection>

        {/* Extra elements */}
        <InspectorSection
          title="Extra Elements"
          icon={<Plus className="h-3 w-3" />}
          defaultOpen={false}
        >
          <ExtrasEditor
            extras={Array.isArray(s?.extras) ? s.extras : []}
            onChange={(next) => onChange({ ...s, extras: next })}
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
}: {
  label: string;
  style?: ElementStyle;
  onChange: (next: ElementStyle) => void;
  showTypo?: boolean;
}) {
  const s = style ?? {};
  const patch = (key: keyof ElementStyle, v: string) =>
    onChange({ ...s, [key]: v || undefined });

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {showTypo && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Typography</div>
          <InspectorSelect
            value={s.typo ?? ""}
            onChange={(v) => patch("typo", v)}
            options={TYPO_OPTIONS}
          />
        </div>
      )}
      <div className="grid grid-cols-4 gap-1">
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Top</div>
          <InspectorInput
            value={s.mt ?? ""}
            onChange={(v) => patch("mt", v)}
            placeholder="0"
          />
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Bottom</div>
          <InspectorInput
            value={s.mb ?? ""}
            onChange={(v) => patch("mb", v)}
            placeholder="0"
          />
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Left</div>
          <InspectorInput
            value={s.ml ?? ""}
            onChange={(v) => patch("ml", v)}
            placeholder="0"
          />
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Right</div>
          <InspectorInput
            value={s.mr ?? ""}
            onChange={(v) => patch("mr", v)}
            placeholder="0"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Align</div>
          <InspectorSelect
            value={s.align ?? ""}
            onChange={(v) => patch("align", v)}
            options={ELEMENT_ALIGN_OPTIONS}
          />
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Size</div>
          <InspectorInput
            value={s.size ?? ""}
            onChange={(v) => patch("size", v)}
            placeholder="inherit"
          />
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground mb-0.5">Stroke</div>
          <InspectorInput
            value={s.strokeW ?? ""}
            onChange={(v) => patch("strokeW", v)}
            placeholder="3.6px"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ExtrasEditor — add/edit extra text elements on a slide             */
/* ------------------------------------------------------------------ */

const EXTRA_KIND_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "kicker", label: "Kicker" },
  { value: "stamp", label: "Stamp" },
];

function ExtrasEditor({
  extras,
  onChange,
}: {
  extras: SlideExtra[];
  onChange: (next: SlideExtra[]) => void;
}) {
  return (
    <div className="space-y-2">
      {extras.map((ex, idx) => (
        <div key={ex.id ?? idx} className="rounded border p-1.5 space-y-1 bg-muted/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Extra {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(extras.filter((_, i) => i !== idx))}
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-[1fr_80px] gap-1">
            <InspectorInput
              value={ex.text}
              onChange={(v) => {
                const next = [...extras];
                next[idx] = { ...ex, text: v };
                onChange(next);
              }}
              placeholder="Text"
            />
            <InspectorSelect
              value={ex.kind}
              onChange={(v) => {
                const next = [...extras];
                next[idx] = { ...ex, kind: v as any };
                onChange(next);
              }}
              options={EXTRA_KIND_OPTIONS}
            />
          </div>
          <ElementStyleEditor
            label="Position"
            style={ex.style}
            onChange={(s) => {
              const next = [...extras];
              next[idx] = { ...ex, style: s };
              onChange(next);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...extras,
            { id: crypto?.randomUUID?.() ?? `ex-${Date.now()}`, kind: "text", text: "" },
          ])
        }
        className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
      >
        <Plus className="h-2.5 w-2.5" /> Add element
      </button>
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
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
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
