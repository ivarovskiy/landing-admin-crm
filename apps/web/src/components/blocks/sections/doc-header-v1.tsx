import type React from "react";
import { Container, OutlineStampText, STAMP_HERO_TITLE } from "@/components/landing/ui";
import ParentPortalBtn from "@/assets/buttons/parent-portal.svg";
import StudioDirectorBtn from "@/assets/buttons/studio-director.svg";

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

type DocHeaderV1Data = {
  kicker?: string;
  kickerStyle?: ElementStyle;
  title?: string;
  titleStyle?: ElementStyle;
  subtitle?: string;
  subtitleStyle?: ElementStyle;
  cta?: { href?: string; size?: string; gap?: string };
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

export function DocHeaderV1({ data }: { data: any }) {
  const d = data as DocHeaderV1Data;
  const hasCta = !!d?.cta?.href;

  return (
    <section className="doc-header">
      <Container>
        {d?.kicker ? (
          <p
            className={["doc-header__kicker", d.kickerStyle?.typo].filter(Boolean).join(" ")}
            style={elStyle(d.kickerStyle)}
          >
            {d.kicker}
          </p>
        ) : null}

        {/* Title row: stamp title + optional button on the right */}
        <div
          className="doc-header__title-row"
          style={d?.cta?.gap ? ({ "--doc-header-gap": d.cta.gap } as React.CSSProperties) : undefined}
        >
          <div className="doc-header__title-col">
            {d?.title ? (
              <OutlineStampText
                as="h1"
                stamp={STAMP_HERO_TITLE}
                className={["doc-header__title", d.titleStyle?.typo].filter(Boolean).join(" ")}
                style={elStyle(d.titleStyle)}
              >
                {d.title}
              </OutlineStampText>
            ) : null}

            {d?.subtitle ? (
              <p
                className={["doc-header__subtitle", d.subtitleStyle?.typo]
                  .filter(Boolean)
                  .join(" ")}
                style={elStyle(d.subtitleStyle)}
              >
                {d.subtitle}
              </p>
            ) : null}
          </div>

          {hasCta ? (
            <a
              href={d.cta!.href}
              className="doc-header__cta"
              style={d.cta!.size ? ({ "--doc-cta-h": d.cta!.size } as React.CSSProperties) : undefined}
            >
              {/* <ParentPortalBtn /> */}
              <StudioDirectorBtn />
            </a>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
