import type React from "react";
import { Container, Kicker, OutlineStampText } from "@/components/landing/ui";
import ClipIcon from "@/assets/icons/clip.svg";

type ResponsiveItemLayout = {
  width?: string;
  offsetX?: string;
  gapBefore?: string;
  align?: "start" | "center" | "end";
};

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

  if (item.kind === "text" && item.textMaxWidth) {
    s["--cp-text-max-w"] = item.textMaxWidth;
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
          <img
            src={item.src}
            alt={item.alt ?? ""}
            className="cp__image"
            loading="lazy"
          />
        ) : (
          <div className="cp__image cp__image--placeholder" />
        )}
      </div>
    );
  }

  return (
    <div
      key={`txt-${idx}`}
      className="cp__item cp__item--text"
      style={itemStyle(item)}
    >
      {item.heading ? (
        <Kicker className="cp__heading" data-el={`${col}-${idx}-heading`}>{item.heading}</Kicker>
      ) : null}
      {item.body ? (
        <div className="cp__prose" data-el={`${col}-${idx}-body`}>
          {item.body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
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

  const columnsStyle = contentMaxWidth
    ? ({ "--cp-content-max-w": contentMaxWidth } as React.CSSProperties)
    : undefined;

  const columns = left.length > 0 || right.length > 0 ? (
    <div className="cp__columns" style={columnsStyle}>
      <div className="cp__col cp__col--left">
        {left.map((item, idx) => renderItem(item, idx, "left"))}
      </div>
      <div className="cp__col cp__col--right">
        {right.map((item, idx) => renderItem(item, idx, "right"))}
      </div>
    </div>
  ) : null;

  return (
    <section className="content-page">
      <Container>
        {kicker || title || subtitle || cta?.label ? (
          <div className="cp__hero">
            <div className="cp__hero-text">
              {kicker ? <div data-el="kicker" className="typo-teachers-header">{kicker}</div> : null}
              {title ? (
                <OutlineStampText as="h1" className="cp__title" data-el="title">
                  {title}
                </OutlineStampText>
              ) : null}
              {subtitle ? <p className="typo-subtitle" data-el="subtitle">{subtitle}</p> : null}
            </div>
            {cta?.label ? (
              <div className="cp__hero-cta">
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
