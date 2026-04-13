import type React from "react";
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

export function DocBodyV1({ data }: { data: any }) {
  const d = data as DocBodyV1Data;
  const sections: DocSection[] = Array.isArray(d?.sections) ? d.sections : [];
  const image = d?.image;

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
                  {s.heading ? (
                    <h2
                      className={["doc-body__section-title", s.headingStyle?.typo]
                        .filter(Boolean)
                        .join(" ")}
                      style={elStyle(s.headingStyle)}
                    >
                      {s.heading}
                    </h2>
                  ) : null}
                  {s.body ? (
                    <div
                      className={["doc-body__section-body", s.bodyStyle?.typo]
                        .filter(Boolean)
                        .join(" ")}
                      style={elStyle(s.bodyStyle)}
                    >
                      {s.body.split("\n\n").map((p, pi) => (
                        <p key={pi}>{p}</p>
                      ))}
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
