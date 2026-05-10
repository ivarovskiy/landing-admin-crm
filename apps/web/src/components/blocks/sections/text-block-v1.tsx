import type React from "react";
import { Container } from "@/components/landing/ui";
import { TipTapInline, renderRichText } from "@/components/rich-text";

type TextBlockV1Data = {
  kicker?: string;
  heading?: string;
  body?: string;
  cta?: { label?: string; href?: string };
  maxWidth?: string;
  contentMaxWidth?: string;
  align?: "left" | "center" | "right";
  paddingTop?: string;
  paddingBottom?: string;
  gap?: string;
  kickerTypo?: string;
  headingTypo?: string;
  bodyTypo?: string;
  kickerStrokeW?: string;
  headingStrokeW?: string;
  bodyStrokeW?: string;
  kickerGap?: string;
  headingGap?: string;
  bodyGap?: string;
  ctaGap?: string;
  kickerMaxWidth?: string;
  headingMaxWidth?: string;
  bodyMaxWidth?: string;
};

const TYPO_PRESETS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "typo-content-header", label: "Content Header (78px)" },
  { value: "typo-homepage-header", label: "Homepage Header (104px)" },
  { value: "typo-subtitle", label: "Subtitle (47px italic)" },
  { value: "typo-body-text", label: "Body Text (20px)" },
  { value: "typo-section-header", label: "Section Header (22px)" },
  { value: "typo-text-header", label: "Text Header (22px)" },
  { value: "typo-promo-header", label: "Promo Header (26px)" },
  { value: "typo-teachers-header", label: "Teachers Header (22px)" },
];

function strokeStyle(value?: string): React.CSSProperties | undefined {
  return value ? ({ "--text-stroke-w": value } as React.CSSProperties) : undefined;
}

function elementStyle(maxWidth?: string, gap?: string, strokeW?: string): React.CSSProperties | undefined {
  const s: Record<string, string> = {};
  if (maxWidth) s.maxWidth = maxWidth;
  if (gap) s.marginTop = gap;
  if (strokeW) s["--text-stroke-w"] = strokeW;
  return Object.keys(s).length ? (s as React.CSSProperties) : undefined;
}

export function TextBlockV1({
  data,
  editMode,
  onChange,
}: {
  data: unknown;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const d = source as TextBlockV1Data;
  const align = d?.align ?? "left";
  const update = editMode && onChange
    ? (field: keyof TextBlockV1Data, value: unknown) => onChange({ ...source, [field]: value })
    : null;

  const sectionStyle = {
    ...(d?.paddingTop ? { paddingTop: d.paddingTop } : {}),
    ...(d?.paddingBottom ? { paddingBottom: d.paddingBottom } : {}),
  } as React.CSSProperties;

  const innerStyle = {
    textAlign: align,
    ...(d?.contentMaxWidth || d?.maxWidth ? {
      maxWidth: d.contentMaxWidth ?? d.maxWidth,
      marginLeft: align === "center" ? "auto" : undefined,
      marginRight: align === "center" ? "auto" : undefined,
    } : {}),
    ...(d?.gap ? { "--tb-gap": d.gap } : {}),
  } as React.CSSProperties;

  return (
    <section className="text-block" style={sectionStyle}>
      <Container>
        <div className="tb__inner" style={innerStyle}>
          {d?.kicker || update ? (
            <div
              className={["tb__kicker", d?.kickerTypo].filter(Boolean).join(" ")}
              data-el="kicker"
              style={elementStyle(d?.kickerMaxWidth, d?.kickerGap, d?.kickerStrokeW)}
            >
              {update ? (
                <TipTapInline
                  value={d?.kicker ?? ""}
                  onChange={(html) => update("kicker", html)}
                  multiline={false}
                  typoClass={d?.kickerTypo}
                  typoOptions={TYPO_PRESETS}
                />
              ) : renderRichText(d.kicker ?? "")}
            </div>
          ) : null}
          {d?.heading || update ? (
            <h2
              className={["tb__heading", d?.headingTypo].filter(Boolean).join(" ")}
              data-el="heading"
              style={elementStyle(d?.headingMaxWidth, d?.headingGap, d?.headingStrokeW)}
            >
              {update ? (
                <TipTapInline
                  value={d?.heading ?? ""}
                  onChange={(html) => update("heading", html)}
                  multiline={false}
                  typoClass={d?.headingTypo}
                  typoOptions={TYPO_PRESETS}
                />
              ) : renderRichText(d.heading ?? "")}
            </h2>
          ) : null}
          {d?.body || update ? (
            <div
              className={["tb__body", d?.bodyTypo].filter(Boolean).join(" ")}
              data-el="body"
              style={{ ...elementStyle(d?.bodyMaxWidth ?? d?.maxWidth, d?.bodyGap, d?.bodyStrokeW), ...strokeStyle(d?.bodyStrokeW) }}
            >
              {update ? (
                <TipTapInline
                  value={d?.body ?? ""}
                  onChange={(html) => update("body", html)}
                  typoClass={d?.bodyTypo}
                  typoOptions={TYPO_PRESETS}
                  showWordCount
                />
              ) : renderRichText(d.body ?? "")}
            </div>
          ) : null}
          {d?.cta?.label ? (
            <div className="tb__cta" style={d?.ctaGap ? { marginTop: d.ctaGap } : undefined}>
              <a href={d.cta.href ?? "#"} className="tb__cta-btn" data-el="cta">
                {renderRichText(d.cta.label)}
              </a>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
