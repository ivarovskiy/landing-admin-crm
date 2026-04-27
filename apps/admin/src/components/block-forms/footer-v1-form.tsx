"use client";

import type { BlockFormProps } from "./index";
import { arr, removeAt } from "@/lib/array";
import { updatePath } from "@/lib/update-path";
import { LogoField, normalizeLogo } from "./logo-field";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
  BlockLayoutSection,
  HrefInput,
} from "@/components/inspector";
import { LayoutGrid, Link2, Megaphone, Plus, Trash2, Type } from "lucide-react";

type Link = { label?: string; href?: string; noLink?: boolean };
type Column = { links?: Link[] };

export function FooterV1Form({ value, onChange }: BlockFormProps) {
  const left = value?.left ?? {};
  const right = value?.right ?? {};
  const portal = right?.portal ?? {};
  const promo = right?.promo ?? {};
  const columns: Column[] = arr<Column>(value?.columns);
  const bottomText: string = value?.bottomText ?? "";
  const leftLogo = normalizeLogo(left?.logo);
  const promoLogo = normalizeLogo(promo?.logo);

  const set = (path: (string | number)[], v: unknown) =>
    onChange(updatePath(value, path, v));

  return (
    <div>
      <InspectorSection title="Brand (Left)" icon={<LayoutGrid className="h-3 w-3" />}>
        <InspectorField label="Href">
          <HrefInput
            hrefValue={left?.href ?? ""}
            noLink={!!left?.noLink}
            onHrefChange={(v) => set(["left", "href"], v)}
            onNoLinkChange={(v) => set(["left", "noLink"], v || undefined)}
            placeholder="#top"
          />
        </InspectorField>

        <InspectorField label="Logo" stacked>
          <LogoField
            value={promoLogo}
            onChange={(next) => set(["right", "promo", "logo"], next)}
            assetPlaceholder="ibc-ballet-pre"
            altPlaceholder="IBC Ballet Pre-Professional"
          />
        </InspectorField>

        <InspectorField label="Logo text">
          <InspectorInput
            value={left?.logoText ?? ""}
            onChange={(v) => set(["left", "logoText"], v)}
            placeholder="IBC BALLET"
          />
        </InspectorField>

        <InspectorField label="Sub text">
          <InspectorInput
            value={left?.subText ?? ""}
            onChange={(v) => set(["left", "subText"], v)}
            placeholder="PRE-PROFESSIONAL"
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection
        title="Link Columns"
        icon={<Link2 className="h-3 w-3" />}
        badge={
          <button
            type="button"
            onClick={() => set(["columns"], [...columns, { links: [{ label: "", href: "" }] }])}
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
            Col
          </button>
        }
      >
        <div className="space-y-3">
          {columns.map((col, colIdx) => {
            const links: Link[] = arr<Link>(col?.links);
            return (
              <div key={colIdx} className="rounded-md border p-2 space-y-1.5 bg-muted/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Column {colIdx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        set(["columns", colIdx, "links"], [...links, { label: "", href: "" }])
                      }
                      className="text-primary hover:text-primary/80"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => set(["columns"], removeAt(columns, colIdx))}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {links.map((l, linkIdx) => (
                  <div key={linkIdx} className="flex gap-1">
                    <InspectorInput
                      value={l?.label ?? ""}
                      onChange={(v) => set(["columns", colIdx, "links", linkIdx, "label"], v)}
                      placeholder="Label"
                    />
                    <div className="flex-1">
                      <HrefInput
                        hrefValue={l?.href ?? ""}
                        noLink={!!l?.noLink}
                        onHrefChange={(v) => set(["columns", colIdx, "links", linkIdx, "href"], v)}
                        onNoLinkChange={(v) =>
                          set(["columns", colIdx, "links", linkIdx, "noLink"], v || undefined)
                        }
                        placeholder="Href"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        set(["columns", colIdx, "links"], removeAt(links, linkIdx))
                      }
                      className="text-muted-foreground hover:text-red-500 shrink-0 pt-1.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </InspectorSection>

      <InspectorSection title="Portal + Promo" icon={<Megaphone className="h-3 w-3" />} defaultOpen={false}>
        {/* Portal */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Portal
          </span>
          <InspectorInput
            value={portal?.label ?? ""}
            onChange={(v) => set(["right", "portal", "label"], v)}
            placeholder="Label"
          />
          <HrefInput
            hrefValue={portal?.href ?? ""}
            noLink={!!portal?.noLink}
            onHrefChange={(v) => set(["right", "portal", "href"], v)}
            onNoLinkChange={(v) => set(["right", "portal", "noLink"], v || undefined)}
            placeholder="Href"
          />
          <InspectorSelect
            value={portal?.icon ?? "lock"}
            onChange={(v) => set(["right", "portal", "icon"], v)}
            options={[
              { value: "lock", label: "Lock" },
              { value: "unlock", label: "Unlock" },
            ]}
          />
        </div>

        {/* Promo */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Promo
          </span>
          <InspectorInput
            value={promo?.label ?? ""}
            onChange={(v) => set(["right", "promo", "label"], v)}
            placeholder="Label"
          />
          <HrefInput
            hrefValue={promo?.href ?? ""}
            noLink={!!promo?.noLink}
            onHrefChange={(v) => set(["right", "promo", "href"], v)}
            onNoLinkChange={(v) => set(["right", "promo", "noLink"], v || undefined)}
            placeholder="Href"
          />
          <LogoField
            value={leftLogo}
            onChange={(next) => set(["left", "logo"], next)}
            assetPlaceholder="simply-dance"
            altPlaceholder="Simply Dance Studio"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorInput
              value={promo?.logoText ?? ""}
              onChange={(v) => set(["right", "promo", "logoText"], v)}
              placeholder="Logo text"
            />
            <InspectorInput
              value={promo?.subText ?? ""}
              onChange={(v) => set(["right", "promo", "subText"], v)}
              placeholder="Sub text"
            />
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Bottom" icon={<Type className="h-3 w-3" />} defaultOpen={false}>
        <InspectorField label="Text" stacked>
          <InspectorTextarea
            value={bottomText}
            onChange={(v) => set(["bottomText"], v)}
            placeholder="Copyright © 2024..."
            rows={2}
          />
        </InspectorField>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
