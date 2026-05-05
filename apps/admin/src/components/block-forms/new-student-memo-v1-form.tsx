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
  InspectorColorInput,
  BlockLayoutSection,
  ImageUpload,
} from "@/components/inspector";
import { Type, Image, Paperclip, Trash2, Plus, ALargeSmall } from "lucide-react";

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

        <p className="text-[10px] text-muted-foreground mt-2 mb-1">
          Position (overrides defaults: top&nbsp;−24px, right&nbsp;−18px)
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Top">
            <InspectorInput
              value={value?.clip?.top ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...value?.clip, top: v || undefined } })}
              placeholder="-24px"
            />
          </InspectorField>
          <InspectorField label="Right">
            <InspectorInput
              value={value?.clip?.right ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...value?.clip, right: v || undefined } })}
              placeholder="-18px"
            />
          </InspectorField>
          <InspectorField label="Bottom">
            <InspectorInput
              value={value?.clip?.bottom ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...value?.clip, bottom: v || undefined } })}
              placeholder=""
            />
          </InspectorField>
          <InspectorField label="Left">
            <InspectorInput
              value={value?.clip?.left ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...value?.clip, left: v || undefined } })}
              placeholder=""
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

      {/* ── Typography ──────────────────────────────────── */}
      <InspectorSection title="Typography" icon={<ALargeSmall className="h-3 w-3" />} defaultOpen={false}>
        <TypoElementRow
          label="Kicker"
          value={value?.typo?.kicker}
          onChange={(v) => onChange({ ...value, typo: { ...value?.typo, kicker: v } })}
          defaults={{ size: "11–13px", letterSpacing: "0.18em" }}
        />
        <TypoElementRow
          label="Title"
          value={value?.typo?.title}
          onChange={(v) => onChange({ ...value, typo: { ...value?.typo, title: v } })}
          defaults={{ size: "clamp(48px,7.5vw,104px)", lineHeight: "0.92", letterSpacing: "0.02em" }}
        />
        <TypoElementRow
          label="Subtitle"
          value={value?.typo?.subtitle}
          onChange={(v) => onChange({ ...value, typo: { ...value?.typo, subtitle: v } })}
          defaults={{ size: "clamp(16px,1.8vw,24px)", fontStyle: "italic" }}
        />
        <TypoElementRow
          label="Section title"
          value={value?.typo?.sectionTitle}
          onChange={(v) => onChange({ ...value, typo: { ...value?.typo, sectionTitle: v } })}
          defaults={{ size: "13–15px", letterSpacing: "0.12em" }}
        />
        <TypoElementRow
          label="Body text"
          value={value?.typo?.bodyText}
          onChange={(v) => onChange({ ...value, typo: { ...value?.typo, bodyText: v } })}
          defaults={{ size: "13–15px", lineHeight: "1.65" }}
        />
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}

type TypoElementValue = {
  size?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  fontStyle?: string;
  fontWeight?: string;
};

function TypoElementRow({
  label,
  value,
  onChange,
  defaults,
}: {
  label: string;
  value: TypoElementValue | undefined;
  onChange: (v: TypoElementValue | undefined) => void;
  defaults: { size?: string; lineHeight?: string; letterSpacing?: string; fontStyle?: string };
}) {
  const v = value ?? {};
  const set = (key: keyof TypoElementValue, val: string) =>
    onChange({ ...v, [key]: val || undefined });

  return (
    <div className="rounded-md border bg-muted/10 p-2 space-y-1.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>

      <div className="grid grid-cols-2 gap-1.5">
        <InspectorField label="Size">
          <InspectorInput
            value={v.size ?? ""}
            onChange={(val) => set("size", val)}
            placeholder={defaults.size ?? ""}
          />
        </InspectorField>
        <InspectorField label="Weight">
          <InspectorInput
            value={v.fontWeight ?? ""}
            onChange={(val) => set("fontWeight", val)}
            placeholder="400"
          />
        </InspectorField>
        <InspectorField label="Line-h">
          <InspectorInput
            value={v.lineHeight ?? ""}
            onChange={(val) => set("lineHeight", val)}
            placeholder={defaults.lineHeight ?? ""}
          />
        </InspectorField>
        <InspectorField label="Spacing">
          <InspectorInput
            value={v.letterSpacing ?? ""}
            onChange={(val) => set("letterSpacing", val)}
            placeholder={defaults.letterSpacing ?? ""}
          />
        </InspectorField>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <InspectorField label="Style">
          <InspectorSelect
            value={v.fontStyle ?? ""}
            onChange={(val) => set("fontStyle", val)}
            options={[
              { value: "", label: "Normal" },
              { value: "italic", label: "Italic" },
              { value: "oblique", label: "Oblique" },
            ]}
          />
        </InspectorField>
        <InspectorField label="Color">
          <InspectorColorInput
            value={v.color ?? ""}
            onChange={(val) => set("color", val)}
            placeholder="var(--color-primary)"
          />
        </InspectorField>
      </div>
    </div>
  );
}
