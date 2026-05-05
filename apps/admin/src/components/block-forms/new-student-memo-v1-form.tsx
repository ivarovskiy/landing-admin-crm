"use client";

import type { BlockFormProps } from "./index";
import { arr, moveAt, removeAt, setAt } from "@/lib/array";
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
import {
  ALargeSmall,
  ArrowDown,
  ArrowUp,
  Copy,
  Image,
  LayoutTemplate,
  Paperclip,
  Plus,
  SlidersHorizontal,
  Trash2,
  Type,
} from "lucide-react";
import {
  ANIMATION_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  CompactGrid,
  FIT_OPTIONS,
  getScopedGroup,
  patchScopedGroup,
  scopeLabel,
  StyleEditor,
  SwitchRow,
  TARGET_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  type MemoElementStyle,
  type MemoScope,
} from "./new-student-memo-controls";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "")
    : "";

type MemoSection = {
  heading?: string;
  body?: string;
  hidden?: boolean;
  headingStyle?: MemoElementStyle;
  bodyStyle?: MemoElementStyle;
};

const REFERENCE_PRESET = {
  layout: {
    maxWidth: "1168px",
    paddingTop: "62px",
    paddingBottom: "76px",
    headerPadding: "0",
    headerMarginBottom: "58px",
    headerBorderWidth: "0",
    titleRowGap: "32px",
    bodyGap: "clamp(58px, 9vw, 126px)",
    textWidth: "minmax(0, 780px)",
    imageWidth: "clamp(230px, 25vw, 320px)",
    imageOffsetY: "116px",
    viewportProfiles: {
      ipadPro: {
        bodyGap: "56px",
        textWidth: "minmax(0, 690px)",
        imageWidth: "280px",
        imageOffsetY: "94px",
      },
      mobile: {
        paddingTop: "34px",
        paddingBottom: "54px",
        headerMarginBottom: "34px",
        bodyGap: "34px",
        imageOffsetY: "0",
      },
    },
  },
  contentBox: {
    enabled: true,
    borderWidth: "1.5px",
    borderColor: "var(--color-primary)",
    borderRadius: "4px",
    padding: "clamp(52px, 6vw, 84px) clamp(28px, 6vw, 78px)",
    minHeight: "clamp(760px, 110vw, 1540px)",
    viewportProfiles: {
      mobile: {
        padding: "34px 22px 42px",
        minHeight: "0",
      },
    },
  },
  textFlow: {
    sectionGap: "31px",
    headingGap: "24px",
    paragraphGap: "1.35em",
    headingBorderWidth: "0",
    headingPaddingBottom: "0",
  },
  imageFrame: {
    width: "100%",
    aspectRatio: "3/4",
    borderWidth: "0",
    padding: "0",
    objectFit: "cover",
  },
  clip: {
    target: "text-box",
    width: "46px",
    height: "68px",
    top: "-31px",
    left: "50%",
  },
  kickerStyle: {
    size: "18px",
    lineHeight: "1.2",
    letterSpacing: "0.42em",
    weight: "700",
    mb: "28px",
  },
  titleStyle: {
    typo: "typo-content-header",
    size: "clamp(54px, 7.7vw, 82px)",
    lineHeight: "1.02",
    strokeW: "2.6px",
    mb: "10px",
  },
  subtitleStyle: {
    typo: "typo-subtitle",
    size: "clamp(28px, 4.8vw, 44px)",
    lineHeight: "1.08",
    strokeW: "2px",
  },
  sectionTitleStyle: {
    size: "22px",
    lineHeight: "1.45",
    letterSpacing: "0.38em",
    weight: "700",
  },
  bodyStyle: {
    size: "20px",
    lineHeight: "1.47",
    letterSpacing: "0.007em",
  },
};

function scopeFromViewMode(viewMode: BlockFormProps["viewMode"]): MemoScope {
  if (viewMode === "ipadPro") return "ipadPro";
  if (viewMode === "mobile") return "mobile";
  return "default";
}

function applyReferencePreset(value: any) {
  return {
    ...value,
    layout: { ...(value?.layout ?? {}), ...REFERENCE_PRESET.layout },
    contentBox: { ...(value?.contentBox ?? {}), ...REFERENCE_PRESET.contentBox },
    textFlow: { ...(value?.textFlow ?? {}), ...REFERENCE_PRESET.textFlow },
    imageFrame: { ...(value?.imageFrame ?? {}), ...REFERENCE_PRESET.imageFrame },
    clip: { ...(value?.clip ?? {}), ...REFERENCE_PRESET.clip },
    kickerStyle: { ...(value?.kickerStyle ?? {}), ...REFERENCE_PRESET.kickerStyle },
    titleStyle: { ...(value?.titleStyle ?? {}), ...REFERENCE_PRESET.titleStyle },
    subtitleStyle: { ...(value?.subtitleStyle ?? {}), ...REFERENCE_PRESET.subtitleStyle },
    sectionTitleStyle: { ...(value?.sectionTitleStyle ?? {}), ...REFERENCE_PRESET.sectionTitleStyle },
    bodyStyle: { ...(value?.bodyStyle ?? {}), ...REFERENCE_PRESET.bodyStyle },
  };
}

export function NewStudentMemoV1Form({ value, onChange, viewMode }: BlockFormProps) {
  const sections = arr<MemoSection>(value?.sections);
  const scope = scopeFromViewMode(viewMode);
  const layout = getScopedGroup(value?.layout, scope);
  const contentBox = getScopedGroup(value?.contentBox, scope);
  const textFlow = getScopedGroup(value?.textFlow, scope);
  const imageFrame = getScopedGroup(value?.imageFrame, scope);

  const patchGroup = (key: "layout" | "contentBox" | "textFlow" | "imageFrame", patch: Record<string, unknown>) => {
    onChange({
      ...value,
      [key]: patchScopedGroup(value?.[key], scope, patch),
    });
  };

  return (
    <div>
      <InspectorSection
        title={`Composition - ${scopeLabel(scope)}`}
        icon={<LayoutTemplate className="h-3 w-3" />}
      >
        <button
          type="button"
          onClick={() => onChange(applyReferencePreset(value))}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-primary/50 bg-primary/10 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Apply reference layout
        </button>

        {scope !== "default" ? (
          <p className="text-[10px] leading-snug text-muted-foreground/75">
            Empty fields inherit desktop/default values for this breakpoint.
          </p>
        ) : null}

        <CompactGrid>
          <InspectorField label="Max W">
            <InspectorInput
              value={(layout.maxWidth as string) ?? ""}
              onChange={(v) => patchGroup("layout", { maxWidth: v || undefined })}
              placeholder="1168px"
            />
          </InspectorField>
          <InspectorField label="Top">
            <InspectorInput
              value={(layout.paddingTop as string) ?? ""}
              onChange={(v) => patchGroup("layout", { paddingTop: v || undefined })}
              placeholder="62px"
            />
          </InspectorField>
          <InspectorField label="Bottom">
            <InspectorInput
              value={(layout.paddingBottom as string) ?? ""}
              onChange={(v) => patchGroup("layout", { paddingBottom: v || undefined })}
              placeholder="76px"
            />
          </InspectorField>
          <InspectorField label="Body gap">
            <InspectorInput
              value={(layout.bodyGap as string) ?? ""}
              onChange={(v) => patchGroup("layout", { bodyGap: v || undefined })}
              placeholder="clamp(58px, 9vw, 126px)"
            />
          </InspectorField>
          <InspectorField label="Text W">
            <InspectorInput
              value={(layout.textWidth as string) ?? ""}
              onChange={(v) => patchGroup("layout", { textWidth: v || undefined })}
              placeholder="minmax(0, 780px)"
            />
          </InspectorField>
          <InspectorField label="Image W">
            <InspectorInput
              value={(layout.imageWidth as string) ?? ""}
              onChange={(v) => patchGroup("layout", { imageWidth: v || undefined })}
              placeholder="clamp(230px, 25vw, 320px)"
            />
          </InspectorField>
          <InspectorField label="Img Y">
            <InspectorInput
              value={(layout.imageOffsetY as string) ?? ""}
              onChange={(v) => patchGroup("layout", { imageOffsetY: v || undefined })}
              placeholder="116px"
            />
          </InspectorField>
          <InspectorField label="Title gap">
            <InspectorInput
              value={(layout.titleRowGap as string) ?? ""}
              onChange={(v) => patchGroup("layout", { titleRowGap: v || undefined })}
              placeholder="32px"
            />
          </InspectorField>
        </CompactGrid>

        <SwitchRow
          label="Mobile image first"
          checked={!!value?.layout?.mobileImageFirst}
          onChange={(checked) =>
            onChange({ ...value, layout: { ...(value?.layout ?? {}), mobileImageFirst: checked || undefined } })
          }
        />
      </InspectorSection>

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

        <CompactGrid>
          <InspectorField label="Pad">
            <InspectorInput
              value={(layout.headerPadding as string) ?? ""}
              onChange={(v) => patchGroup("layout", { headerPadding: v || undefined })}
              placeholder="0"
            />
          </InspectorField>
          <InspectorField label="Gap">
            <InspectorInput
              value={(layout.headerMarginBottom as string) ?? ""}
              onChange={(v) => patchGroup("layout", { headerMarginBottom: v || undefined })}
              placeholder="58px"
            />
          </InspectorField>
          <InspectorField label="Line">
            <InspectorInput
              value={(layout.headerBorderWidth as string) ?? ""}
              onChange={(v) => patchGroup("layout", { headerBorderWidth: v || undefined })}
              placeholder="0 / 1.5px"
            />
          </InspectorField>
          <InspectorField label="Color">
            <InspectorInput
              value={(layout.headerBorderColor as string) ?? ""}
              onChange={(v) => patchGroup("layout", { headerBorderColor: v || undefined })}
              placeholder="var(--color-primary)"
            />
          </InspectorField>
        </CompactGrid>

        <div className="h-px bg-border/70" />

        <InspectorField label="CTA label">
          <InspectorInput
            value={value?.cta?.label ?? ""}
            onChange={(v) => onChange({ ...value, cta: { ...(value?.cta ?? {}), label: v } })}
            placeholder="Studio Director"
          />
        </InspectorField>
        <CompactGrid>
          <InspectorField label="Href">
            <InspectorInput
              value={value?.cta?.href ?? ""}
              onChange={(v) => onChange({ ...value, cta: { ...(value?.cta ?? {}), href: v } })}
              placeholder="#"
            />
          </InspectorField>
          <InspectorField label="Width">
            <InspectorInput
              value={value?.cta?.width ?? ""}
              onChange={(v) => onChange({ ...value, cta: { ...(value?.cta ?? {}), width: v || undefined } })}
              placeholder="164px"
            />
          </InspectorField>
        </CompactGrid>
      </InspectorSection>

      <InspectorSection title="Typography" icon={<ALargeSmall className="h-3 w-3" />} defaultOpen={false}>
        <div className="space-y-2">
          <StyleEditor
            label="Kicker"
            style={value?.kickerStyle ?? { typo: value?.typo?.kicker }}
            onChange={(next) => onChange({ ...value, kickerStyle: next })}
          />
          <StyleEditor
            label="Title"
            style={value?.titleStyle ?? { typo: value?.typo?.title }}
            onChange={(next) => onChange({ ...value, titleStyle: next })}
          />
          <StyleEditor
            label="Subtitle"
            style={value?.subtitleStyle ?? { typo: value?.typo?.subtitle }}
            onChange={(next) => onChange({ ...value, subtitleStyle: next })}
          />
          <StyleEditor
            label="Section heading"
            style={value?.sectionTitleStyle ?? { typo: value?.typo?.sectionTitle }}
            onChange={(next) => onChange({ ...value, sectionTitleStyle: next })}
          />
          <StyleEditor
            label="Body text"
            style={value?.bodyStyle ?? { typo: value?.typo?.bodyText }}
            onChange={(next) => onChange({ ...value, bodyStyle: next })}
          />
        </div>
      </InspectorSection>

      <InspectorSection title="Text box" icon={<SlidersHorizontal className="h-3 w-3" />} defaultOpen={false}>
        <InspectorField label="Boxed">
          <InspectorToggle
            checked={contentBox.enabled !== false && value?.contentBox?.enabled !== false}
            onChange={(checked) => patchGroup("contentBox", { enabled: checked })}
            label={contentBox.enabled === false ? "Off" : "On"}
          />
        </InspectorField>
        <CompactGrid>
          <InspectorField label="Border">
            <InspectorInput
              value={(contentBox.borderWidth as string) ?? ""}
              onChange={(v) => patchGroup("contentBox", { borderWidth: v || undefined })}
              placeholder="1.5px"
            />
          </InspectorField>
          <InspectorField label="Color">
            <InspectorInput
              value={(contentBox.borderColor as string) ?? ""}
              onChange={(v) => patchGroup("contentBox", { borderColor: v || undefined })}
              placeholder="var(--color-primary)"
            />
          </InspectorField>
          <InspectorField label="Radius">
            <InspectorInput
              value={(contentBox.borderRadius as string) ?? ""}
              onChange={(v) => patchGroup("contentBox", { borderRadius: v || undefined })}
              placeholder="4px"
            />
          </InspectorField>
          <InspectorField label="Min H">
            <InspectorInput
              value={(contentBox.minHeight as string) ?? ""}
              onChange={(v) => patchGroup("contentBox", { minHeight: v || undefined })}
              placeholder="clamp(760px, 110vw, 1540px)"
            />
          </InspectorField>
        </CompactGrid>
        <InspectorField label="Padding" stacked>
          <InspectorInput
            value={(contentBox.padding as string) ?? ""}
            onChange={(v) => patchGroup("contentBox", { padding: v || undefined })}
            placeholder="clamp(52px, 6vw, 84px) clamp(28px, 6vw, 78px)"
          />
        </InspectorField>

        <div className="h-px bg-border/70" />

        <CompactGrid>
          <InspectorField label="Sec gap">
            <InspectorInput
              value={(textFlow.sectionGap as string) ?? ""}
              onChange={(v) => patchGroup("textFlow", { sectionGap: v || undefined })}
              placeholder="31px"
            />
          </InspectorField>
          <InspectorField label="Head gap">
            <InspectorInput
              value={(textFlow.headingGap as string) ?? ""}
              onChange={(v) => patchGroup("textFlow", { headingGap: v || undefined })}
              placeholder="24px"
            />
          </InspectorField>
          <InspectorField label="Para gap">
            <InspectorInput
              value={(textFlow.paragraphGap as string) ?? ""}
              onChange={(v) => patchGroup("textFlow", { paragraphGap: v || undefined })}
              placeholder="1.35em"
            />
          </InspectorField>
          <InspectorField label="Head line">
            <InspectorInput
              value={(textFlow.headingBorderWidth as string) ?? ""}
              onChange={(v) => patchGroup("textFlow", { headingBorderWidth: v || undefined })}
              placeholder="0 / 1px"
            />
          </InspectorField>
        </CompactGrid>
      </InspectorSection>

      <InspectorSection title="Image" icon={<Image className="h-3 w-3" />} defaultOpen={false}>
        <InspectorField label="Photo">
          <ImageUpload
            value={value?.image?.src ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...(value?.image ?? {}), src: v } })}
            apiBase={API_BASE}
          />
        </InspectorField>
        <InspectorField label="Alt">
          <InspectorInput
            value={value?.image?.alt ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...(value?.image ?? {}), alt: v } })}
            placeholder="Photo description"
          />
        </InspectorField>
        <CompactGrid>
          <InspectorField label="Anim">
            <InspectorSelect
              value={value?.image?.animation ?? "none"}
              onChange={(v) => onChange({ ...value, image: { ...(value?.image ?? {}), animation: v || "none" } })}
              options={ANIMATION_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Fit">
            <InspectorSelect
              value={(imageFrame.objectFit as string) ?? value?.image?.objectFit ?? "cover"}
              onChange={(v) => patchGroup("imageFrame", { objectFit: v || undefined })}
              options={FIT_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Aspect">
            <InspectorSelect
              value={(imageFrame.aspectRatio as string) ?? value?.image?.aspectRatio ?? ""}
              onChange={(v) => patchGroup("imageFrame", { aspectRatio: v || undefined })}
              options={ASPECT_RATIO_OPTIONS}
            />
          </InspectorField>
          <InspectorField label="Width">
            <InspectorInput
              value={(imageFrame.width as string) ?? value?.image?.width ?? ""}
              onChange={(v) => patchGroup("imageFrame", { width: v || undefined })}
              placeholder="100%"
            />
          </InspectorField>
          <InspectorField label="Height">
            <InspectorInput
              value={(imageFrame.height as string) ?? value?.image?.height ?? ""}
              onChange={(v) => patchGroup("imageFrame", { height: v || undefined })}
              placeholder="auto"
            />
          </InspectorField>
          <InspectorField label="Border">
            <InspectorInput
              value={(imageFrame.borderWidth as string) ?? ""}
              onChange={(v) => patchGroup("imageFrame", { borderWidth: v || undefined })}
              placeholder="0 / 3px"
            />
          </InspectorField>
          <InspectorField label="Color">
            <InspectorInput
              value={(imageFrame.borderColor as string) ?? ""}
              onChange={(v) => patchGroup("imageFrame", { borderColor: v || undefined })}
              placeholder="var(--color-primary)"
            />
          </InspectorField>
          <InspectorField label="Padding">
            <InspectorInput
              value={(imageFrame.padding as string) ?? ""}
              onChange={(v) => patchGroup("imageFrame", { padding: v || undefined })}
              placeholder="0"
            />
          </InspectorField>
        </CompactGrid>
      </InspectorSection>

      <InspectorSection title="Clip" icon={<Paperclip className="h-3 w-3" />} defaultOpen={false}>
        <InspectorField label="Target">
          <InspectorSelect
            value={value?.clip?.target ?? "image"}
            onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), target: v } })}
            options={TARGET_OPTIONS}
          />
        </InspectorField>
        <InspectorField label="Icon">
          <ImageUpload
            value={value?.clip?.src ?? ""}
            onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), src: v } })}
            placeholder="Drop icon or click to upload"
            apiBase={API_BASE}
          />
        </InspectorField>
        <CompactGrid>
          <InspectorField label="Width">
            <InspectorInput
              value={value?.clip?.width ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), width: v || undefined } })}
              placeholder="46px"
            />
          </InspectorField>
          <InspectorField label="Height">
            <InspectorInput
              value={value?.clip?.height ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), height: v || undefined } })}
              placeholder="68px"
            />
          </InspectorField>
          <InspectorField label="Top">
            <InspectorInput
              value={value?.clip?.top ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), top: v || undefined } })}
              placeholder="-31px"
            />
          </InspectorField>
          <InspectorField label="Right">
            <InspectorInput
              value={value?.clip?.right ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), right: v || undefined } })}
              placeholder="-18px"
            />
          </InspectorField>
          <InspectorField label="Bottom">
            <InspectorInput
              value={value?.clip?.bottom ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), bottom: v || undefined } })}
              placeholder=""
            />
          </InspectorField>
          <InspectorField label="Left">
            <InspectorInput
              value={value?.clip?.left ?? ""}
              onChange={(v) => onChange({ ...value, clip: { ...(value?.clip ?? {}), left: v || undefined } })}
              placeholder="50%"
            />
          </InspectorField>
        </CompactGrid>
      </InspectorSection>

      <InspectorSection
        title="Text sections"
        icon={<Type className="h-3 w-3" />}
        badge={<span className="text-[10px] text-muted-foreground">{sections.length}</span>}
      >
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <SectionCard
              key={idx}
              section={section}
              index={idx}
              total={sections.length}
              onChange={(next) => onChange({ ...value, sections: setAt(sections, idx, next) })}
              onMove={(dir) => onChange({ ...value, sections: moveAt(sections, idx, dir) })}
              onRemove={() => onChange({ ...value, sections: removeAt(sections, idx) })}
              onDuplicate={() => {
                const next = [...sections.slice(0, idx + 1), { ...section }, ...sections.slice(idx + 1)];
                onChange({ ...value, sections: next });
              }}
            />
          ))}

          <button
            type="button"
            onClick={() => onChange({ ...value, sections: [...sections, { heading: "", body: "" }] })}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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

function SectionCard({
  section,
  index,
  total,
  onChange,
  onMove,
  onRemove,
  onDuplicate,
}: {
  section: MemoSection;
  index: number;
  total: number;
  onChange: (next: MemoSection) => void;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className={["rounded-md border bg-muted/10", section.hidden ? "opacity-55" : ""].join(" ")}>
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-2 py-1.5">
        <span className="truncate text-[11px] font-semibold text-muted-foreground">
          {index + 1}. {section.heading || "Section"}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...section, hidden: !section.hidden })}
            className="px-1 text-[10px] text-muted-foreground hover:text-foreground"
            title={section.hidden ? "Show" : "Hide"}
          >
            {section.hidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-0.5 text-muted-foreground hover:text-foreground"
            title="Duplicate"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-0.5 text-muted-foreground hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2 p-2">
        <InspectorInput
          value={section.heading ?? ""}
          onChange={(v) => onChange({ ...section, heading: v || undefined })}
          placeholder="Section heading"
        />
        <InspectorTextarea
          value={section.body ?? ""}
          onChange={(v) => onChange({ ...section, body: v })}
          placeholder="Body text. Separate paragraphs with a blank line."
          rows={5}
        />
        <StyleEditor
          label="Heading override"
          style={section.headingStyle}
          onChange={(next) => onChange({ ...section, headingStyle: next })}
          showBox={false}
        />
        <StyleEditor
          label="Body override"
          style={section.bodyStyle}
          onChange={(next) => onChange({ ...section, bodyStyle: next })}
          showBox={false}
        />
      </div>
    </div>
  );
}
