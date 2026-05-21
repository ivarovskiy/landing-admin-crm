"use client";

import type React from "react";
import { useRef } from "react";
import { Container } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import { MediaResizeHandle } from "@/components/blocks/media-resize-handle";

type ImageBlockV1Data = {
  src?: string;
  alt?: string;
  caption?: string;
  href?: string;
  aspectRatio?: string;
  naturalW?: number;
  naturalH?: number;
  objectFit?: "cover" | "contain";
  width?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  paddingTop?: string;
  paddingBottom?: string;
  frame?: "none" | "line" | "soft";
  borderRadius?: string;
};

function alignMargin(align: NonNullable<ImageBlockV1Data["align"]>) {
  if (align === "center") return { marginLeft: "auto", marginRight: "auto" };
  if (align === "right") return { marginLeft: "auto" };
  return undefined;
}

export function ImageBlockV1({
  data,
  editMode,
  onChange,
}: {
  data: unknown;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const d = source as ImageBlockV1Data;
  const align = d.align ?? "center";
  const frameRef = useRef<HTMLDivElement>(null);

  const sectionStyle = {
    ...(d.paddingTop ? { paddingTop: d.paddingTop } : {}),
    ...(d.paddingBottom ? { paddingBottom: d.paddingBottom } : {}),
  } as React.CSSProperties;

  const frameStyle = {
    width: d.width ?? "100%",
    maxWidth: d.maxWidth ?? "960px",
    aspectRatio: d.aspectRatio || (d.naturalW && d.naturalH ? `${d.naturalW}/${d.naturalH}` : "16 / 9"),
    borderRadius: d.borderRadius ?? "0px",
    ...alignMargin(align),
  } as React.CSSProperties;

  const image = (
    <div
      ref={frameRef}
      className={[
        "image-block__frame",
        `image-block__frame--${d.frame ?? "none"}`,
        editMode && onChange ? "media-resize-target" : "",
      ].filter(Boolean).join(" ")}
      style={frameStyle}
      data-el="image"
    >
      {d.src ? (
        <MediaImage
          src={d.src}
          alt={d.alt ?? ""}
          className="image-block__media"
          sizes="(max-width: 767px) 100vw, 960px"
          objectFit={editMode && onChange ? "contain" : (d.objectFit ?? "cover")}
        />
      ) : (
        <div className="image-block__placeholder" />
      )}
      {editMode && onChange ? (
        <MediaResizeHandle
          targetRef={frameRef}
          onResize={(width) => onChange({ ...source, width, maxWidth: width })}
        />
      ) : null}
    </div>
  );

  return (
    <section className="image-block" style={sectionStyle}>
      <Container>
        {d.href && !editMode ? (
          <a className="image-block__link" href={d.href}>
            {image}
          </a>
        ) : image}
        {d.caption ? (
          <p className="image-block__caption" style={{ textAlign: align }} data-el="caption">
            {d.caption}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
