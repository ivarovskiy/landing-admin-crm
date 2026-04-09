"use client";

import type { BlockFormProps } from "./index";
import { setAt } from "@/lib/array";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorToggle,
  BlockLayoutSection,
} from "@/components/inspector";
import { Grid3X3, Image, Type } from "lucide-react";

type ScrapbookItem = {
  src?: string;
  alt?: string;
  href?: string;
};

const SLOT_LABELS = [
  "Slot 1 — tall left",
  "Slot 2 — top / col 2",
  "Slot 3 — top / col 3",
  "Slot 4 — top / col 4",
  "Slot 5 — middle / col 2",
  "Slot 6 — large right block",
  "Slot 7 — bottom / col 1",
  "Slot 8 — bottom / col 2",
] as const;

function ensureItems(value: any): ScrapbookItem[] {
  const items = Array.isArray(value?.items) ? value.items : [];

  return Array.from({ length: 8 }, (_, idx) => {
    const item = items[idx];
    if (!item || typeof item !== "object") return { src: "", alt: "", href: "" };
    return {
      src: item.src ?? "",
      alt: item.alt ?? "",
      href: item.href ?? "",
    };
  });
}

export function ScrapbookV1Form({ value, onChange }: BlockFormProps) {
  const items = ensureItems(value);

  const updateItem = (idx: number, patch: Partial<ScrapbookItem>) => {
    onChange({
      ...value,
      items: setAt(items, idx, { ...items[idx], ...patch }),
    });
  };

  return (
    <div>
      <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="SCRAPBOOK"
          />
        </InspectorField>

        <InspectorField label="Show tagline">
          <InspectorToggle
            checked={value?.showSubtitle ?? false}
            onChange={(v) => onChange({ ...value, showSubtitle: v })}
          />
        </InspectorField>

        {value?.showSubtitle ? (
          <InspectorField label="Tagline" stacked>
            <InspectorTextarea
              value={value?.subtitle ?? ""}
              onChange={(v) => onChange({ ...value, subtitle: v })}
              placeholder="Section description..."
              rows={2}
            />
          </InspectorField>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Grid" icon={<Grid3X3 className="h-3 w-3" />}>
        <div className="mb-2 text-[10px] text-muted-foreground">
          Базова логіка зараз фіксована: 8 слотів у цьому mosaic-layout. Поки що міняємо тільки зображення, alt і href.
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-md border p-2.5 space-y-2 bg-muted/10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Image className="h-3 w-3" />
                {SLOT_LABELS[idx]}
              </div>

              <InspectorInput
                value={item.src ?? ""}
                onChange={(v) => updateItem(idx, { src: v })}
                placeholder="Image URL"
              />

              <InspectorInput
                value={item.alt ?? ""}
                onChange={(v) => updateItem(idx, { alt: v })}
                placeholder="Alt text"
              />

              <InspectorInput
                value={item.href ?? ""}
                onChange={(v) => updateItem(idx, { href: v })}
                placeholder="Optional link"
              />
            </div>
          ))}
        </div>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
