"use client";

import type { BlockFormProps } from "./index";
import {
  BlockLayoutSection,
  ImageUpload,
  InspectorField,
  InspectorInput,
  InspectorSelect,
  InspectorSegment,
  InspectorSection,
} from "@/components/inspector";
import { Image as ImageIcon, Maximize2 } from "lucide-react";
import { AdvancedPanel, FieldGrid, PresetButton, PresetRow } from "./admin-control-kit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const ASPECT_RATIOS = [
  { value: "", label: "Auto" },
  { value: "16/9", label: "16:9 Wide" },
  { value: "4/3", label: "4:3" },
  { value: "3/2", label: "3:2" },
  { value: "1/1", label: "1:1 Square" },
  { value: "3/4", label: "3:4 Portrait" },
  { value: "2/3", label: "2:3 Tall" },
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const OBJECT_FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
];

const FRAME_OPTIONS = [
  { value: "none", label: "None" },
  { value: "line", label: "Line" },
  { value: "soft", label: "Soft" },
];

const WIDTH_PRESETS = [
  { label: "Small", value: "420px" },
  { label: "Medium", value: "720px" },
  { label: "Large", value: "960px" },
  { label: "Full", value: "100%" },
];

const SPACE_PRESETS = [
  { label: "Tight", value: "clamp(32px, 4vw, 56px)" },
  { label: "Normal", value: "clamp(48px, 6vw, 88px)" },
  { label: "Roomy", value: "clamp(72px, 8vw, 120px)" },
];

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

export function ImageBlockV1Form({ value, onChange }: BlockFormProps) {
  const widthValue = value?.maxWidth ?? value?.width ?? "";

  return (
    <div>
      <InspectorSection title="Image" icon={<ImageIcon className="h-3 w-3" />}>
        <ImageUpload
          value={value?.src ?? ""}
          apiBase={API_BASE}
          onChange={(src) => onChange({ ...value, src })}
          onAssetUploaded={(asset) => {
            const aspectRatio = asset.width && asset.height ? `${asset.width}/${asset.height}` : value?.aspectRatio;
            onChange({ ...value, src: asset.url, aspectRatio });
          }}
        />

        <InspectorField label="Alt">
          <InspectorInput
            value={value?.alt ?? ""}
            onChange={(v) => onChange({ ...value, alt: v })}
            placeholder="Describe the image"
          />
        </InspectorField>

        <InspectorField label="Caption">
          <InspectorInput
            value={value?.caption ?? ""}
            onChange={(v) => onChange({ ...value, caption: v || undefined })}
            placeholder="Optional caption"
          />
        </InspectorField>

        <InspectorField label="Link">
          <InspectorInput
            value={value?.href ?? ""}
            onChange={(v) => onChange({ ...value, href: v || undefined })}
            placeholder="https://..."
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Size" icon={<Maximize2 className="h-3 w-3" />}>
        <PresetRow label="Width">
          <PresetButtons
            value={widthValue}
            presets={WIDTH_PRESETS}
            onChange={(v) => onChange({ ...value, width: v, maxWidth: v })}
          />
        </PresetRow>

        <FieldGrid>
          <InspectorField label="Align">
            <InspectorSegment
              value={value?.align ?? "center"}
              onChange={(v) => onChange({ ...value, align: v })}
              options={ALIGN_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Fit">
            <InspectorSelect
              value={value?.objectFit ?? "cover"}
              onChange={(v) => onChange({ ...value, objectFit: v })}
              options={OBJECT_FIT_OPTIONS}
            />
          </InspectorField>
        </FieldGrid>

        <AdvancedPanel title="Aspect and frame">
          <FieldGrid>
            <InspectorField label="Aspect">
              <InspectorSelect
                value={value?.aspectRatio ?? ""}
                onChange={(v) => onChange({ ...value, aspectRatio: v || undefined })}
                options={ASPECT_RATIOS}
              />
            </InspectorField>
            <InspectorField label="Frame">
              <InspectorSelect
                value={value?.frame ?? "none"}
                onChange={(v) => onChange({ ...value, frame: v })}
                options={FRAME_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Width">
              <InspectorInput
                value={value?.width ?? ""}
                onChange={(v) => onChange({ ...value, width: v || undefined })}
                placeholder="100%"
              />
            </InspectorField>
            <InspectorField label="Max W">
              <InspectorInput
                value={value?.maxWidth ?? ""}
                onChange={(v) => onChange({ ...value, maxWidth: v || undefined })}
                placeholder="960px"
              />
            </InspectorField>
            <InspectorField label="Radius">
              <InspectorInput
                value={value?.borderRadius ?? ""}
                onChange={(v) => onChange({ ...value, borderRadius: v || undefined })}
                placeholder="0px"
              />
            </InspectorField>
          </FieldGrid>
        </AdvancedPanel>

        <PresetRow label="Vertical padding">
          <PresetButtons
            value={value?.paddingTop}
            presets={SPACE_PRESETS}
            onChange={(v) => onChange({ ...value, paddingTop: v, paddingBottom: v })}
          />
        </PresetRow>

        <FieldGrid>
          <InspectorField label="Pad top">
            <InspectorInput
              value={value?.paddingTop ?? ""}
              onChange={(v) => onChange({ ...value, paddingTop: v || undefined })}
              placeholder="clamp(48px, 6vw, 88px)"
            />
          </InspectorField>
          <InspectorField label="Pad bottom">
            <InspectorInput
              value={value?.paddingBottom ?? ""}
              onChange={(v) => onChange({ ...value, paddingBottom: v || undefined })}
              placeholder="clamp(48px, 6vw, 88px)"
            />
          </InspectorField>
        </FieldGrid>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
