import type React from "react";
import { Container, Hairline, Kicker } from "@/components/landing/ui";
import { Logo } from "@/components/landing/brand";
import { Icon } from "@/components/landing/icons";
import { cn } from "@/lib/cn";
import { pickLogoSource } from "@/lib/section-utils";

import FooterRuleAsset from "@/assets/icons/footer.svg";
import FooterDoubleRuleAsset from "@/assets/icons/slider_v1.svg";

type Link = { label?: string; href?: string; noLink?: boolean };
type Column = { links?: Link[] };

export function FooterV1({ data }: { data: any }) {
  const hasNew =
    data?.left || data?.columns || data?.right || data?.bottomText || data?._layout;

  if (!hasNew) {
    return (
      <footer className="footer-legacy">
        <Container>
          <div className="footer-legacy__inner">{data?.text ?? "\u00A9"}</div>
        </Container>
      </footer>
    );
  }

  const left = data?.left ?? {};
  const right = data?.right ?? {};
  const portal = right?.portal ?? {};
  const promo = right?.promo ?? {};
  const columns: Column[] = Array.isArray(data?.columns) ? data.columns : [];
  const allLinks: Link[] = columns.flatMap((c) => (Array.isArray(c?.links) ? c.links : []));
  const bottomText: string = data?.bottomText ?? data?.text ?? "";

  const leftLogo = pickLogoSource(left?.logo) ?? pickLogoSource(left);
  const promoLogo =
    pickLogoSource(promo?.logo) ??
    (promo?.logoImageSrc
      ? ({ kind: "url", src: promo.logoImageSrc, alt: promo.logoText } as const)
      : null);

  const portalIcon =
    portal?.icon === "unlock"
      ? "unlock"
      : "lock";

  return (
    <footer className="footer">
      <Container>
        <DoubleHairline className="footer__double-hairline" />

        {/* MOBILE / TABLET */}
        <div className="footer-mobile">
          <div className="footer-mobile__brand">
            <MaybeLink
              noLink={!!left?.noLink}
              href={left?.href ?? "#top"}
              className="footer-mobile__brand-link"
              data-el="left-logo"
            >
              {leftLogo ? (
                <Logo
                  logo={leftLogo}
                  className="footer-mobile__logo"
                  title={left?.logoText ?? "Logo"}
                />
              ) : (
                <div>
                  <div className="footer-brand-text">{left?.logoText ?? "SIMPLY DANCE STUDIO"}</div>
                  {left?.subText ? (
                    <Kicker size="sm" className="footer-sub">
                      {left.subText}
                    </Kicker>
                  ) : null}
                </div>
              )}
            </MaybeLink>
          </div>

          {portal?.label ? (
            <div className="footer-mobile__portal" data-el="portal">
              <MaybeLink
                noLink={!!portal?.noLink}
                href={portal?.href ?? "#"}
                className="footer-mobile__portal-link"
              >
                <span className="footer-meta">{portal.label}</span>
                <Icon name={portalIcon} className="footer-mobile__portal-icon" aria-hidden />
              </MaybeLink>
            </div>
          ) : null}

          <div className="footer-mobile__links">
            {allLinks.map((l, i) => (
              <FooterLink key={i} link={l} align="center" />
            ))}
          </div>

          {promo?.label ? (
            <div className="footer-mobile__promo">
              <MaybeLink
                noLink={!!promo?.noLink}
                href={promo?.href ?? "#"}
                className="footer-mobile__promo-link"
                data-el="promo-link"
              >
                <span className="footer-meta" data-el="promo-label">
                  {promo.label}
                </span>
              </MaybeLink>

              <div className="footer-mobile__promo-logo-wrap">
                <MaybeLink
                  noLink={!!promo?.noLink}
                  href={promo?.href ?? "#"}
                  className="footer-mobile__promo-link"
                >
                  {promoLogo ? (
                    <span data-el="promo-logo">
                      <Logo
                        logo={promoLogo}
                        className="footer-mobile__promo-logo"
                        title={promo?.logoText ?? "Promo"}
                      />
                    </span>
                  ) : (
                    <div>
                      <div className="footer-promo-text" data-el="promo-logo-text">
                        {promo?.logoText ?? "IBC BALLET"}
                      </div>
                      {promo?.subText ? (
                        <Kicker size="sm" className="footer-sub" data-el="promo-sub-text">
                          {promo.subText}
                        </Kicker>
                      ) : null}
                    </div>
                  )}
                </MaybeLink>
              </div>
            </div>
          ) : null}

          <FooterRule className="footer-mobile__rule" />

          {bottomText ? (
            <div className="footer-mobile__bottom" data-el="bottom-text">
              <div className="footer-copyright">{bottomText}</div>
            </div>
          ) : null}
        </div>

        {/* DESKTOP */}
        <div className="footer-desktop">
          <div className="footer-desktop__grid">
            <div className="footer-desktop__brand">
              <MaybeLink
                noLink={!!left?.noLink}
                href={left?.href ?? "#top"}
                className="footer-desktop__brand-link"
                data-el="left-logo"
              >
                {leftLogo ? (
                  <Logo
                    logo={leftLogo}
                    className="footer-desktop__logo"
                    title={left?.logoText ?? "Logo"}
                  />
                ) : (
                  <div>
                    <div className="footer-brand-text">{left?.logoText ?? "SIMPLY DANCE STUDIO"}</div>
                    {left?.subText ? (
                      <Kicker size="sm" className="footer-sub">
                        {left.subText}
                      </Kicker>
                    ) : null}
                  </div>
                )}
              </MaybeLink>
            </div>

            <div className="footer-desktop__columns">
              {columns.map((col, idx) => (
                <div key={idx} className="footer-desktop__column">
                  {(col.links ?? []).map((l, i) => (
                    <FooterLink key={`${idx}-${i}`} link={l} align="left" />
                  ))}
                </div>
              ))}
            </div>

            <div className="footer-desktop__right">
              {portal?.label ? (
                <div data-el="portal" style={{width : "100%"}}>
                  <MaybeLink
                    noLink={!!portal?.noLink}
                    href={portal?.href ?? "#"}
                    className="footer-desktop__portal-link"
                  >
                    <span className="footer-meta">{portal.label}</span>
                    <Icon name={portalIcon} className="footer-desktop__portal-icon" aria-hidden />
                  </MaybeLink>
                </div>
              ) : null}

              {promo?.label ? (
                <div className="footer-desktop__promo">
                  <MaybeLink
                    noLink={!!promo?.noLink}
                    href={promo?.href ?? "#"}
                    className="footer-desktop__promo-link"
                    data-el="promo-link"
                  >
                    <span className="footer-meta" data-el="promo-label">
                      {promo.label}
                    </span>
                  </MaybeLink>

                  <div className="footer-desktop__promo-logo-wrap">
                    <MaybeLink
                      noLink={!!promo?.noLink}
                      href={promo?.href ?? "#"}
                      className="footer-desktop__promo-link"
                    >
                      {promoLogo ? (
                        <span data-el="promo-logo">
                          <Logo
                            logo={promoLogo}
                            className="footer-desktop__promo-logo"
                            title={promo?.logoText ?? "Promo"}
                          />
                        </span>
                      ) : (
                        <div>
                          <div className="footer-promo-text" data-el="promo-logo-text">
                            {promo?.logoText ?? "IBC BALLET"}
                          </div>
                          {promo?.subText ? (
                            <Kicker size="sm" className="footer-sub" data-el="promo-sub-text">
                              {promo.subText}
                            </Kicker>
                          ) : null}
                        </div>
                      )}
                    </MaybeLink>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "end", justifyContent: "flex-end" }}>
            <img src="/icons/footer.svg" alt="" className="footer-desktop__rule"/>
            {/* <FooterRule className="footer-desktop__rule" /> */}
          </div>
          

          {bottomText ? (
            <div className="footer-desktop__bottom" data-el="bottom-text">
              <div className="footer-copyright">{bottomText}</div>
            </div>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}

function FooterLink({ link, align }: { link: Link; align: "left" | "center" }) {
  const className = cn(
    "footer-link",
    align === "left" ? "footer-link--left" : "footer-link--center",
    link?.noLink && "is-no-link"
  );

  if (link?.noLink) {
    return <span className={className}>{link?.label ?? "Link"}</span>;
  }
  return (
    <a href={link?.href ?? "#"} className={className}>
      {link?.label ?? "Link"}
    </a>
  );
}

/**
 * Renders an <a href> when interactive, or a styled <span class="is-no-link">
 * when `noLink` is true. Used across the footer to honor per-link toggles.
 */
function MaybeLink({
  noLink,
  href,
  className,
  children,
  ...rest
}: {
  noLink?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  if (noLink) {
    return (
      <span className={cn(className, "is-no-link")} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <a href={href ?? "#"} className={className} {...rest}>
      {children}
    </a>
  );
}

function DoubleHairline({ className }: { className?: string }) {
  const Comp: any = (FooterDoubleRuleAsset as any)?.default ?? FooterDoubleRuleAsset;

  if (typeof Comp === "function") {
    return (
      <Comp
        className={cn("footer-rule", className)}
        aria-hidden="true"
        focusable="false"
      />
    );
  }

  return <img src={String(Comp)} alt="" className={cn("footer-rule", className)} />;
}

function FooterRule({ className }: { className?: string }) {
  const Comp: any = (FooterRuleAsset as any)?.default ?? FooterRuleAsset;

  if (typeof Comp === "function") {
    return (
      <Comp
        className={cn("footer-rule", className)}
        aria-hidden="true"
        focusable="false"
      />
    );
  }

  return <img src={String(Comp)} alt="" className={cn("footer-rule", className)} />;
}
