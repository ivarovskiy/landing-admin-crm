"use client";

import { Button } from "@acme/ui";
import type { BlockFormProps } from "./index";
import type { BlockHide } from "@/types/block";
import { arr, setAt, removeAt } from "@/lib/array";
import { toggleHideMobile, toggleHideDesktop } from "@/lib/visibility";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorNumber,
  InspectorTextarea,
  InspectorSelect,
  InspectorResponsiveToggle,
  BlockLayoutSection,
} from "@/components/inspector";
import { Type, Grid3X3, Plus, Trash2, Smartphone, Monitor, SlidersHorizontal } from "lucide-react";
// Smartphone + Monitor still used in item visibility rows below


function newItem() {
  return {
    title: "FEATURE TITLE",
    text: "",
    icon: "ballet-bar",
    _layout: { hide: {} },
  };
}

const ICONS = [
  { value: "ballet-bar", label: "Ballet bar" },
  { value: "ballet-shoes", label: "Ballet shoes" },
  { value: "prize-cup", label: "Prize cup" },
];

export function FeaturesV1Form({ value, onChange, viewMode }: BlockFormProps) {
  const items = arr(value?.items);
  const autoPlayMs = Number(value?.options?.autoPlayMs ?? 4000);

  return (
    <div>
      <InspectorSection
        title="Options"
        icon={<SlidersHorizontal className="h-3 w-3" />}
        defaultOpen={false}
      >
        <InspectorField label="Autoplay (mobile)">
          <InspectorNumber
            value={autoPlayMs || undefined}
            onChange={(v) => onChange({ ...value, options: { ...value?.options, autoPlayMs: v ?? 4000 } })}
            placeholder="0 = off, 4000 = 4s"
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="OUR SCHOOL"
          />
        </InspectorField>

        {(() => {
          const subtitleHide: BlockHide = value?.subtitleHide
            ?? (value?.showSubtitle === false ? { base: true, md: true, lg: true } : {});
          return (
            <>
              <InspectorResponsiveToggle
                label="Tagline"
                hide={subtitleHide}
                viewMode={viewMode}
                onChange={(next) => onChange({ ...value, subtitleHide: next, showSubtitle: undefined })}
              />
              <InspectorField label="" stacked>
                <InspectorTextarea
                  value={value?.subtitle ?? ""}
                  onChange={(v) => onChange({ ...value, subtitle: v })}
                  placeholder="Join to enhance your technique..."
                  rows={2}
                />
              </InspectorField>
            </>
          );
        })()}
      </InspectorSection>

      <InspectorSection
        title="Items"
        icon={<Grid3X3 className="h-3 w-3" />}
        badge={
          <button
            type="button"
            onClick={() => onChange({ ...value, items: [...items, newItem()] })}
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        }
      >
        <div className="space-y-2">
          {items.map((it: any, idx: number) => {
            const hide: BlockHide = it?._layout?.hide ?? {};
            const mobileHidden = hide.base === true;
            const desktopHidden = hide.md === true && hide.lg === true;

            return (
              <div key={idx} className="rounded-md border p-2.5 space-y-2 bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Item {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextHide = toggleHideMobile(hide);
                        const nextItem = { ...it, _layout: { ...(it?._layout ?? {}), hide: nextHide } };
                        onChange({ ...value, items: setAt(items, idx, nextItem) });
                      }}
                      className={mobileHidden ? "text-muted-foreground/30" : "text-emerald-500"}
                      title={mobileHidden ? "Hidden on mobile" : "Visible on mobile"}
                    >
                      <Smartphone className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextHide = toggleHideDesktop(hide);
                        const nextItem = { ...it, _layout: { ...(it?._layout ?? {}), hide: nextHide } };
                        onChange({ ...value, items: setAt(items, idx, nextItem) });
                      }}
                      className={desktopHidden ? "text-muted-foreground/30" : "text-blue-500"}
                      title={desktopHidden ? "Hidden on desktop" : "Visible on desktop"}
                    >
                      <Monitor className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...value, items: removeAt(items, idx) })}
                      className="text-muted-foreground hover:text-red-500 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <InspectorInput
                  value={it?.title ?? ""}
                  onChange={(v) =>
                    onChange({ ...value, items: setAt(items, idx, { ...it, title: v }) })
                  }
                  placeholder="BRAND NEW FACILITY"
                />

                <InspectorTextarea
                  value={it?.text ?? ""}
                  onChange={(v) =>
                    onChange({ ...value, items: setAt(items, idx, { ...it, text: v }) })
                  }
                  placeholder="Description..."
                  rows={2}
                />

                <InspectorSelect
                  value={it?.icon ?? "ballet-bar"}
                  onChange={(v) =>
                    onChange({ ...value, items: setAt(items, idx, { ...it, icon: v }) })
                  }
                  options={ICONS}
                />
              </div>
            );
          })}
        </div>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}

