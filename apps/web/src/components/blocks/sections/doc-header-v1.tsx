import type React from "react";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";
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

export function DocHeaderV1({
  data,
  editMode,
  onChange,
}: {
  data: any;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const d = data as DocHeaderV1Data;
  const hasCta = !!d?.cta?.href;

  const update = editMode && onChange
    ? (field: keyof DocHeaderV1Data, value: unknown) => onChange({ ...d, [field]: value })
    : null;

  return (
    <section className="doc-header">
      <Container>
        {(d?.kicker || update) ? (
          <p
            className={["doc-header__kicker", d?.kickerStyle?.typo].filter(Boolean).join(" ")}
            style={elStyle(d?.kickerStyle)}
          >
            {update ? (
              <TipTapInline
                value={d?.kicker ?? ""}
                onChange={(html) => update("kicker", html)}
                multiline={false}
                typoClass={d?.kickerStyle?.typo}
                typoOptions={TYPO_PRESETS}
              />
            ) : renderRichText(d.kicker!)}
          </p>
        ) : null}

        {/* Title row: stamp title + optional button on the right */}
        <div
          className="doc-header__title-row"
          style={d?.cta?.gap ? ({ "--doc-header-gap": d.cta.gap } as React.CSSProperties) : undefined}
        >
          <div className="doc-header__title-col">
            {(d?.title || update) ? (
              <OutlineStampText
                as="h1"
                stamp={STAMP_HERO_TITLE}
                className={["doc-header__title", d?.titleStyle?.typo].filter(Boolean).join(" ")}
                style={elStyle(d?.titleStyle)}
                shadowContent={update ? renderRichText(d?.title ?? "") : undefined}
              >
                {update ? (
                  <TipTapInline
                    value={d?.title ?? ""}
                    onChange={(html) => update("title", html)}
                    multiline={false}
                    typoClass={d?.titleStyle?.typo}
                    typoOptions={TYPO_PRESETS}
                  />
                ) : renderRichText(d.title!)}
              </OutlineStampText>
            ) : null}

            {(d?.subtitle || update) ? (
              <p
                className={["doc-header__subtitle", d?.subtitleStyle?.typo].filter(Boolean).join(" ")}
                style={elStyle(d?.subtitleStyle)}
              >
                {update ? (
                  <TipTapInline
                    value={d?.subtitle ?? ""}
                    onChange={(html) => update("subtitle", html)}
                    multiline={false}
                    typoClass={d?.subtitleStyle?.typo}
                    typoOptions={TYPO_PRESETS}
                  />
                ) : renderRichText(d.subtitle!)}
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
