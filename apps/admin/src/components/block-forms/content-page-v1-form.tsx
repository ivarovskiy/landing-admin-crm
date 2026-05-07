"use client";

import type { BlockFormProps } from "./index";
import { arr, setAt, removeAt } from "@/lib/array";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
  InspectorNumber,
  InspectorToggle,
  InspectorSegment,
  BlockLayoutSection,
  ImageUpload,
} from "@/components/inspector";
import { AlignLeft, Columns2, Image, Trash2, Type } from "lucide-react";
import { TYPO_OPTIONS } from "./hero-slider-presets";
import { ContentGridDnd, prepareGridItems, type ContentGridConfig } from "./content-grid-dnd";
import { ItemOrderList } from "./content-items-order";
import {
  AdvancedPanel,
  ControlCard,
  FieldGrid,
  PresetButton,
  PresetRow,
  SectionNote,
} from "./admin-control-kit";

const API_BASE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL ?? "") : "";

// TipTap stores HTML; strip it back to plain text for inspector fields.
// Mirror of tiptap-inline.tsx toHtml(): paragraph breaks ↔ double newline, <br> ↔ newline.
function h(value: string | undefined): string {
  if (!value) return "";
  if (!value.trimStart().startsWith("<")) return value;
  return value
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z0-9]+;/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

const ASPECT_RATIOS = [
  { value: "4/3", label: "4:3" },
  { value: "3/2", label: "3:2" },
  { value: "1/1", label: "1:1 Square" },
  { value: "3/4", label: "3:4 Portrait" },
  { value: "16/9", label: "16:9 Wide" },
  { value: "2/3", label: "2:3 Tall" },
];

const ALIGN_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
];

const TEXT_ALIGN_OPTIONS = [
  { value: "", label: "Inherit" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const COLUMNS_MODE_OPTIONS = [
  { value: "two", label: "Two columns" },
  { value: "one", label: "One column (full-width)" },
];

const TEXT_WIDTH_PRESETS = [
  { label: "Narrow", value: "420px" },
  { label: "Memo", value: "533px" },
  { label: "Wide", value: "680px" },
  { label: "Full", value: "100%" },
];

const IMAGE_WIDTH_PRESETS = [
  { label: "Small", value: "260px" },
  { label: "Medium", value: "420px" },
  { label: "Large", value: "560px" },
  { label: "Full", value: "100%" },
];

const GAP_PRESETS = [
  { label: "None", value: "0px" },
  { label: "Soft", value: "24px" },
  { label: "Roomy", value: "56px" },
];

const TEXT_ALIGN_SEGMENTS = [
  { value: "" as const, label: "Auto" },
  { value: "left" as const, label: "Left" },
  { value: "center" as const, label: "Center" },
  { value: "right" as const, label: "Right" },
];

function updateDesktopLayout(item: any, patch: Record<string, string | undefined>) {
  return {
    ...item,
    layout: {
      ...(item?.layout ?? {}),
      lg: {
        ...(item?.layout?.lg ?? {}),
        ...patch,
      },
    },
  };
}

function itemTitle(item: any, idx: number) {
  if (item?.kind === "image") return item?.alt || `Image ${idx + 1}`;
  return h(item?.heading) || `Text ${idx + 1}`;
}

function itemSummary(item: any) {
  if (item?.kind === "image") return item?.src ? "Uploaded image" : "Image block";
  if (item?.body) return h(item.body).replace(/\s+/g, " ").slice(0, 54);
  return "Text block";
}

function patchDesktopLayout(item: any, patch: Record<string, string | undefined>) {
  return updateDesktopLayout(item, patch);
}

function applyWidthPreset(item: any, width: string) {
  if (item?.kind === "text") {
    return {
      ...patchDesktopLayout(item, { width }),
      textMaxWidth: width,
    };
  }

  return {
    ...patchDesktopLayout(item, { width }),
    imageWidth: width,
  };
}

function PresetButtons({
  value,
  presets,
  onChange,
}: {
  value?: string;
  presets: { label: string; value: string }[];
  onChange: (next: string) => void;
}) {
  return (
    <>
      {presets.map((preset) => (
        <PresetButton
          key={preset.value}
          active={value === preset.value}
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </PresetButton>
      ))}
    </>
  );
}

function ItemLayoutAdvanced({
  item,
  onChange,
}: {
  item: any;
  onChange: (next: any) => void;
}) {
  return (
    <AdvancedPanel title="Precise layout">
      <FieldGrid>
        <InspectorField label="Mobile">
          <InspectorNumber
            value={item.mobileOrder}
            onChange={(v) => onChange({ ...item, mobileOrder: v ?? 0 })}
          />
        </InspectorField>

        <InspectorField label="Align">
          <InspectorSelect
            value={item?.layout?.lg?.align ?? "start"}
            onChange={(v) => onChange(updateDesktopLayout(item, { align: v || undefined }))}
            options={ALIGN_OPTIONS}
          />
        </InspectorField>

        <InspectorField label="Max W">
          <InspectorInput
            value={item?.layout?.lg?.width ?? ""}
            onChange={(v) => onChange(updateDesktopLayout(item, { width: v || undefined }))}
            placeholder="533px / 78%"
          />
        </InspectorField>

        <InspectorField label="Top gap">
          <InspectorInput
            value={item?.layout?.lg?.gapBefore ?? ""}
            onChange={(v) => onChange(updateDesktopLayout(item, { gapBefore: v || undefined }))}
            placeholder="32px"
          />
        </InspectorField>
      </FieldGrid>

      <PresetRow label="Top gap presets">
        <PresetButtons
          value={item?.layout?.lg?.gapBefore}
          presets={GAP_PRESETS}
          onChange={(value) => onChange(updateDesktopLayout(item, { gapBefore: value }))}
        />
      </PresetRow>

      <InspectorField label="X offset">
        <InspectorInput
          value={item?.layout?.lg?.offsetX ?? ""}
          onChange={(v) => onChange(updateDesktopLayout(item, { offsetX: v || undefined }))}
          placeholder="72px"
        />
      </InspectorField>
    </AdvancedPanel>
  );
}

function TextItemEditor({
  item,
  onChange,
}: {
  item: any;
  onChange: (next: any) => void;
}) {
  const widthValue = item?.layout?.lg?.width ?? item.textMaxWidth ?? "";

  return (
    <>
      <InspectorInput
        value={h(item.heading)}
        onChange={(v) => onChange({ ...item, heading: v })}
        placeholder="Heading"
      />
      <InspectorTextarea
        value={h(item.body)}
        onChange={(v) => onChange({ ...item, body: v })}
        placeholder="Body text. Enter = new line, empty line = new paragraph."
        rows={5}
      />

      <InspectorField label="Align">
        <InspectorSegment
          value={(item.textAlign ?? "") as "" | "left" | "center" | "right"}
          onChange={(v) => onChange({ ...item, textAlign: v || undefined })}
          options={TEXT_ALIGN_SEGMENTS}
        />
      </InspectorField>

      <PresetRow label="Text width">
        <PresetButtons
          value={widthValue}
          presets={TEXT_WIDTH_PRESETS}
          onChange={(value) => onChange(applyWidthPreset(item, value))}
        />
      </PresetRow>

      <InspectorField label="Width">
        <InspectorInput
          value={widthValue}
          onChange={(v) =>
            onChange({
              ...updateDesktopLayout(item, { width: v || undefined }),
              textMaxWidth: v || undefined,
            })
          }
          placeholder="533px / 78% / 100%"
        />
      </InspectorField>

      <AdvancedPanel title="Typography">
        <FieldGrid>
          <InspectorField label="Head typo">
            <InspectorSelect
              value={item.headingTypo ?? ""}
              onChange={(v) => onChange({ ...item, headingTypo: v || undefined })}
              options={TYPO_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Head line">
            <InspectorInput
              value={item.headingStrokeW ?? ""}
              onChange={(v) => onChange({ ...item, headingStrokeW: v || undefined })}
              placeholder="2.6px"
            />
          </InspectorField>
          <InspectorField label="Body typo">
            <InspectorSelect
              value={item.bodyTypo ?? ""}
              onChange={(v) => onChange({ ...item, bodyTypo: v || undefined })}
              options={TYPO_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Body line">
            <InspectorInput
              value={item.bodyStrokeW ?? ""}
              onChange={(v) => onChange({ ...item, bodyStrokeW: v || undefined })}
              placeholder="3.6px"
            />
          </InspectorField>
        </FieldGrid>
      </AdvancedPanel>

      <ItemLayoutAdvanced item={item} onChange={onChange} />
    </>
  );
}

function ImageItemEditor({
  item,
  onChange,
}: {
  item: any;
  onChange: (next: any) => void;
}) {
  const widthValue = item.imageWidth ?? item?.layout?.lg?.width ?? "";

  return (
    <>
      <ImageUpload
        value={item.src ?? ""}
        onChange={(url) => onChange({ ...item, src: url })}
        apiBase={API_BASE}
      />

      <InspectorField label="Alt">
        <InspectorInput
          value={item.alt ?? ""}
          onChange={(v) => onChange({ ...item, alt: v })}
          placeholder="Describe the image"
        />
      </InspectorField>

      <PresetRow label="Image width">
        <PresetButtons
          value={widthValue}
          presets={IMAGE_WIDTH_PRESETS}
          onChange={(value) => onChange(applyWidthPreset(item, value))}
        />
      </PresetRow>

      <FieldGrid>
        <InspectorField label="Aspect">
          <InspectorSelect
            value={item.aspectRatio ?? ""}
            onChange={(v) => onChange({ ...item, aspectRatio: v })}
            options={[{ value: "", label: "Auto" }, ...ASPECT_RATIOS]}
          />
        </InspectorField>
        <InspectorField label="Width">
          <InspectorInput
            value={widthValue}
            onChange={(v) =>
              onChange({
                ...updateDesktopLayout(item, { width: v || undefined }),
                imageWidth: v || undefined,
              })
            }
            placeholder="420px / 100%"
          />
        </InspectorField>
      </FieldGrid>

      <AdvancedPanel title="Image frame">
        <FieldGrid>
          <InspectorField label="Height">
            <InspectorInput
              value={item.imageHeight ?? ""}
              onChange={(v) => onChange({ ...item, imageHeight: v || undefined })}
              placeholder="253px / auto"
            />
          </InspectorField>
          <InspectorField label="Padding">
            <InspectorInput
              value={item.imagePadding ?? ""}
              onChange={(v) => onChange({ ...item, imagePadding: v || undefined })}
              placeholder="0 113px 33px 0"
            />
          </InspectorField>
        </FieldGrid>
      </AdvancedPanel>

      <ItemLayoutAdvanced item={item} onChange={onChange} />
    </>
  );
}

function ColumnEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: any[];
  onChange: (next: any[]) => void;
}) {
  const addItem = (kind: "image" | "text") => {
    const maxOrder = items.reduce((m: number, x: any) => Math.max(m, x.mobileOrder ?? 0), 0);
    const item =
      kind === "image"
        ? { kind: "image", src: "", alt: "", aspectRatio: "4/3", mobileOrder: maxOrder + 1 }
        : { kind: "text", heading: "", body: "", textMaxWidth: "533px", mobileOrder: maxOrder + 1 };

    onChange([...items, item]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => addItem("image")}
            className="flex items-center gap-0.5 rounded-sm px-1.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
          >
            <Image className="h-3 w-3" />
            Image
          </button>
          <button
            type="button"
            onClick={() => addItem("text")}
            className="flex items-center gap-0.5 rounded-sm px-1.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
          >
            <Type className="h-3 w-3" />
            Text
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item: any, idx: number) => (
          <ControlCard
            key={idx}
            title={itemTitle(item, idx)}
            subtitle={itemSummary(item)}
            icon={item.kind === "image" ? <Image className="h-3.5 w-3.5" /> : <AlignLeft className="h-3.5 w-3.5" />}
            action={
              <button
                type="button"
                onClick={() => onChange(removeAt(items, idx))}
                className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                title="Delete block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
          >
            {item.kind === "image" ? (
              <ImageItemEditor
                item={item}
                onChange={(next) => onChange(setAt(items, idx, next))}
              />
            ) : (
              <TextItemEditor
                item={item}
                onChange={(next) => onChange(setAt(items, idx, next))}
              />
            )}
          </ControlCard>
        ))}
      </div>
    </div>
  );
}

function EntryEditor({
  entry,
  idx,
  grid,
  onChange,
  onRemove,
  onGridChange,
}: {
  entry: { left: any[]; right: any[] };
  idx: number;
  grid?: ContentGridConfig;
  onChange: (next: { left: any[]; right: any[] }) => void;
  onRemove: () => void;
  onGridChange?: (next: ContentGridConfig) => void;
}) {
  const gridEnabled = grid?.enabled === true;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
          Entry {idx + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <ItemOrderList
        left={arr(entry.left)}
        right={arr(entry.right)}
        onChange={(next) => onChange({ ...entry, ...next })}
      />

      {gridEnabled && onGridChange ? (
        <ContentGridDnd
          left={arr(entry.left)}
          right={arr(entry.right)}
          grid={grid}
          onGridChange={onGridChange}
          onItemsChange={(next) => onChange({ ...entry, ...next })}
        />
      ) : null}

      <div className="space-y-1 pl-2 border-l-2 border-blue-400/60">
        <ColumnEditor
          label="Left column"
          items={arr(entry.left)}
          onChange={(next) => onChange({ ...entry, left: next })}
        />
      </div>

      <div className="h-px bg-border/60" />

      <div className="space-y-1 pl-2 border-l-2 border-rose-400/60">
        <ColumnEditor
          label="Right column"
          items={arr(entry.right)}
          onChange={(next) => onChange({ ...entry, right: next })}
        />
      </div>
    </div>
  );
}

function EntriesEditor({
  entries,
  grid,
  flatLeft,
  flatRight,
  onChange,
  onGridChange,
  onImportFlat,
}: {
  entries: { left: any[]; right: any[] }[];
  grid?: ContentGridConfig;
  flatLeft?: any[];
  flatRight?: any[];
  onChange: (next: { left: any[]; right: any[] }[]) => void;
  onGridChange?: (next: ContentGridConfig) => void;
  onImportFlat?: () => void;
}) {
  const addEntry = () => {
    onChange([...entries, { left: [], right: [] }]);
  };

  const hasFlatItems = (flatLeft?.length ?? 0) > 0 || (flatRight?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      {entries.length === 0 && hasFlatItems && onImportFlat && (
        <div className="rounded-md border border-amber-400/40 bg-amber-400/5 p-3 space-y-2">
          <p className="text-[11px] text-amber-600 leading-relaxed">
            You have items in the flat columns. Import them as Entry 1 to use Scroll Story.
          </p>
          <button
            type="button"
            onClick={onImportFlat}
            className="w-full rounded-md bg-amber-500/10 border border-amber-400/50 py-1.5 text-[11px] font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
          >
            Import flat columns → Entry 1
          </button>
        </div>
      )}
      {entries.map((entry, idx) => (
        <EntryEditor
          key={idx}
          entry={entry}
          idx={idx}
          grid={grid}
          onChange={(next) => onChange(setAt(entries, idx, next))}
          onRemove={() => onChange(removeAt(entries, idx))}
          onGridChange={onGridChange}
        />
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-md border border-dashed border-border py-2 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors"
      >
        + Add entry
      </button>
    </div>
  );
}

export function ContentPageV1Form({ value, onChange }: BlockFormProps) {
  const scrollStory = !!value?.scrollStory;
  const gridEnabled = value?.grid?.enabled === true;

  return (
    <div>
      <InspectorSection title="Hero" icon={<Type className="h-3 w-3" />}>
        <SectionNote>
          Basic fields change the copy immediately. Typography, strokes, gaps and exact widths live in advanced groups below.
        </SectionNote>

        <InspectorField label="Hero align" hint="Default text-align for kicker / title / tagline">
          <InspectorSelect
            value={value?.heroAlign ?? ""}
            onChange={(v) => onChange({ ...value, heroAlign: v || undefined })}
            options={TEXT_ALIGN_OPTIONS}
          />
        </InspectorField>

        <InspectorField label="Kicker">
          <InspectorInput
            value={h(value?.kicker)}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="SUMMER PROGRAM"
          />
        </InspectorField>

        <InspectorField label="Title">
          <InspectorInput
            value={h(value?.title)}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="NEW GUEST TEACHERS"
          />
        </InspectorField>

        <InspectorField label="Tagline">
          <InspectorInput
            value={h(value?.subtitle)}
            onChange={(v) => onChange({ ...value, subtitle: v })}
            placeholder="Sign up by June 15"
          />
        </InspectorField>

        <InspectorField label="CTA label">
          <InspectorInput
            value={h(value?.cta?.label)}
            onChange={(v) => onChange({ ...value, cta: { ...value?.cta, label: v } })}
            placeholder="Studio Director"
          />
        </InspectorField>

        <InspectorField label="CTA href">
          <InspectorInput
            value={value?.cta?.href ?? ""}
            onChange={(v) => onChange({ ...value, cta: { ...value?.cta, href: v } })}
            placeholder="#"
          />
        </InspectorField>

        <InspectorField label="Document box">
          <InspectorToggle
            checked={!!value?.boxed}
            onChange={(v) => onChange({ ...value, boxed: v })}
            label="Boxed with clip"
          />
        </InspectorField>

        <AdvancedPanel title="Hero typography">
          <FieldGrid>
            <InspectorField label="Kick typo">
              <InspectorSelect
                value={value?.kickerTypo ?? ""}
                onChange={(v) => onChange({ ...value, kickerTypo: v || undefined })}
                options={TYPO_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Kick line">
              <InspectorInput
                value={value?.kickerStrokeW ?? ""}
                onChange={(v) => onChange({ ...value, kickerStrokeW: v || undefined })}
                placeholder="2.6px"
              />
            </InspectorField>
            <InspectorField label="Title line">
              <InspectorInput
                value={value?.titleStrokeW ?? ""}
                onChange={(v) => onChange({ ...value, titleStrokeW: v || undefined })}
                placeholder="2.6px"
              />
            </InspectorField>
            <InspectorField label="Sub typo">
              <InspectorSelect
                value={value?.subtitleTypo ?? ""}
                onChange={(v) => onChange({ ...value, subtitleTypo: v || undefined })}
                options={TYPO_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Sub line">
              <InspectorInput
                value={value?.subtitleStrokeW ?? ""}
                onChange={(v) => onChange({ ...value, subtitleStrokeW: v || undefined })}
                placeholder="3.6px"
              />
            </InspectorField>
          </FieldGrid>
        </AdvancedPanel>

        <AdvancedPanel title="Hero spacing and widths">
          <FieldGrid>
            <InspectorField label="Kick align">
              <InspectorSelect
                value={value?.kickerAlign ?? ""}
                onChange={(v) => onChange({ ...value, kickerAlign: v || undefined })}
                options={TEXT_ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Kick gap">
              <InspectorInput
                value={value?.kickerGap ?? ""}
                onChange={(v) => onChange({ ...value, kickerGap: v || undefined })}
                placeholder="0"
              />
            </InspectorField>
            <InspectorField label="Kick W">
              <InspectorInput
                value={value?.kickerMaxW ?? ""}
                onChange={(v) => onChange({ ...value, kickerMaxW: v || undefined })}
                placeholder="none"
              />
            </InspectorField>
            <InspectorField label="Title align">
              <InspectorSelect
                value={value?.titleAlign ?? ""}
                onChange={(v) => onChange({ ...value, titleAlign: v || undefined })}
                options={TEXT_ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Title gap">
              <InspectorInput
                value={value?.titleGap ?? ""}
                onChange={(v) => onChange({ ...value, titleGap: v || undefined })}
                placeholder="24px"
              />
            </InspectorField>
            <InspectorField label="Title W">
              <InspectorInput
                value={value?.titleMaxW ?? ""}
                onChange={(v) => onChange({ ...value, titleMaxW: v || undefined })}
                placeholder="none"
              />
            </InspectorField>
            <InspectorField label="Sub align">
              <InspectorSelect
                value={value?.subtitleAlign ?? ""}
                onChange={(v) => onChange({ ...value, subtitleAlign: v || undefined })}
                options={TEXT_ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Sub gap">
              <InspectorInput
                value={value?.subtitleGap ?? ""}
                onChange={(v) => onChange({ ...value, subtitleGap: v || undefined })}
                placeholder="0"
              />
            </InspectorField>
            <InspectorField label="Sub W">
              <InspectorInput
                value={value?.subtitleMaxW ?? ""}
                onChange={(v) => onChange({ ...value, subtitleMaxW: v || undefined })}
                placeholder="none"
              />
            </InspectorField>
            <InspectorField label="CTA align">
              <InspectorSelect
                value={value?.ctaAlign ?? ""}
                onChange={(v) => onChange({ ...value, ctaAlign: v || undefined })}
                options={TEXT_ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="CTA gap">
              <InspectorInput
                value={value?.ctaGap ?? ""}
                onChange={(v) => onChange({ ...value, ctaGap: v || undefined })}
                placeholder="12px"
              />
            </InspectorField>
            <InspectorField label="CTA W">
              <InspectorInput
                value={value?.ctaMaxW ?? ""}
                onChange={(v) => onChange({ ...value, ctaMaxW: v || undefined })}
                placeholder="none"
              />
            </InspectorField>
          </FieldGrid>

          <InspectorField label="Content W">
            <InspectorInput
              value={value?.maxWidth ?? ""}
              onChange={(v) => onChange({ ...value, maxWidth: v })}
              placeholder="1360px (default)"
            />
          </InspectorField>
        </AdvancedPanel>
      </InspectorSection>

      <InspectorSection title="Content" icon={<Columns2 className="h-3 w-3" />}>
        <InspectorField label="Scroll Story">
          <InspectorToggle
            checked={scrollStory}
            onChange={(v) => {
              if (v) {
                const flatLeft = arr(value?.left);
                const flatRight = arr(value?.right);
                const existingEntries = arr(value?.entries);
                if (existingEntries.length === 0 && (flatLeft.length > 0 || flatRight.length > 0)) {
                  onChange({ ...value, scrollStory: true, entries: [{ left: flatLeft, right: flatRight }], left: [], right: [] });
                  return;
                }
              }
              onChange({ ...value, scrollStory: v });
            }}
            label="Enable per-entry sticky scroll"
          />
        </InspectorField>

        {/* Grid DnD toggle — available in both modes */}
        <InspectorField label="Grid DnD">
          <InspectorToggle
            checked={gridEnabled}
            label={gridEnabled ? "On" : "Off"}
            onChange={(enabled) => {
              if (!enabled) {
                onChange({ ...value, grid: { ...(value?.grid ?? {}), enabled: false } });
                return;
              }
              const leftItems: any[] = scrollStory ? [] : arr(value?.left);
              const rightItems: any[] = scrollStory || value?.columns === "one" ? [] : arr(value?.right);
              const prepared = prepareGridItems({
                left: leftItems,
                right: rightItems,
                columns: value?.grid?.columns,
                rows: value?.grid?.rows,
              });
              onChange({
                ...value,
                grid: {
                  columns: 12,
                  rows: 8,
                  rowHeight: "44px",
                  gap: "8px",
                  ...(value?.grid ?? {}),
                  enabled: true,
                },
                ...(scrollStory ? {} : {
                  left: prepared.left,
                  right: value?.columns === "one" ? value?.right : prepared.right,
                }),
              });
            }}
          />
        </InspectorField>

        {scrollStory ? (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <InspectorField label="Sticky top">
                <InspectorInput
                  value={value?.stickyTop ?? ""}
                  onChange={(v) => onChange({ ...value, stickyTop: v || undefined })}
                  placeholder="80px"
                />
              </InspectorField>
              <InspectorField label="Entry gap">
                <InspectorInput
                  value={value?.entryGap ?? ""}
                  onChange={(v) => onChange({ ...value, entryGap: v || undefined })}
                  placeholder="0px"
                />
              </InspectorField>
              <InspectorField label="Progress dot">
                <InspectorToggle
                  checked={!!value?.showProgress}
                  onChange={(v) => onChange({ ...value, showProgress: v })}
                  label="Show"
                />
              </InspectorField>
            </div>

            <div className="mt-1">
              <EntriesEditor
                entries={arr(value?.entries)}
                grid={gridEnabled ? value?.grid : undefined}
                flatLeft={arr(value?.left)}
                flatRight={arr(value?.right)}
                onChange={(next) => onChange({ ...value, entries: next })}
                onGridChange={gridEnabled
                  ? (g) => onChange({ ...value, grid: { ...(value?.grid ?? {}), ...g, enabled: true } })
                  : undefined}
                onImportFlat={() => {
                  const flatLeft = arr(value?.left);
                  const flatRight = arr(value?.right);
                  onChange({ ...value, entries: [{ left: flatLeft, right: flatRight }], left: [], right: [] });
                }}
              />
            </div>
          </>
        ) : (
          <>
            <InspectorField label="Layout">
              <InspectorSelect
                value={value?.columns ?? "two"}
                onChange={(v) => onChange({ ...value, columns: v })}
                options={COLUMNS_MODE_OPTIONS}
              />
            </InspectorField>

            {value?.columns !== "one" && (
              <ItemOrderList
                left={arr(value?.left)}
                right={arr(value?.right)}
                onChange={(next) => onChange({ ...value, ...next })}
              />
            )}

            {gridEnabled ? (
              <ContentGridDnd
                left={arr(value?.left)}
                right={value?.columns === "one" ? [] : arr(value?.right)}
                grid={value?.grid}
                onGridChange={(g) => onChange({ ...value, grid: { ...(value?.grid ?? {}), ...g, enabled: true } })}
                onItemsChange={(next) =>
                  onChange({
                    ...value,
                    left: value?.columns === "one" ? [...next.left, ...next.right] : next.left,
                    right: value?.columns === "one" ? value?.right : next.right,
                  })
                }
              />
            ) : (
              <p className="text-[10px] text-muted-foreground/70">
                Use width / offset / gap fields on each item for precise free-flow layout. Enable Grid DnD for visual positioning.
              </p>
            )}

            <div className="space-y-4">
              <ColumnEditor
                label={value?.columns === "one" ? "Items" : "Left column"}
                items={arr(value?.left)}
                onChange={(next) => onChange({ ...value, left: next })}
              />

              {value?.columns === "one" ? null : (
                <>
                  <div className="h-px bg-border" />
                  <ColumnEditor
                    label="Right column"
                    items={arr(value?.right)}
                    onChange={(next) => onChange({ ...value, right: next })}
                  />
                </>
              )}
            </div>
          </>
        )}
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
