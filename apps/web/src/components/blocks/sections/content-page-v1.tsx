import type React from "react";
import { Container, Kicker, OutlineStampText, STAMP_TITLE } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import ClipIcon from "@/assets/icons/clip.svg";

type ResponsiveItemLayout = {
  width?: string;
  offsetX?: string;
  gapBefore?: string;
  align?: "start" | "center" | "end";
};

type TextAlign = "left" | "center" | "right";

type ContentItem = {
  kind: "image" | "text";
  // image
  src?: string;
  alt?: string;
  aspectRatio?: string; // e.g. "4/3", "1/1", "3/4"
  imageWidth?: string;  // e.g. "420px"
  imageHeight?: string; // e.g. "253px"
  imagePadding?: string; // e.g. "0 113px 33px 0"
  // text
  heading?: string;
  body?: string;
  textMaxWidth?: string;
  textAlign?: TextAlign;
  headingTypo?: string;
  bodyTypo?: string;
  // mobile
  mobileOrder?: number;
  // free-flow layout per breakpoint
  layout?: {
    md?: ResponsiveItemLayout;
    lg?: ResponsiveItemLayout;
  };
};

function normalize(raw: unknown): ContentItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x: any) => x && typeof x === "object" && (x.kind === "image" || x.kind === "text"),
  ) as ContentItem[];
}

function mapAlign(value?: "start" | "center" | "end") {
  if (value === "center") return "center";
  if (value === "end") return "flex-end";
  return "flex-start";
}

function applyLayoutVars(
  out: Record<string, string>,
  bp: "md" | "lg",
  layout?: ResponsiveItemLayout,
) {
  if (!layout) return;

  if (layout.width) {
    out[`--cp-width-${bp}`] = layout.width;
  }

  if (layout.offsetX) {
    out[`--cp-offset-${bp}`] = layout.offsetX;
  }

  if (layout.gapBefore) {
    out[`--cp-gap-${bp}`] = layout.gapBefore;
  }

  if (layout.align) {
    out[`--cp-align-${bp}`] = mapAlign(layout.align);
  }
}

function itemStyle(item: ContentItem): React.CSSProperties {
  const s: Record<string, string> = {};

  if (typeof item.mobileOrder === "number") {
    s["--mobile-order"] = String(item.mobileOrder);
  }

  if (item.kind === "image") {
    if (item.aspectRatio) s["--aspect"] = item.aspectRatio;
    if (item.imageWidth) s["--img-w"] = item.imageWidth;
    if (item.imageHeight) s["--img-h"] = item.imageHeight;
    if (item.imagePadding) s["--img-padding"] = item.imagePadding;
  }

  if (item.kind === "text") {
    if (item.textMaxWidth) s["--cp-text-max-w"] = item.textMaxWidth;
    if (item.textAlign) s.textAlign = item.textAlign;
  }

  applyLayoutVars(s, "md", item.layout?.md);
  applyLayoutVars(s, "lg", item.layout?.lg);

  return s as React.CSSProperties;
}

function renderItem(item: ContentItem, idx: number, col: "left" | "right") {
  if (item.kind === "image") {
    return (
      <div
        key={`img-${idx}`}
        className="cp__item cp__item--image"
        style={itemStyle(item)}
        data-el={`${col}-${idx}-image`}
      >
        {item.src ? (
          <MediaImage
            src={item.src}
            alt={item.alt ?? ""}
            className="cp__image"
            sizes="(max-width: 767px) 100vw, 530px"
          />
        ) : (
          <div className="cp__image cp__image--placeholder" />
        )}
      </div>
    );
  }

  const headingClass = ["cp__heading", item.headingTypo].filter(Boolean).join(" ");
  const bodyClass = ["cp__prose", item.bodyTypo].filter(Boolean).join(" ");

  return (
    <div
      key={`txt-${idx}`}
      className="cp__item cp__item--text"
      style={itemStyle(item)}
    >
      {item.heading ? (
        <Kicker className={headingClass} data-el={`${col}-${idx}-heading`}>{item.heading}</Kicker>
      ) : null}
      {item.body ? (
        <div className={bodyClass} data-el={`${col}-${idx}-body`}>
          {item.body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type HeroAlign = TextAlign;

function alignStyle(align?: TextAlign): React.CSSProperties | undefined {
  return align ? { textAlign: align } : undefined;
}

export function ContentPageV1({ data }: { data: any }) {
  const kicker = data?.kicker;
  const title =
    typeof data?.title === "string" ? data.title.replace(/\s*\n\s*/g, " ") : data?.title;
  const subtitle = data?.subtitle;
  const cta = data?.cta as { label?: string; href?: string } | undefined;
  const left = normalize(data?.left);
  const right = normalize(data?.right);
  const contentMaxWidth = data?.maxWidth as string | undefined;
  const boxed = !!data?.boxed;

  const heroAlign = data?.heroAlign as HeroAlign | undefined;
  const kickerAlign = (data?.kickerAlign as TextAlign | undefined) ?? heroAlign;
  const titleAlign = (data?.titleAlign as TextAlign | undefined) ?? heroAlign;
  const subtitleAlign = (data?.subtitleAlign as TextAlign | undefined) ?? heroAlign;
  const ctaAlign = data?.ctaAlign as TextAlign | undefined;
  const kickerTypo = (data?.kickerTypo as string | undefined) ?? "typo-teachers-header";
  const subtitleTypo = (data?.subtitleTypo as string | undefined) ?? "typo-subtitle";

  const columnsMode: "one" | "two" = data?.columns === "one" ? "one" : "two";

  const columnsStyle = contentMaxWidth
    ? ({ "--cp-content-max-w": contentMaxWidth } as React.CSSProperties)
    : undefined;

  const columnsClass = ["cp__columns", columnsMode === "one" ? "cp__columns--single" : ""]
    .filter(Boolean)
    .join(" ");

  const columns =
    columnsMode === "one" ? (
      left.length > 0 ? (
        <div className={columnsClass} style={columnsStyle}>
          <div className="cp__col cp__col--left">
            {left.map((item, idx) => renderItem(item, idx, "left"))}
          </div>
        </div>
      ) : null
    ) : left.length > 0 || right.length > 0 ? (
      <div className={columnsClass} style={columnsStyle}>
        <div className="cp__col cp__col--left">
          {left.map((item, idx) => renderItem(item, idx, "left"))}
        </div>
        <div className="cp__col cp__col--right">
          {right.map((item, idx) => renderItem(item, idx, "right"))}
        </div>
      </div>
    ) : null;

  const heroClass = ["cp__hero", heroAlign ? `cp__hero--align-${heroAlign}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="content-page">
      <Container>
        {kicker || title || subtitle || cta?.label ? (
          <div className={heroClass}>
            <div className="cp__hero-text">
              {kicker ? (
                <div className="cp__hero-row" style={alignStyle(kickerAlign)}>
                  <div data-el="kicker" className={kickerTypo}>
                    {kicker}
                  </div>
                </div>
              ) : null}
              {title ? (
                <div className="cp__hero-row" style={alignStyle(titleAlign)}>
                  <OutlineStampText
                    as="h1"
                    className="cp__title"
                    stamp={STAMP_TITLE}
                    data-el="title"
                  >
                    {title}
                  </OutlineStampText>
                </div>
              ) : null}
              {subtitle ? (
                <div className="cp__hero-row" style={alignStyle(subtitleAlign)}>
                  <p className={subtitleTypo} data-el="subtitle">
                    {subtitle}
                  </p>
                </div>
              ) : null}
            </div>
            {cta?.label ? (
              <div className="cp__hero-cta" style={alignStyle(ctaAlign)}>
                <a href={cta.href ?? "#"} className="cp__cta-btn" data-el="cta">
                  {cta.label}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {boxed ? (
          <div className="cp__box">
            <div className="cp__box-clip" aria-hidden="true">
              <ClipIcon />
            </div>
            {columns}
          </div>
        ) : columns}
      </Container>
    </section>
  );
}
