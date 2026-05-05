"use client";

import type { BlockFormProps } from "./index";
import { arr, setAt, removeAt } from "@/lib/array";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
  InspectorToggle,
  BlockLayoutSection,
  ImageUpload,
} from "@/components/inspector";
import { Type, Image, Paperclip, Trash2, Plus } from "lucide-react";

const ANIMATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade-in", label: "Fade in" },
  { value: "slide-up", label: "Slide up" },
];

const ASPECT_RATIO_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "3/4", label: "3:4 — Portrait" },
  { value: "4/3", label: "4:3 — Landscape" },
  { value: "1/1", label: "1:1 — Square" },
  { value: "2/3", label: "2:3 — Tall" },
  { value: "3/2", label: "3:2 — Photo" },
];

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "")
    : "";

export function NewStudentMemoV1Form({ value, onChange }: BlockFormProps) {
  const sections: { heading?: string; body?: string }[] = arr(value?.sections);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────── */}
      <InspectorSection title="Header" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Kicker">
          <InspectorInput
            value={value?.kicker ?? ""}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="Parent Portal"
          />
        </InspectorField>

        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="New Student Memo"
          />
        </InspectorField>

        <InspectorField label="Subtitle">
          <InspectorInput
            value={value?.subtitle ?? ""}
            onChange={(v) => onChange({ ...value, subtitle: v })}
            placeholder="Welcome to Simply Dance!"
          />
        </InspectorField>
      </InspectorSection>

      {/* ── Image ───────────────────────────────────────── */}
      <InspectorSection title="Image" icon={<Image className="h-3 w-3" />}>
        <InspectorField label="Photo">
          <ImageUpload
            value={value?.image?.src ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...value?.image, src: v } })}
            apiBase={API_BASE}
          />
        </InspectorField>

        <InspectorField label="Alt text">
          <InspectorInput
            value={value?.image?.alt ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...value?.image, alt: v } })}
            placeholder="Photo description"
          />
        </InspectorField>

        <InspectorField label="Animation">
          <InspectorSelect
            value={value?.image?.animation ?? "none"}
            onChange={(v) => onChange({ ...value, image: { ...value?.image, animation: v || "none" } })}
            options={ANIMATION_OPTIONS}
          />
        </InspectorField>

        <InspectorField label="Aspect ratio">
          <InspectorSelect
            value={value?.image?.aspectRatio ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...value?.image, aspectRatio: v || undefined } })}
            options={ASPECT_RATIO_OPTIONS}
          />
        </InspectorField>

        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Width">
            <InspectorInput
              value={value?.image?.width ?? ""}
              onChange={(v) => onChange({ ...value, image: { ...value?.image, width: v || undefined } })}
              placeholder="380px"
            />
          </InspectorField>
          <InspectorField label="Height">
            <InspectorInput
              value={value?.image?.height ?? ""}
              onChange={(v) => onChange({ ...value, image: { ...value?.image, height: v || undefined } })}
              placeholder="auto"
            />
          </InspectorField>
        </div>
      </InspectorSection>

      {/* ── Clip icon ───────────────────────────────────── */}
      <InspectorSection title="Clip icon" icon={<Paperclip className="h-3 w-3" />}>
        <p className="text-[10px] text-muted-foreground mb-2">
          Custom paperclip icon. Leave empty to use the default SVG.
        </p>

        <InspectorField label="Icon image">
          <ImageUpload
            value={value?.clip?.src ?? ""}
            onChange={(v) => onChange({ ...value, clip: { ...value?.clip, src: v } })}
            placeholder="Drop icon or click to upload"
            apiBase={API_BASE}
          />
        </InspectorField>

        <InspectorField label="Alt text">
          <InspectorInput
            value={value?.clip?.alt ?? ""}
            onChange={(v) => onChange({ ...value, clip: { ...value?.clip, alt: v } })}
            placeholder=""
          />
        </InspectorField>

        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Width">
            <InspectorInput
              value={value?.clip?.width ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...value?.clip, width: v || undefined } })}
              placeholder="52px"
            />
          </InspectorField>
          <InspectorField label="Height">
            <InspectorInput
              value={value?.clip?.height ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...value?.clip, height: v || undefined } })}
              placeholder="77px"
            />
          </InspectorField>
        </div>
      </InspectorSection>

      {/* ── Text sections ───────────────────────────────── */}
      <InspectorSection title="Text sections" icon={<Type className="h-3 w-3" />}>
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div key={idx} className="rounded-md border bg-muted/10 p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Section {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, sections: removeAt(sections, idx) })}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <InspectorInput
                value={section.heading ?? ""}
                onChange={(v) =>
                  onChange({ ...value, sections: setAt(sections, idx, { ...section, heading: v || undefined }) })
                }
                placeholder="Section heading (optional)"
              />

              <InspectorTextarea
                value={section.body ?? ""}
                onChange={(v) =>
                  onChange({ ...value, sections: setAt(sections, idx, { ...section, body: v }) })
                }
                placeholder="Body text. Separate paragraphs with a blank line."
                rows={4}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              onChange({ ...value, sections: [...sections, { heading: "", body: "" }] })
            }
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add section
          </button>
        </div>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
