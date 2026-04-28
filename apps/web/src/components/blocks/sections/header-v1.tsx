"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/landing/icons";
import { Container, Kicker, Tagline } from "@/components/landing/ui";
import { cn } from "@/lib/cn";
import { pickLogoSource } from "@/lib/section-utils";
import { Logo } from "@/components/landing/brand";

type HeaderLink = {
  label: string;
  href: string;
  children?: HeaderLink[];
  active?: boolean;
  /** When true the item renders as plain text (no <a>, no underline-on-hover, no cursor:pointer).
   *  For parents with children, hover does NOT auto-open the dropdown — only click toggles. */
  noLink?: boolean;
};

type HeaderNavGroups = {
  left: HeaderLink[];
  right: HeaderLink[];
};

export function HeaderV1({ data }: { data: any }) {
  const brand = data?.brand ?? { label: "Ballet School", href: "#hero" };
  const desktopLinks = useMemo(() => normalizeLinks(data?.links), [data?.links]);

  const mobile = data?.mobile ?? {};
  const mobileTop = mobile?.top ?? {};
  const masthead = mobile?.masthead ?? {};
  const mastheadLogo = pickLogoSource(masthead?.logo);

  const portal = mobile?.portal ?? { label: "Parent Portal", href: "#" };
  const promo = mobile?.promo ?? {
    label: "CHECK OUT",
    label2: "OUR",
    logoText: "SIMPLY DANCE",
    subText: "CHILDREN'S PROGRAMS",
    href: "#",
  };

  const menuLinks: HeaderLink[] = useMemo(() => {
    const m = normalizeLinks(mobile?.menu);
    if (m.length) return m;
    return desktopLinks;
  }, [mobile?.menu, desktopLinks]);

  const desktop = data?.desktop ?? {};
  const navGap = desktop?.navGap as string | undefined;
  const desktopPhone = desktop?.phone ?? data?.contacts?.phone ?? mobileTop?.phone;
  const desktopPhoneHref = desktop?.phoneHref ?? mobileTop?.phoneHref;
  const desktopLogo = pickLogoSource(desktop?.logo) ?? mastheadLogo;
  const desktopPortal = desktop?.portal ?? portal;
  const desktopSecondaryPortal = desktop?.secondaryPortal ?? { label: "IBC Ballet Company", href: "#" };

  const desktopNav = useMemo(
    () => buildDesktopGroups(desktop, desktopLinks, menuLinks),
    [desktop, desktopLinks, menuLinks]
  );

  const promoLogo = pickLogoSource(promo?.logo);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!desktopDropdown) return;
    const close = () => setDesktopDropdown(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopDropdown(null);
    };

    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [desktopDropdown]);

  const toggleExpanded = (idx: number) =>
    setExpanded((s) => ({ ...s, [idx]: !s[idx] }));

  return (
    <>
      <header
        className="header"
        ref={headerRef}
        style={navGap ? { "--header-nav-gap": navGap } as React.CSSProperties : undefined}
      >
        <div className="header__bar--mobile nav-container">
          <div className="header__mobile-icons">
            {mobileTop?.phoneNoLink ? (
              <span aria-label="Phone" data-el="mobile-phone" className="is-no-link">
                <Icon name="phone" className="phone-icon-mobile" />
              </span>
            ) : (
              <a href={mobileTop?.phoneHref ?? "#"} aria-label="Phone" data-el="mobile-phone">
                <Icon name="phone" className="phone-icon-mobile" />
              </a>
            )}

            {mobileTop?.emailNoLink ? (
              <span aria-label="Email" data-el="mobile-email" className="is-no-link">
                <Icon name="mail" className="mail-icon-mobile" />
              </span>
            ) : (
              <a href={mobileTop?.emailHref ?? "#"} aria-label="Email" data-el="mobile-email">
                <Icon name="mail" className="mail-icon-mobile" />
              </a>
            )}
          </div>

          <button
            type="button"
            className="header__burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="hamburger" className="hamburger-icon-mobile" />
          </button>
        </div>

        <div className="header__bar--desktop">
          <div className="header-desktop nav-container">

            <div className="header-desktop__top">
              <div className="header-desktop__left">
                {desktopPhone && desktopPhoneHref ? (
                  desktop?.phoneNoLink ? (
                    <span
                      className={cn("header-desktop__phone", "is-no-link")}
                      data-el="desktop-phone-link"
                    >
                      <Icon name="phone" className="header-desktop__phone-icon" aria-hidden />
                      <span className="header-desktop__meta-text header-desktop__meta-text--phone" data-el="desktop-phone">
                        {desktopPhone}
                      </span>
                    </span>
                  ) : (
                    <a
                      href={desktopPhoneHref}
                      className="header-desktop__phone"
                      data-el="desktop-phone-link"
                    >
                      <Icon name="phone" className="header-desktop__phone-icon" aria-hidden />
                      <span className="header-desktop__meta-text header-desktop__meta-text--phone" data-el="desktop-phone">
                        {desktopPhone}
                      </span>
                    </a>
                  )
                ) : null}

                <DesktopNavColumn
                  items={desktopNav.left}
                  align="left"
                  openDropdown={desktopDropdown}
                  onToggle={setDesktopDropdown}
                />
              </div>

              {brand?.noLink ? (
                <span
                  className={cn("header-desktop__center", "is-no-link")}
                  aria-label={brand.label ?? "Logo"}
                  data-el="brand-label"
                >
                  {desktopLogo ? (
                    <span data-el="desktop-logo">
                      <Logo
                        logo={desktopLogo}
                        className="header-desktop__logo"
                        title={brand.label ?? "Logo"}
                      />
                    </span>
                  ) : (
                    <div className="header-desktop__fallback">
                      <div className="header-desktop__fallback-title">IBC</div>
                      <div className="header-desktop__fallback-title">BALLET</div>
                    </div>
                  )}
                </span>
              ) : (
                <a
                  href={brand.href ?? "#"}
                  className="header-desktop__center"
                  aria-label={brand.label ?? "Logo"}
                  data-el="brand-label"
                >
                  {desktopLogo ? (
                    <span data-el="desktop-logo">
                      <Logo
                        logo={desktopLogo}
                        className="header-desktop__logo"
                        title={brand.label ?? "Logo"}
                      />
                    </span>
                  ) : (
                    <div className="header-desktop__fallback">
                      <div className="header-desktop__fallback-title">IBC</div>
                      <div className="header-desktop__fallback-title">BALLET</div>
                    </div>
                  )}
                </a>
              )}

              <div className="header-desktop__right">
                <div className="header-desktop__portals">

                  {desktopSecondaryPortal?.label ? (
                    desktopSecondaryPortal?.noLink ? (
                      <span
                        className={cn("header-desktop__portal", "header-desktop__portal--secondary", "is-no-link")}
                        data-el="cta-secondary"
                      >
                        <span className="header-desktop__meta-text">{desktopSecondaryPortal.label}</span>
                      </span>
                    ) : (
                      <a
                        href={desktopSecondaryPortal.href ?? "#"}
                        className="header-desktop__portal header-desktop__portal--secondary"
                        data-el="cta-secondary"
                      >
                        <span className="header-desktop__meta-text">{desktopSecondaryPortal.label}</span>
                      </a>
                    )
                  ) : null}

                  {desktopPortal?.label ? (
                    desktopPortal?.noLink ? (
                      <span
                        className={cn("header-desktop__portal", "is-no-link")}
                        data-el="cta"
                      >
                        <span className="header-desktop__meta-text">{desktopPortal.label}</span>
                        <Icon name="lock" className="header-desktop__portal-icon" aria-hidden style={{ right: "-8px" }} />
                      </span>
                    ) : (
                      <a
                        href={desktopPortal.href ?? "#"}
                        className="header-desktop__portal"
                        data-el="cta"
                      >
                        <span className="header-desktop__meta-text">{desktopPortal.label}</span>
                        <Icon name="lock" className="header-desktop__portal-icon" aria-hidden style={{ right: "-8px" }} />
                        {/* <Icon name="unlock" className="header-desktop__portal-icon" aria-hidden /> */}
                      </a>
                    )
                  ) : null}


                </div>

                <DesktopNavColumn
                  items={desktopNav.right}
                  align="right"
                  openDropdown={desktopDropdown}
                  onToggle={setDesktopDropdown}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="header-masthead">
        <Container>
          <div className="header-masthead__inner">
            <div
              className="header-masthead__logo-wrap logo-padding"
              data-el="mobile-masthead-logo"
            >
              {mastheadLogo ? (
                <Logo
                  logo={mastheadLogo}
                  className="header-masthead__logo"
                  title="Masthead logo"
                />
              ) : (
                <div className="header-masthead__fallback">
                  <div className="header-masthead__fallback-title">IBC</div>
                  <div className="header-masthead__fallback-title">BALLET</div>
                </div>
              )}
            </div>

            <div data-el="mobile-tagline">
              <Tagline text={masthead?.tagline} />
            </div>
          </div>
        </Container>
      </section>

      <div className={cn("header-menu", open && "is-open")}>
        <div className="header-menu__backdrop" onClick={() => setOpen(false)} />

        <div className="header-menu__panel">
          <Container>
            <div className="header-menu__top-bar">
              <div className="header-menu__top-icons">
                {mobileTop?.phoneNoLink ? (
                  <span aria-label="Phone" className="is-no-link">
                    <Icon name="phone" className="phone-icon-mobile" />
                  </span>
                ) : (
                  <a href={mobileTop?.phoneHref ?? "#"} aria-label="Phone" onClick={() => setOpen(false)}>
                    <Icon name="phone" className="phone-icon-mobile" />
                  </a>
                )}
                {mobileTop?.emailNoLink ? (
                  <span aria-label="Email" className="is-no-link">
                    <Icon name="mail" className="mail-icon-mobile" />
                  </span>
                ) : (
                  <a href={mobileTop?.emailHref ?? "#"} aria-label="Email" onClick={() => setOpen(false)}>
                    <Icon name="mail" className="mail-icon-mobile" />
                  </a>
                )}
              </div>

              <button
                className="header-menu__close"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <Icon name="close" className="header-menu__close-icon" />
              </button>
            </div>

            <div className="header-menu__portal-row">
              {portal?.noLink ? (
                <span
                  data-el="mobile-portal"
                  className={cn("header-menu__portal-btn", "is-no-link")}
                  aria-label={portal.label ?? "Parent Portal"}
                >
                  <Icon name="parent-portal" className="header-menu__portal-btn-img" />
                </span>
              ) : (
                <a
                  href={portal.href ?? "#"}
                  onClick={() => setOpen(false)}
                  data-el="mobile-portal"
                  className="header-menu__portal-btn"
                  aria-label={portal.label ?? "Parent Portal"}
                >
                  <Icon name="parent-portal" className="header-menu__portal-btn-img" />
                </a>
              )}
            </div>

            <div className="header-menu__links">
              {menuLinks.map((item, idx) => {
                const hasChildren =
                  Array.isArray(item.children) && item.children.length > 0;
                const passive = isPassiveParent(item);
                // Passive parents have nothing to navigate to and no navigable
                // children — keep the subtree statically expanded and skip the
                // toggle button so the user can never collapse it via a tap.
                const isOpen = passive ? true : !!expanded[idx];
                const isNoLink = item.noLink === true || passive;

                return (
                  <div key={`${item.label}-${idx}`}>
                    <div className="header-menu__link-row">
                      {isNoLink ? (
                        <span className={cn("ds-kicker", "is-no-link")}>{item.label}</span>
                      ) : (
                        <a
                          href={item.href ?? "#"}
                          className="ds-kicker"
                          onClick={() => {
                            if (!hasChildren) setOpen(false);
                          }}
                        >
                          {item.label}
                        </a>
                      )}

                      {hasChildren && !passive ? (
                        <button
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          onClick={() => toggleExpanded(idx)}
                          className="header-menu__expand-btn"
                        >
                          <Icon
                            name={isOpen ? "collapse" : "expand"}
                            className="header-menu__expand-icon"
                          />
                        </button>
                      ) : null}
                    </div>

                    {hasChildren ? (
                      <div className={cn("header-submenu", isOpen && "is-expanded")}>
                        <div className="header-submenu__list">
                          {item.children!.map((c, i) =>
                            c.noLink ? (
                              <span
                                key={`${c.label}-${i}`}
                                className={cn("header-submenu__child", "is-no-link")}
                              >
                                {c.label}
                              </span>
                            ) : (
                              <a
                                key={`${c.label}-${i}`}
                                href={c.href ?? "#"}
                                className="header-submenu__child"
                                onClick={() => setOpen(false)}
                              >
                                {c.label}
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>


            <div className="header-menu__spacer" />
          </Container>
        </div>
      </div>
    </>
  );
}

function DesktopNavColumn({
  items,
  align,
  openDropdown,
  onToggle,
}: {
  items: HeaderLink[];
  align: "left" | "right";
  openDropdown: string | null;
  onToggle: (key: string | null) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const [dropdownLeft, setDropdownLeft] = useState(0);

  const activeItemIndex = useMemo(() => {
    return items.findIndex((item) => {
      const key = toKey(item.label);
      return key === openDropdown && Array.isArray(item.children) && item.children.length > 0;
    });
  }, [items, openDropdown]);

  const activeItem = activeItemIndex >= 0 ? items[activeItemIndex] : undefined;

  useLayoutEffect(() => {
    if (!activeItem?.children?.length) return;

    const updatePosition = () => {
      const row = rowRef.current;
      const dropdown = dropdownRef.current;
      const trigger = triggerRefs.current[toKey(activeItem.label)];

      if (!row || !dropdown || !trigger) return;

      const rowRect = row.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();

      if (!row.offsetWidth || !dropdownRect.width) return;

      // getBoundingClientRect() returns visual pixels (affected by CSS zoom / transform:scale).
      // CSS `left` is in layout pixels. Divide by scale to convert between the two.
      const rowScale = row.offsetWidth > 0 ? rowRect.width / row.offsetWidth : 1;

      const dropdownWidth = dropdownRect.width / rowScale;
      const triggerLeft = (triggerRect.left - rowRect.left) / rowScale;
      const triggerCenter = triggerLeft + triggerRect.width / rowScale / 2;

      // Determine which child to center under the trigger.
      // Items near the left edge of left-nav (or right edge of right-nav) align
      // with an outer child so the dropdown doesn't overhang the near edge.
      // Formula: childCenterIdx = clamp(stepsFromEdge - 1, 0, naturalCenter)
      //   where naturalCenter = floor((childCount-1)/2) — the middle child.
      const childrenEls = Array.from(dropdown.children) as HTMLElement[];
      const childCount = childrenEls.length;
      const stepsFromEdge =
        align === "left" ? activeItemIndex : items.length - 1 - activeItemIndex;
      const naturalCenter = Math.floor((childCount - 1) / 2);
      const childCenterIdx = Math.max(0, Math.min(stepsFromEdge - 1, naturalCenter));

      const targetChild = childrenEls[childCenterIdx];
      const childRect = targetChild?.getBoundingClientRect();
      // Center of target child relative to dropdown's left edge, in layout pixels
      const childOffsetFromDropdown = childRect
        ? (childRect.left - dropdownRect.left) / rowScale + childRect.width / rowScale / 2
        : dropdownWidth / 2;

      // Clamp to the ROW boundaries — dropdown must not extend past either
      // edge of its nav-row. When natural centering would overflow, snap to
      // the boundary (perfect centering gives way to "no overflow").
      const viewportWidth = document.documentElement.clientWidth;
      const minLeft = 0;
      const rightBoundaryVisual =
        align === "right"
          ? rowRect.right - rowRect.left
          : viewportWidth - rowRect.left;
      const rightBoundary = rightBoundaryVisual / rowScale;
      const maxLeft = Math.max(minLeft, rightBoundary - dropdownWidth);

      // First nav item: left-align dropdown with trigger's left edge ("від краю")
      // All other items: center the appropriate child under the trigger
      let nextLeft =
        activeItemIndex === 0
          ? triggerLeft
          : triggerCenter - childOffsetFromDropdown;
      nextLeft = Math.min(Math.max(nextLeft, minLeft), maxLeft);

      setDropdownLeft(nextLeft);
    };

    // Run synchronously inside useLayoutEffect — DOM is already updated, before paint.
    // No RAF needed: measuring immediately avoids the flash of wrong position.
    updatePosition();

    window.addEventListener("resize", updatePosition);

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updatePosition) : null;

    if (ro) {
      if (rowRef.current) ro.observe(rowRef.current);
      if (dropdownRef.current) ro.observe(dropdownRef.current);

      const trigger = triggerRefs.current[toKey(activeItem.label)];
      if (trigger) ro.observe(trigger);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      ro?.disconnect();
    };
  }, [activeItem, activeItemIndex, align, items.length]);

  return (
    <div
      className={cn(
        "header-desktop__nav-column",
        align === "right" && "header-desktop__nav-column--right"
      )}
    >
      <div
        ref={rowRef}
        className={cn(
          "header-desktop__nav-row",
          align === "right" && "header-desktop__nav-row--right"
        )}
        onMouseLeave={() => onToggle(null)}
      >
        {items.map((item, idx) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const key = toKey(item.label);
          const isOpen = openDropdown === key;
          const passive = isPassiveParent(item);
          // Treat passive parents (no own link AND no navigable descendant)
          // exactly like an explicit no-link item — render as plain text, click
          // is a no-op so the dropdown never toggles via clicking the label.
          const isNoLink = item.noLink === true || passive;

          // Hover opens the dropdown for parents (no-link or not). For no-link
          // parents the LABEL itself never reacts to a click — neither
          // navigates nor toggles the dropdown — so the menu is purely
          // hover-driven and no accidental tap collapses it.
          const onMouseEnter = () => {
            if (hasChildren) onToggle(key);
            else onToggle(null);
          };

          const linkClass = cn(
            "header-desktop__nav-link",
            (item.active || isOpen) && "is-active",
            isNoLink && "is-no-link"
          );

          return (
            <span
              key={`${item.label}-${idx}`}
              ref={(el) => {
                triggerRefs.current[key] = el;
              }}
              className={cn(
                "header-desktop__nav-item",
                hasChildren && "has-children",
                hasChildren && isOpen && "has-open-dropdown",
                isNoLink && "is-no-link"
              )}
              onMouseEnter={onMouseEnter}
            >
              {isNoLink ? (
                <span className={linkClass}>{item.label}</span>
              ) : (
                <a
                  href={item.href ?? "#"}
                  className={linkClass}
                  onClick={
                    hasChildren
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggle(isOpen ? null : key);
                        }
                      : () => onToggle(null)
                  }
                >
                  {item.label}
                </a>
              )}
            </span>
          );
        })}

        {activeItem?.children?.length ? (
          <div
            ref={dropdownRef}
            className={cn("header-desktop__dropdown", "is-open")}
            style={{ left: `${dropdownLeft}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeItem.children.map((child, i) => {
              const linkClass = cn(
                "header-desktop__subnav-link",
                child.active && "is-active",
                child.noLink && "is-no-link"
              );
              if (child.noLink) {
                return (
                  <span
                    key={`${activeItem.label}-${child.label}-${i}`}
                    className={linkClass}
                  >
                    {child.label}
                  </span>
                );
              }
              return (
                <a
                  key={`${activeItem.label}-${child.label}-${i}`}
                  href={child.href ?? "#"}
                  className={linkClass}
                  onClick={() => onToggle(null)}
                >
                  {child.label}
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildDesktopGroups(
  desktop: any,
  desktopLinks: HeaderLink[],
  menuLinks: HeaderLink[]
): HeaderNavGroups {
  const navigation = desktop?.navigation ?? {};

  const explicitLeft = normalizeLinks(
    navigation?.left ?? desktop?.left ?? desktop?.leftLinks ?? desktop?.links?.left
  );
  const explicitRight = normalizeLinks(
    navigation?.right ?? desktop?.right ?? desktop?.rightLinks ?? desktop?.links?.right
  );

  if (explicitLeft.length || explicitRight.length) {
    return {
      left: inheritChildren(explicitLeft, menuLinks),
      right: inheritChildren(explicitRight, menuLinks),
    };
  }

  const enriched = inheritChildren(desktopLinks, menuLinks);
  const splitAt =
    typeof desktop?.splitAt === "number" && Number.isFinite(desktop.splitAt)
      ? desktop.splitAt
      : Math.ceil(enriched.length / 2);

  return {
    left: enriched.slice(0, splitAt),
    right: enriched.slice(splitAt),
  };
}

function inheritChildren(items: HeaderLink[], source: HeaderLink[]): HeaderLink[] {
  const sourceMap = new Map(source.map((item) => [toKey(item.label), item] as const));

  return items.map((item) => {
    const matchingSource = sourceMap.get(toKey(item.label));
    const inheritedChildren = item.children?.length ? item.children : matchingSource?.children;

    return {
      ...item,
      children: inheritedChildren?.length ? inheritedChildren : undefined,
    };
  });
}

function normalizeLinks(value: unknown): HeaderLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeLink(item))
    .filter((item): item is HeaderLink => Boolean(item));
}

function normalizeLink(value: any): HeaderLink | null {
  if (!value || typeof value !== "object") return null;
  if (value.hidden === true) return null;
  if (!value.label) return null;

  const label = String(value.label).trim();
  if (!label) return null;

  const children = normalizeLinks(value.children);

  return {
    label,
    href: typeof value.href === "string" && value.href.trim() ? value.href : "#",
    active: Boolean(value.active),
    noLink: value.noLink === true,
    children: children.length ? children : undefined,
  };
}

function toKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True when the item is a navigable link (own href that isn't a placeholder). */
function hasOwnLink(item: HeaderLink): boolean {
  if (item.noLink) return false;
  if (typeof item.href !== "string") return false;
  const trimmed = item.href.trim();
  return trimmed !== "" && trimmed !== "#";
}

function hasNavigableDescendant(item: HeaderLink): boolean {
  if (!item.children?.length) return false;
  return item.children.some((c) => hasOwnLink(c) || hasNavigableDescendant(c));
}

/** Parent that has children but neither it nor any descendant has a navigable link.
 *  Clicking such an item is meaningless — disable click toggle on desktop and the
 *  expand/collapse button on mobile, but still render its subtree statically so
 *  the labels remain visible. */
function isPassiveParent(item: HeaderLink): boolean {
  if (!item.children?.length) return false;
  return !hasOwnLink(item) && !hasNavigableDescendant(item);
}


