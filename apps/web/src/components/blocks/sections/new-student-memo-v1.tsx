import type React from "react";
import { cn } from "@/lib/cn";
import {
  OutlineStampText,
  STAMP_HERO_TITLE,
  STAMP_SECTION_TITLE,
  STAMP_SUBTITLE,
} from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import ClipIcon from "@/assets/icons/clip.svg";

type ViewProfile = "ipadPro" | "mobile";

type MemoElementStyle = {
  typo?: string;
  mt?: string;
  mb?: string;
  ml?: string;
  mr?: string;
  size?: string;
  lineHeight?: string;
  letterSpacing?: string;
  weight?: string;
  align?: "left" | "center" | "right";
  maxWidth?: string;
  strokeW?: string;
};

type ResponsiveGroup = Record<string, unknown> & {
  viewportProfiles?: Partial<Record<ViewProfile, Record<string, unknown>>>;
};

type NsmSection = {
  heading?: string;
  body?: string;
  hidden?: boolean;
  headingStyle?: MemoElementStyle;
  bodyStyle?: MemoElementStyle;
};

type NsmImage = {
  src?: string;
  alt?: string;
  animation?: "none" | "fade-in" | "slide-up";
  aspectRatio?: string;
  width?: string;
  height?: string;
  objectFit?: string;
};

type NsmClip = {
  src?: string;
  width?: string;
  height?: string;
  alt?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  target?: "image" | "text-box" | "none";
};

type NsmTypo = {
  kicker?: string;
  title?: string;
  subtitle?: string;
  sectionTitle?: string;
  bodyText?: string;
};

const STAMP_TYPO_CLASSES = new Set([
  "",
  "typo-content-header",
  "typo-homepage-header",
  "typo-subtitle",
]);

const VAR_MAP = {
  layout: {
    maxWidth: "container-max-w",
    paddingTop: "padding-top",
    paddingBottom: "padding-bottom",
    headerPadding: "header-padding",
    headerMarginBottom: "header-margin-bottom",
    headerBorderWidth: "header-border-w",
    headerBorderColor: "header-border-color",
    titleRowGap: "title-row-gap",
    bodyGap: "body-gap",
    textWidth: "text-width",
    imageWidth: "image-col-width",
    imageOffsetY: "image-offset-y",
  },
  contentBox: {
    padding: "box-padding",
    minHeight: "box-min-h",
    borderWidth: "box-border-w",
    borderColor: "box-border-color",
    borderRadius: "box-radius",
  },
  textFlow: {
    sectionGap: "section-gap",
    headingGap: "heading-gap",
    paragraphGap: "paragraph-gap",
    headingBorderWidth: "heading-border-w",
    headingBorderColor: "heading-border-color",
    headingPaddingBottom: "heading-padding-bottom",
  },
  imageFrame: {
    width: "image-frame-w",
    height: "image-frame-h",
    aspectRatio: "image-aspect",
    borderWidth: "image-border-w",
    borderColor: "image-border-color",
    borderRadius: "image-radius",
    padding: "image-padding",
    objectFit: "image-fit",
  },
} as const;

function stampForTypo(typo?: string) {
  if (typo === "typo-homepage-header") return STAMP_SECTION_TITLE;
  if (typo === "typo-subtitle") return STAMP_SUBTITLE;
  return STAMP_HERO_TITLE;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function addVars(
  out: Record<string, string>,
  group: ResponsiveGroup | undefined,
  map: Record<string, string>,
  prefix = "",
) {
  if (!group) return;

  Object.entries(map).forEach(([key, cssName]) => {
    const value = group[key];
    if (typeof value === "string" && value.trim()) {
      out[`--nsm-${prefix}${cssName}`] = value;
    }
  });
}

function addResponsiveVars(
  out: Record<string, string>,
  group: ResponsiveGroup | undefined,
  map: Record<string, string>,
) {
  addVars(out, group, map);

  const profiles = group?.viewportProfiles;
  if (!profiles) return;

  addVars(out, profiles.ipadPro as ResponsiveGroup | undefined, map, "ipad-");
  addVars(out, profiles.mobile as ResponsiveGroup | undefined, map, "mobile-");
}

function rootStyle(data: any): React.CSSProperties | undefined {
  const out: Record<string, string> = {};
  const legacyImage = isRecord(data?.image)
    ? {
        width: data.image.width,
        height: data.image.height,
        aspectRatio: data.image.aspectRatio,
        objectFit: data.image.objectFit,
      }
    : {};
  const imageFrame = {
    ...legacyImage,
    ...(isRecord(data?.imageFrame) ? data.imageFrame : {}),
  };

  addResponsiveVars(out, data?.layout, VAR_MAP.layout);
  addResponsiveVars(out, data?.contentBox, VAR_MAP.contentBox);
  addResponsiveVars(out, data?.textFlow, VAR_MAP.textFlow);
  addResponsiveVars(out, imageFrame, VAR_MAP.imageFrame);
  return Object.keys(out).length ? (out as React.CSSProperties) : undefined;
}

function elementStyle(style?: MemoElementStyle): React.CSSProperties | undefined {
  if (!style) return undefined;
  const out: Record<string, string | number> = {};

  if (style.mt) out.marginTop = style.mt;
  if (style.mb) out.marginBottom = style.mb;
  if (style.ml) out.marginLeft = style.ml;
  if (style.mr) out.marginRight = style.mr;
  if (style.size) out.fontSize = style.size;
  if (style.lineHeight) out.lineHeight = style.lineHeight;
  if (style.letterSpacing) out.letterSpacing = style.letterSpacing;
  if (style.weight) {
    const weight = Number(style.weight);
    out.fontWeight = Number.isFinite(weight) ? weight : style.weight;
  }
  if (style.align) out.textAlign = style.align;
  if (style.maxWidth) out.maxWidth = style.maxWidth;
  if (style.strokeW) out["--text-stroke-w"] = style.strokeW;

  return Object.keys(out).length ? (out as React.CSSProperties) : undefined;
}

function clipStyle(clip?: NsmClip): React.CSSProperties | undefined {
  if (!clip) return undefined;
  const out: React.CSSProperties = {};
  if (clip.width) out.width = clip.width;
  if (clip.height) out.height = clip.height;
  if (clip.top !== undefined) out.top = clip.top;
  if (clip.right !== undefined) out.right = clip.right;
  if (clip.bottom !== undefined) out.bottom = clip.bottom;
  if (clip.left !== undefined) out.left = clip.left;
  return Object.keys(out).length ? out : undefined;
}

function renderClip(clip?: NsmClip) {
  if (clip?.target === "none") return null;

  return (
    <div className="nsm__clip" style={clipStyle(clip)} aria-hidden="true">
      {clip?.src ? (
        <img
          src={clip.src}
          alt={clip.alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <ClipIcon />
      )}
    </div>
  );
}

function classFromStyle(base: string, legacyTypo?: string, style?: MemoElementStyle) {
  return cn(base, legacyTypo, style?.typo);
}

function mergeStyle(base?: MemoElementStyle, override?: MemoElementStyle) {
  return override ? { ...(base ?? {}), ...override } : base;
}

export function NewStudentMemoV1({ data }: { data: any }) {
  const kicker = data?.kicker ?? "";
  const title = data?.title ?? "";
  const subtitle = data?.subtitle ?? "";
  const image = data?.image as NsmImage | undefined;
  const clip = data?.clip as NsmClip | undefined;
  const typo = data?.typo as NsmTypo | undefined;
  const sections: NsmSection[] = Array.isArray(data?.sections) ? data.sections : [];
  const contentBox = isRecord(data?.contentBox) ? data.contentBox : {};
  const cta = data?.cta as { label?: string; href?: string; width?: string } | undefined;
  const clipTarget = clip?.target ?? "image";
  const titleTypo = data?.titleStyle?.typo ?? typo?.title;
  const isTitleStamp = !titleTypo || STAMP_TYPO_CLASSES.has(titleTypo);

  const imageFrameClass = cn(
    "nsm__image-frame",
    image?.animation && image.animation !== "none" && `nsm__image-frame--anim-${image.animation}`,
  );

  const rootClass = cn(
    "nsm",
    contentBox.enabled === false && "nsm--unboxed",
    data?.layout?.mobileImageFirst && "nsm--image-first-mobile",
  );

  return (
    <section className={rootClass} style={rootStyle(data)}>
      <div className="ds-container nsm__container">
        <header className="nsm__header">
          <div className="nsm__title-row">
            <div className="nsm__title-copy">
              {kicker ? (
                <p
                  className={classFromStyle("nsm__kicker", typo?.kicker, data?.kickerStyle)}
                  style={elementStyle(data?.kickerStyle)}
                >
                  {kicker}
                </p>
              ) : null}
              {title ? (
                isTitleStamp ? (
                  <OutlineStampText
                    as="h1"
                    stamp={stampForTypo(titleTypo)}
                    className={classFromStyle("nsm__title", typo?.title, data?.titleStyle)}
                    style={elementStyle(data?.titleStyle)}
                  >
                    {title}
                  </OutlineStampText>
                ) : (
                  <h1
                    className={classFromStyle("nsm__title", typo?.title, data?.titleStyle)}
                    style={elementStyle(data?.titleStyle)}
                  >
                    {title}
                  </h1>
                )
              ) : null}
              {subtitle ? (
                <p
                  className={classFromStyle("nsm__subtitle", typo?.subtitle, data?.subtitleStyle)}
                  style={elementStyle(data?.subtitleStyle)}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>

            {cta?.label ? (
              <a
                href={cta.href ?? "#"}
                className="nsm__cta"
                style={cta.width ? ({ "--nsm-cta-w": cta.width } as React.CSSProperties) : undefined}
              >
                {cta.label}
              </a>
            ) : null}
          </div>
        </header>

        <div className="nsm__body">
          <div className="nsm__text-col">
            <div className="nsm__text-panel">
              {clipTarget === "text-box" ? renderClip(clip) : null}

              {sections
                .filter((section) => !section.hidden)
                .map((section, i) => {
                  const headingStyle = mergeStyle(data?.sectionTitleStyle, section.headingStyle);
                  const bodyStyle = mergeStyle(data?.bodyStyle, section.bodyStyle);

                  return (
                    <section key={i} className="nsm__section">
                      {section.heading ? (
                        <h2
                          className={classFromStyle("nsm__section-title", typo?.sectionTitle, headingStyle)}
                          style={elementStyle(headingStyle)}
                        >
                          {section.heading}
                        </h2>
                      ) : null}
                      {section.body
                        ? section.body.split("\n\n").map((para, j) => (
                            <p
                              key={j}
                              className={classFromStyle("nsm__body-text", typo?.bodyText, bodyStyle)}
                              style={elementStyle(bodyStyle)}
                            >
                              {para}
                            </p>
                          ))
                        : null}
                    </section>
                  );
                })}
            </div>
          </div>

          <div className="nsm__image-col">
            <div className={imageFrameClass}>
              {clipTarget === "image" ? renderClip(clip) : null}

              {image?.src ? (
                <MediaImage
                  src={image.src}
                  alt={image.alt ?? ""}
                  className="nsm__image"
                  sizes="(max-width: 767px) 100vw, 380px"
                />
              ) : (
                <div className="nsm__image-placeholder">Image</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
