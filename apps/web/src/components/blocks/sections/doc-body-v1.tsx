import type React from "react";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";
import { Container } from "@/components/landing/ui";
import NextImage from "next/image";
import ClipIcon from "@/assets/icons/clip.svg";

type ElementStyle = {
  mt?: string;
  mb?: string;
  ml?: string;
  mr?: string;
  pt?: string;
  pb?: string;
  align?: "left" | "center" | "right";
  size?: string;
  typo?: string;
};

type DocSection = {
  id?: string;
  heading?: string;
  headingStyle?: ElementStyle;
  body?: string;
  bodyStyle?: ElementStyle;
};

type DocBodyV1Data = {
  sections?: DocSection[];
  image?: {
    src?: string;
    alt?: string;
  };
};

function elStyle(es?: ElementStyle): React.CSSProperties | undefined {
  if (!es) return undefined;
  const s: React.CSSProperties = {};
  if (es.mt) s.marginTop = es.mt;
  if (es.mb) s.marginBottom = es.mb;
  if (es.ml) s.marginLeft = es.ml;
  if (es.mr) s.marginRight = es.mr;
  if (es.pt) s.paddingTop = es.pt;
  if (es.pb) s.paddingBottom = es.pb;
  if (es.align) {
    s.textAlign = es.align;
    s.alignSelf =
      es.align === "center" ? "center" : es.align === "right" ? "flex-end" : "flex-start";
  }
  if (es.size) s.fontSize = es.size;
  return Object.keys(s).length ? s : undefined;
}

export function DocBodyV1({
  data,
  editMode,
  onChange,
}: {
  data: any;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const d = data as DocBodyV1Data;
  const sections: DocSection[] = Array.isArray(d?.sections) ? d.sections : [];
  const image = d?.image;

  const updateSection = editMode && onChange
    ? (idx: number, field: "heading" | "body", value: string) =>
        onChange({ ...d, sections: sections.map((s, i) => i === idx ? { ...s, [field]: value } : s) })
    : null;

  return (
    <section className="doc-body">
      <Container>
        <div className="doc-body__layout">

          {/* Text column — framed box with clip decoration */}
          <div className="doc-body__text-col">
            <div className="doc-body__text-frame">
              <div className="doc-body__clip" aria-hidden="true">
                <ClipIcon />
              </div>
              {sections.map((s, i) => (
                <div key={s.id ?? i} className="doc-body__section">
                  {(s.heading || updateSection) ? (
                    <h2
                      className={["doc-body__section-title", s.headingStyle?.typo]
                        .filter(Boolean)
                        .join(" ")}
                      style={elStyle(s.headingStyle)}
                    >
                      {updateSection ? (
                        <TipTapInline
                          value={s.heading ?? ""}
                          onChange={(html) => updateSection(i, "heading", html)}
                          multiline={false}
                          typoClass={s.headingStyle?.typo}
                          typoOptions={TYPO_PRESETS}
                        />
                      ) : renderRichText(s.heading!)}
                    </h2>
                  ) : null}
                  {(s.body || updateSection) ? (
                    <div
                      className={["doc-body__section-body", s.bodyStyle?.typo]
                        .filter(Boolean)
                        .join(" ")}
                      style={elStyle(s.bodyStyle)}
                    >
                      {updateSection ? (
                        <TipTapInline
                          value={s.body ?? ""}
                          onChange={(html) => updateSection(i, "body", html)}
                          typoClass={s.bodyStyle?.typo}
                          typoOptions={TYPO_PRESETS}
                        />
                      ) : renderRichText(s.body!)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Image column */}
          <div className="doc-body__image-col">
            <div className="doc-body__image-frame">
              {image?.src ? (
                <NextImage
                  src={image.src}
                  alt={image.alt ?? ""}
                  fill
                  sizes="(max-width: 767px) 100vw, 380px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="doc-body__image-placeholder">Image</div>
              )}
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}
