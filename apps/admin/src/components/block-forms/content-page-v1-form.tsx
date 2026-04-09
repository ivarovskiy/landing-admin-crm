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
                  <div className="mb-1 text-[10px] text-muted-foreground">Max width</div>
                  <InspectorInput
                    value={item.textMaxWidth ?? ""}
                    onChange={(v) => onChange(setAt(items, idx, { ...item, textMaxWidth: v || undefined }))}
                    placeholder="533px"
                  />
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
                <div className="mb-1 text-[10px] text-muted-foreground">Desktop width</div>
                <InspectorInput
                  value={item?.layout?.lg?.width ?? ""}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { width: v || undefined })))
                  }
                  placeholder="342px / 78%"
                />
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Left offset</div>
                <InspectorInput
                  value={item?.layout?.lg?.offsetX ?? ""}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { offsetX: v || undefined })))
                  }
                  placeholder="72px"
                />
              </div>

              <div className="col-span-2">
                <div className="mb-1 text-[10px] text-muted-foreground">Top gap before item</div>
                <InspectorInput
                  value={item?.layout?.lg?.gapBefore ?? ""}
                  onChange={(v) =>
                    onChange(setAt(items, idx, updateDesktopLayout(item, { gapBefore: v || undefined })))
                  }
                  placeholder="32px"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContentPageV1Form({ value, onChange }: BlockFormProps) {
  const left = arr(value?.left);
  const right = arr(value?.right);

  return (
    <div>
      <InspectorSection title="Hero" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Kicker">
          <InspectorInput
            value={value?.kicker ?? ""}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="SUMMER PROGRAM"
          />
        </InspectorField>

        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="NEW GUEST TEACHERS"
          />
        </InspectorField>

        <InspectorField label="Tagline">
          <InspectorInput
            value={value?.subtitle ?? ""}
            onChange={(v) => onChange({ ...value, subtitle: v })}
            placeholder="Sign up by June 15"
          />
        </InspectorField>

        <InspectorField label="CTA label">
          <InspectorInput
            value={value?.cta?.label ?? ""}
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

        <InspectorField label="Max width">
          <InspectorInput
            value={value?.maxWidth ?? ""}
            onChange={(v) => onChange({ ...value, maxWidth: v })}
            placeholder="1360px (default)"
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Columns" icon={<Columns2 className="h-3 w-3" />}>
        <div className="mb-2 text-[10px] text-muted-foreground">
          Mobile order = цифри з макета. Desktop width / offset / top gap = вільна композиція без grid.
        </div>

        <div className="space-y-4">
          <ColumnEditor
            label="Left column"
            items={left}
            onChange={(next) => onChange({ ...value, left: next })}
          />

          <div className="h-px bg-border" />

          <ColumnEditor
            label="Right column"
            items={right}
            onChange={(next) => onChange({ ...value, right: next })}
          />
        </div>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
