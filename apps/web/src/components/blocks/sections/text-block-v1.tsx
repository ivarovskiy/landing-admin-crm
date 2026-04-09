import type React from "react";
import { Container } from "@/components/landing/ui";

type TextBlockV1Data = {
  kicker?: string;
  heading?: string;
  body?: string;
  cta?: { label?: string; href?: string };
  maxWidth?: string;
  align?: "left" | "center" | "right";
  paddingTop?: string;
  paddingBottom?: string;
};

export function TextBlockV1({ data }: { data: any }) {
  const d = data as TextBlockV1Data;
  const align = d?.align ?? "left";

  const sectionStyle = {
    ...(d?.paddingTop ? { paddingTop: d.paddingTop } : {}),
    ...(d?.paddingBottom ? { paddingBottom: d.paddingBottom } : {}),
  } as React.CSSProperties;

  const innerStyle = {
    textAlign: align,
    ...(d?.maxWidth ? { maxWidth: d.maxWidth, marginLeft: align === "center" ? "auto" : undefined, marginRight: align === "center" ? "auto" : undefined } : {}),
  } as React.CSSProperties;

  return (
    <section className="text-block" style={sectionStyle}>
      <Container>
        <div className="tb__inner" style={innerStyle}>
          {d?.kicker ? (
            <div className="tb__kicker" data-el="kicker">{d.kicker}</div>
          ) : null}
          {d?.heading ? (
            <h2 className="tb__heading" data-el="heading">{d.heading}</h2>
          ) : null}
          {d?.body ? (
            <div className="tb__body" data-el="body">
              {d.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null}
          {d?.cta?.label ? (
            <div className="tb__cta">
              <a href={d.cta.href ?? "#"} className="tb__cta-btn" data-el="cta">
                {d.cta.label}
              </a>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
