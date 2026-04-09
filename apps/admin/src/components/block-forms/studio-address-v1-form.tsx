"use client";

import type { BlockFormProps } from "./index";
import { arr, setAt, removeAt } from "@/lib/array";
import { updatePath } from "@/lib/update-path";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
  InspectorToggle,
  BlockLayoutSection,
} from "@/components/inspector";
import { MapPin, Phone, Share2, Plus, Trash2, Type } from "lucide-react";

type Social = { icon?: "instagram" | "facebook"; href?: string; label?: string };

export function StudioAddressV1Form({ value, onChange }: BlockFormProps) {
  const addressLines: string[] = arr(value?.addressLines) as string[];
  const notes: string[] = arr(value?.notes) as string[];
  const socials: Social[] = arr(value?.socials) as Social[];
  const map = value?.map ?? {};
  const contacts = value?.contacts ?? {};

  const set = (path: (string | number)[], v: unknown) =>
    onChange(updatePath(value, path, v));

  return (
    <div>
      <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => set(["title"], v)}
            placeholder="STUDIO ADDRESS"
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
              onChange={(v) => set(["subtitle"], v)}
              placeholder="Section description..."
              rows={2}
            />
          </InspectorField>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Map" icon={<MapPin className="h-3 w-3" />} defaultOpen={false}>
        <InspectorField label="Embed URL" stacked>
          <InspectorInput
            value={map?.embedUrl ?? ""}
            onChange={(v) => set(["map", "embedUrl"], v)}
            placeholder="https://google.com/maps/embed?..."
          />
        </InspectorField>

        <InspectorField label="Image" stacked>
          <InspectorInput
            value={map?.imageSrc ?? ""}
            onChange={(v) => set(["map", "imageSrc"], v)}
            placeholder="Fallback image URL"
          />
        </InspectorField>

        <InspectorField label="Alt">
          <InspectorInput
            value={map?.alt ?? ""}
            onChange={(v) => set(["map", "alt"], v)}
            placeholder="Studio map"
          />
        </InspectorField>

        <InspectorField label="Link URL" stacked>
          <InspectorInput
            value={map?.linkUrl ?? ""}
            onChange={(v) => set(["map", "linkUrl"], v)}
            placeholder="https://maps.google.com/?q=..."
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection
        title="Address"
        icon={<MapPin className="h-3 w-3" />}
        badge={
          <button
            type="button"
            onClick={() => set(["addressLines"], [...addressLines, ""])}
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
          </button>
        }
      >
        <div className="space-y-1.5">
          {addressLines.map((l, idx) => (
            <div key={idx} className="flex gap-1.5">
              <InspectorInput
                value={l ?? ""}
                onChange={(v) => set(["addressLines", idx], v)}
                placeholder={idx === 0 ? "580 LANCASTER AVE" : "MALVERN, PA 19455"}
              />
              <button
                type="button"
                onClick={() => set(["addressLines"], removeAt(addressLines, idx))}
                className="text-muted-foreground hover:text-red-500 shrink-0 pt-1.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </InspectorSection>

      <InspectorSection
        title="Notes (desktop)"
        defaultOpen={false}
        badge={
          <button
            type="button"
            onClick={() => set(["notes"], [...notes, ""])}
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
          </button>
        }
      >
        <div className="space-y-1.5">
          {notes.map((l, idx) => (
            <div key={idx} className="flex gap-1.5">
              <InspectorInput
                value={l ?? ""}
                onChange={(v) => set(["notes", idx], v)}
                placeholder="ACROSS FROM WAWA"
              />
              <button
                type="button"
                onClick={() => set(["notes"], removeAt(notes, idx))}
                className="text-muted-foreground hover:text-red-500 shrink-0 pt-1.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </InspectorSection>

      <InspectorSection
        title="Socials"
        icon={<Share2 className="h-3 w-3" />}
        badge={
          <button
            type="button"
            onClick={() => set(["socials"], [...socials, { icon: "instagram", href: "", label: "" }])}
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
          </button>
        }
      >
        <div className="space-y-2">
          {socials.map((s, idx) => (
            <div key={idx} className="rounded-md border p-2 space-y-1.5 bg-muted/10">
              <div className="flex items-center justify-between">
                <InspectorSelect
                  value={s?.icon ?? "instagram"}
                  onChange={(v) => set(["socials", idx, "icon"], v)}
                  options={[
                    { value: "instagram", label: "Instagram" },
                    { value: "facebook", label: "Facebook" },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => set(["socials"], removeAt(socials, idx))}
                  className="text-muted-foreground hover:text-red-500 shrink-0 ml-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <InspectorInput
                value={s?.href ?? ""}
                onChange={(v) => set(["socials", idx, "href"], v)}
                placeholder="https://..."
              />
              <InspectorInput
                value={s?.label ?? ""}
                onChange={(v) => set(["socials", idx, "label"], v)}
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </InspectorSection>

      <InspectorSection title="Contacts" icon={<Phone className="h-3 w-3" />}>
        <InspectorField label="Phone">
          <InspectorInput
            value={contacts?.phone ?? ""}
            onChange={(v) => set(["contacts", "phone"], v)}
            placeholder="(610) 883-0878"
          />
        </InspectorField>

        <InspectorField label="Email">
          <InspectorInput
            value={contacts?.email ?? ""}
            onChange={(v) => set(["contacts", "email"], v)}
            placeholder="info@example.com"
          />
        </InspectorField>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
