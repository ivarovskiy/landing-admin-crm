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
  BlockLayoutSection,
} from "@/components/inspector";
import { Type, Columns2, Image, Trash2 } from "lucide-react";
import { TYPO_OPTIONS } from "./hero-slider-presets";

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
        : { kind: "text", heading: "", body: "", mobileOrder: maxOrder + 1 };

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
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Image className="h-3 w-3" />
            Img
          </button>
          <button
            type="button"
            onClick={() => addItem("text")}
            className="ml-2 flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Type className="h-3 w-3" />
            Txt
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="space-y-2 rounded-md border bg-muted/10 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-muted text-[9px] font-bold">
                  {idx + 1}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {item.kind === "image" ? "Image" : "Text"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange(removeAt(items, idx))}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {item.kind === "image" ? (
              <>
                <InspectorInput
                  value={item.src ?? ""}
                  onChange={(v) => onChange(setAt(items, idx, { ...item, src: v }))}
                  placeholder="Image URL"
                />
                <InspectorInput
                  value={item.alt ?? ""}
                  onChange={(v) => onChange(setAt(items, idx, { ...item, alt: v }))}
                  placeholder="Alt text"
                />
                <InspectorSelect
                  value={item.aspectRatio ?? ""}
                  onChange={(v) => onChange(setAt(items, idx, { ...item, aspectRatio: v }))}
                  options={[{ value: "", label: "Auto (use w/h)" }, ...ASPECT_RATIOS]}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <div className="mb-1 text-[10px] text-muted-foreground">Image width</div>
                    <InspectorInput
                      value={item.imageWidth ?? ""}
                      onChange={(v) => onChange(setAt(items, idx, { ...item, imageWidth: v }))}
                      placeholder="420px"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] text-muted-foreground">Image height</div>
                    <InspectorInput
                      value={item.imageHeight ?? ""}
                      onChange={(v) => onChange(setAt(items, idx, { ...item, imageHeight: v }))}
                      placeholder="253px"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-muted-foreground">Image padding</div>
                  <InspectorInput
                    value={item.imagePadding ?? ""}
                    onChange={(v) => onChange(setAt(items, idx, { ...item, imagePadding: v }))}
                    placeholder="0 113px 33px 0"
                  />
                </div>
              </>
            ) : (
              <>
                <InspectorInput
                  value={item.heading ?? ""}
                  onChange={(v) => onChange(setAt(items, idx, { ...item, heading: v }))}
                  placeholder="Heading"
                />
                <InspectorTextarea
                  value={item.body ?? ""}
                  onChange={(v) => onChange(setAt(items, idx, { ...item, body: v }))}
                  placeholder="Body text..."
                  rows={3}
                />
                <div>
                  <div className="mb-1 text-[10px] text-muted-foreground">Text align</div>
                  <InspectorSelect
                    value={item.textAlign ?? ""}
                    onChange={(v) => onChange(setAt(items, idx, { ...item, textAlign: v || undefined }))}
                    options={TEXT_ALIGN_OPTIONS}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <div className="mb-1 text-[10px] text-muted-foreground">Heading typography</div>
                    <InspectorSelect
                      value={item.headingTypo ?? ""}
                      onChange={(v) => onChange(setAt(items, idx, { ...item, headingTypo: v || undefined }))}
                      options={TYPO_OPTIONS}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] text-muted-foreground">Heading stroke</div>
                    <InspectorInput
                      value={item.headingStrokeW ?? ""}
                      onChange={(v) => onChange(setAt(items, idx, { ...item, headingStrokeW: v || undefined }))}
                      placeholder="2.6px"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] text-muted-foreground">Body typography</div>
                    <InspectorSelect
                      value={item.bodyTypo ?? ""}
                      onChange={(v) => onChange(setAt(items, idx, { ...item, bodyTypo: v || undefined }))}
                      options={TYPO_OPTIONS}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] text-muted-foreground">Body stroke</div>
                    <InspectorInput
                      value={item.bodyStrokeW ?? ""}
                      onChange={(v) => onChange(setAt(items, idx, { ...item, bodyStrokeW: v || undefined }))}
                      placeholder="3.6px"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Mobile order</div>
                <InspectorNumber
                  value={item.mobileOrder}
                  onChange={(v) => onChange(setAt(items, idx, { ...item, mobileOrder: v ?? 0 }))}
                />
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Desktop align</div>
                <InspectorSelect
                  value={item?.layout?.lg?.align ?? "start"}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { align: v || undefined })))
                  }
                  options={ALIGN_OPTIONS}
                />
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Max width</div>
                <InspectorInput
                  value={item?.layout?.lg?.width ?? ""}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { width: v || undefined })))
                  }
                  placeholder="533px / 78%"
                />
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Gap (top)</div>
                <InspectorInput
                  value={item?.layout?.lg?.gapBefore ?? ""}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { gapBefore: v || undefined })))
                  }
                  placeholder="32px"
                />
              </div>

              <div className="col-span-2">
                <div className="mb-1 text-[10px] text-muted-foreground">Left offset</div>
                <InspectorInput
                  value={item?.layout?.lg?.offsetX ?? ""}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { offsetX: v || undefined })))
                  }
                  placeholder="72px"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntryEditor({
  entry,
  idx,
  onChange,
  onRemove,
}: {
  entry: { left: any[]; right: any[] };
  idx: number;
  onChange: (next: { left: any[]; right: any[] }) => void;
  onRemove: () => void;
}) {
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
  onChange,
}: {
  entries: { left: any[]; right: any[] }[];
  onChange: (next: { left: any[]; right: any[] }[]) => void;
}) {
  const addEntry = () => {
    onChange([...entries, { left: [], right: [] }]);
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <EntryEditor
          key={idx}
          entry={entry}
          idx={idx}
          onChange={(next) => onChange(setAt(entries, idx, next))}
          onRemove={() => onChange(removeAt(entries, idx))}
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

  return (
    <div>
      <InspectorSection title="Hero" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Hero align" hint="Default text-align for kicker / title / tagline">
          <InspectorSelect
            value={value?.heroAlign ?? ""}
            onChange={(v) => onChange({ ...value, heroAlign: v || undefined })}
            options={TEXT_ALIGN_OPTIONS}
          />
        </InspectorField>

        <InspectorField label="Kicker">
          <InspectorInput
            value={value?.kicker ?? ""}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="SUMMER PROGRAM"
          />
        </InspectorField>
        <div className="grid grid-cols-3 gap-1.5">
          <InspectorField label="Kicker typography">
            <InspectorSelect
              value={value?.kickerTypo ?? ""}
              onChange={(v) => onChange({ ...value, kickerTypo: v || undefined })}
              options={TYPO_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Kicker align">
            <InspectorSelect
              value={value?.kickerAlign ?? ""}
              onChange={(v) => onChange({ ...value, kickerAlign: v || undefined })}
              options={TEXT_ALIGN_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Stroke">
            <InspectorInput
              value={value?.kickerStrokeW ?? ""}
              onChange={(v) => onChange({ ...value, kickerStrokeW: v || undefined })}
              placeholder="2.6px"
            />
          </InspectorField>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Kicker gap (top)">
            <InspectorInput
              value={value?.kickerGap ?? ""}
              onChange={(v) => onChange({ ...value, kickerGap: v || undefined })}
              placeholder="0"
            />
          </InspectorField>
          <InspectorField label="Kicker max width">
            <InspectorInput
              value={value?.kickerMaxW ?? ""}
              onChange={(v) => onChange({ ...value, kickerMaxW: v || undefined })}
              placeholder="none"
            />
          </InspectorField>
        </div>

        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="NEW GUEST TEACHERS"
          />
        </InspectorField>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Title align">
            <InspectorSelect
              value={value?.titleAlign ?? ""}
              onChange={(v) => onChange({ ...value, titleAlign: v || undefined })}
              options={TEXT_ALIGN_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Title stroke">
            <InspectorInput
              value={value?.titleStrokeW ?? ""}
              onChange={(v) => onChange({ ...value, titleStrokeW: v || undefined })}
              placeholder="2.6px"
            />
          </InspectorField>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Title gap (top)">
            <InspectorInput
              value={value?.titleGap ?? ""}
              onChange={(v) => onChange({ ...value, titleGap: v || undefined })}
              placeholder="24px"
            />
          </InspectorField>
          <InspectorField label="Title max width">
            <InspectorInput
              value={value?.titleMaxW ?? ""}
              onChange={(v) => onChange({ ...value, titleMaxW: v || undefined })}
              placeholder="none"
            />
          </InspectorField>
        </div>

        <InspectorField label="Tagline">
          <InspectorInput
            value={value?.subtitle ?? ""}
            onChange={(v) => onChange({ ...value, subtitle: v })}
            placeholder="Sign up by June 15"
          />
        </InspectorField>
        <div className="grid grid-cols-3 gap-1.5">
          <InspectorField label="Tagline typography">
            <InspectorSelect
              value={value?.subtitleTypo ?? ""}
              onChange={(v) => onChange({ ...value, subtitleTypo: v || undefined })}
              options={TYPO_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Tagline align">
            <InspectorSelect
              value={value?.subtitleAlign ?? ""}
              onChange={(v) => onChange({ ...value, subtitleAlign: v || undefined })}
              options={TEXT_ALIGN_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Stroke">
            <InspectorInput
              value={value?.subtitleStrokeW ?? ""}
              onChange={(v) => onChange({ ...value, subtitleStrokeW: v || undefined })}
              placeholder="3.6px"
            />
          </InspectorField>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Tagline gap (top)">
            <InspectorInput
              value={value?.subtitleGap ?? ""}
              onChange={(v) => onChange({ ...value, subtitleGap: v || undefined })}
              placeholder="0"
            />
          </InspectorField>
          <InspectorField label="Tagline max width">
            <InspectorInput
              value={value?.subtitleMaxW ?? ""}
              onChange={(v) => onChange({ ...value, subtitleMaxW: v || undefined })}
              placeholder="none"
            />
          </InspectorField>
        </div>

        <InspectorField label="CTA label">
          <InspectorInput
            value={value?.cta?.label ?? ""}
            onChange={(v) => onChange({ ...value, cta: { ...value?.cta, label: v } })}
            placeholder="Studio Director"
          />
        </InspectorField>

        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="CTA href">
            <InspectorInput
              value={value?.cta?.href ?? ""}
              onChange={(v) => onChange({ ...value, cta: { ...value?.cta, href: v } })}
              placeholder="#"
            />
          </InspectorField>
          <InspectorField label="CTA align">
            <InspectorSelect
              value={value?.ctaAlign ?? ""}
              onChange={(v) => onChange({ ...value, ctaAlign: v || undefined })}
              options={TEXT_ALIGN_OPTIONS}
            />
          </InspectorField>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="CTA gap (top)">
            <InspectorInput
              value={value?.ctaGap ?? ""}
              onChange={(v) => onChange({ ...value, ctaGap: v || undefined })}
              placeholder="12px"
            />
          </InspectorField>
          <InspectorField label="CTA max width">
            <InspectorInput
              value={value?.ctaMaxW ?? ""}
              onChange={(v) => onChange({ ...value, ctaMaxW: v || undefined })}
              placeholder="none"
            />
          </InspectorField>
        </div>

        <InspectorField label="Document box">
          <InspectorToggle
            checked={!!value?.boxed}
            onChange={(v) => onChange({ ...value, boxed: v })}
            label="Boxed with clip"
          />
        </InspectorField>

        <InspectorField label="Max width">
          <InspectorInput
            value={value?.maxWidth ?? ""}
            onChange={(v) => onChange({ ...value, maxWidth: v })}
            placeholder="1360px (default)"
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Content" icon={<Columns2 className="h-3 w-3" />}>
        <InspectorField label="Scroll Story">
          <InspectorToggle
            checked={scrollStory}
            onChange={(v) => onChange({ ...value, scrollStory: v })}
            label="Enable per-entry sticky scroll"
          />
        </InspectorField>

        {scrollStory ? (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <InspectorField label="Sticky top offset">
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
                onChange={(next) => onChange({ ...value, entries: next })}
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

            <div className="mb-2 text-[10px] text-muted-foreground">
              Mobile order = цифри з макета. Desktop width / offset / top gap = вільна композиція без grid.
            </div>

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
