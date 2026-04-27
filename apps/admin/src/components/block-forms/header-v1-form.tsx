"use client";

import type { BlockFormProps } from "./index";
import { arr, setAt } from "@/lib/array";
import { updatePath } from "@/lib/update-path";
import { LogoField, normalizeLogo } from "./logo-field";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  BlockLayoutSection,
  HrefInput,
} from "@/components/inspector";
import { Monitor, Smartphone, PanelLeft, PanelRight, Menu, Megaphone, Plus, Eye, EyeOff, ChevronDown, ChevronRight, Link2, Link2Off } from "lucide-react";
import { useState } from "react";

type LinkItem = { label?: string; href?: string; hidden?: boolean; noLink?: boolean };
type NavItem = { label?: string; href?: string; children?: LinkItem[]; hidden?: boolean; noLink?: boolean };

/* ------------------------------------------------------------------ */
/*  Reusable nav-item editor (label + href + collapsible children)    */
/* ------------------------------------------------------------------ */
function NavItemEditor({
  item,
  basePath,
  set,
  onToggleHidden,
  onToggleNoLink,
  idx,
}: {
  item: NavItem;
  basePath: (string | number)[];
  set: (path: (string | number)[], v: unknown) => void;
  onToggleHidden: () => void;
  onToggleNoLink: () => void;
  idx: number;
}) {
  const children = arr<LinkItem>(item?.children);
  const [open, setOpen] = useState(children.length > 0);
  const isHidden = !!item?.hidden;
  const isNoLink = !!item?.noLink;

  return (
    <div className={`rounded-md border p-2 space-y-1.5 bg-muted/10 ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span className={isHidden ? "line-through" : ""}>
            {idx + 1}. {item?.label || "Link"}
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleNoLink}
            className={isNoLink ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}
            title={isNoLink ? "Make clickable link" : "Make non-clickable (label only)"}
          >
            {isNoLink ? <Link2Off className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={onToggleHidden}
            className="text-muted-foreground hover:text-foreground"
            title={isHidden ? "Show" : "Hide"}
          >
            {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <InspectorInput
          value={item?.label ?? ""}
          onChange={(v) => set([...basePath, "label"], v)}
          placeholder="Label"
        />
        <div className={isNoLink ? "opacity-40 pointer-events-none" : ""}>
          <InspectorInput
            value={item?.href ?? ""}
            onChange={(v) => set([...basePath, "href"], v)}
            placeholder={isNoLink ? "(non-link)" : "Href"}
          />
        </div>
      </div>

      {open && (
        <div className="pl-2 border-l-2 border-muted space-y-1">
          {children.map((c, cIdx) => {
            const childHidden = !!c?.hidden;
            const childNoLink = !!c?.noLink;
            return (
              <div key={cIdx} className={`flex gap-1 ${childHidden ? "opacity-50" : ""}`}>
                <InspectorInput
                  value={c?.label ?? ""}
                  onChange={(v) => set([...basePath, "children", cIdx, "label"], v)}
                  placeholder="Child label"
                />
                <div className={`flex-1 ${childNoLink ? "opacity-40 pointer-events-none" : ""}`}>
                  <InspectorInput
                    value={c?.href ?? ""}
                    onChange={(v) => set([...basePath, "children", cIdx, "href"], v)}
                    placeholder={childNoLink ? "(non-link)" : "Href"}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      [...basePath, "children"],
                      setAt(children, cIdx, { ...c, noLink: !childNoLink }),
                    )
                  }
                  className={`shrink-0 pt-1.5 ${childNoLink ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}
                  title={childNoLink ? "Make clickable link" : "Make non-clickable (label only)"}
                >
                  {childNoLink ? <Link2Off className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      [...basePath, "children"],
                      setAt(children, cIdx, { ...c, hidden: !childHidden }),
                    )
                  }
                  className="text-muted-foreground hover:text-foreground shrink-0 pt-1.5"
                  title={childHidden ? "Show" : "Hide"}
                >
                  {childHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() =>
              set([...basePath, "children"], [...children, { label: "", href: "" }])
            }
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-2.5 w-2.5" />
            child
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav column editor (left or right)                                 */
/* ------------------------------------------------------------------ */
function NavColumnEditor({
  title,
  icon,
  items,
  path,
  set,
}: {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
  path: (string | number)[];
  set: (path: (string | number)[], v: unknown) => void;
}) {
  return (
    <InspectorSection
      title={title}
      icon={icon}
      badge={
        <button
          type="button"
          onClick={() =>
            set(path, [...items, { label: "", href: "", children: [] }])
          }
          className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
        >
          <Plus className="h-3 w-3" />
        </button>
      }
    >
      <div className="space-y-2">
        {items.map((item, idx) => (
          <NavItemEditor
            key={idx}
            item={item}
            basePath={[...path, idx]}
            set={set}
            onToggleHidden={() => set(path, setAt(items, idx, { ...item, hidden: !item?.hidden }))}
            onToggleNoLink={() => set(path, setAt(items, idx, { ...item, noLink: !item?.noLink }))}
            idx={idx}
          />
        ))}
        {items.length === 0 && (
          <p className="text-[10px] text-muted-foreground italic">No items</p>
        )}
      </div>
    </InspectorSection>
  );
}

/* ------------------------------------------------------------------ */
/*  Main form                                                          */
/* ------------------------------------------------------------------ */
export function HeaderV1Form({ value, onChange }: BlockFormProps) {
  const brand = value?.brand ?? {};
  const desktop = value?.desktop ?? {};
  const desktopPortal = desktop?.portal ?? {};

  const navLeft: NavItem[] = arr<NavItem>(desktop?.navigation?.left);
  const navRight: NavItem[] = arr<NavItem>(desktop?.navigation?.right);

  const mobile = value?.mobile ?? {};
  const top = mobile?.top ?? {};
  const masthead = mobile?.masthead ?? {};
  const portal = mobile?.portal ?? {};
  const menu: NavItem[] = arr<NavItem>(mobile?.menu);
  const promo = mobile?.promo ?? {};

  const mastheadLogo = normalizeLogo(masthead?.logo);
  const desktopLogo = normalizeLogo(desktop?.logo);
  const promoLogo = normalizeLogo(promo?.logo);

  const set = (...args: [path: (string | number)[], v: unknown]) =>
    onChange(updatePath(value, args[0], args[1]));

  return (
    <div>
      {/* ===== Desktop General ===== */}
      <InspectorSection title="Desktop" icon={<Monitor className="h-3 w-3" />}>
        <InspectorField label="Brand name">
          <InspectorInput
            value={brand?.label ?? ""}
            onChange={(v) => set(["brand", "label"], v)}
            placeholder="IBC Ballet"
          />
        </InspectorField>

        <InspectorField label="Brand href">
          <HrefInput
            hrefValue={brand?.href ?? ""}
            noLink={!!brand?.noLink}
            onHrefChange={(v) => set(["brand", "href"], v)}
            onNoLinkChange={(v) => set(["brand", "noLink"], v || undefined)}
            placeholder="#hero"
          />
        </InspectorField>

        <InspectorField label="Logo" stacked>
          <LogoField
            value={desktopLogo}
            onChange={(next) => set(["desktop", "logo"], next)}
            assetPlaceholder="ibc-ballet-logo"
          />
        </InspectorField>

        <InspectorField label="Phone">
          <InspectorInput
            value={desktop?.phone ?? ""}
            onChange={(v) => set(["desktop", "phone"], v)}
            placeholder="(610) 883-0878"
          />
        </InspectorField>

        <InspectorField label="Phone href">
          <HrefInput
            hrefValue={desktop?.phoneHref ?? ""}
            noLink={!!desktop?.phoneNoLink}
            onHrefChange={(v) => set(["desktop", "phoneHref"], v)}
            onNoLinkChange={(v) => set(["desktop", "phoneNoLink"], v || undefined)}
            placeholder="tel:+16108830878"
          />
        </InspectorField>

        <InspectorField label="Portal label">
          <InspectorInput
            value={desktopPortal?.label ?? ""}
            onChange={(v) => set(["desktop", "portal", "label"], v)}
            placeholder="Parent Portal"
          />
        </InspectorField>

        <InspectorField label="Portal href">
          <HrefInput
            hrefValue={desktopPortal?.href ?? ""}
            noLink={!!desktopPortal?.noLink}
            onHrefChange={(v) => set(["desktop", "portal", "href"], v)}
            onNoLinkChange={(v) => set(["desktop", "portal", "noLink"], v || undefined)}
            placeholder="#"
          />
        </InspectorField>

        <InspectorField label="Secondary CTA label">
          <InspectorInput
            value={desktop?.secondaryPortal?.label ?? ""}
            onChange={(v) => set(["desktop", "secondaryPortal", "label"], v)}
            placeholder="IBC Ballet Company"
          />
        </InspectorField>

        <InspectorField label="Secondary CTA href">
          <HrefInput
            hrefValue={desktop?.secondaryPortal?.href ?? ""}
            noLink={!!desktop?.secondaryPortal?.noLink}
            onHrefChange={(v) => set(["desktop", "secondaryPortal", "href"], v)}
            onNoLinkChange={(v) => set(["desktop", "secondaryPortal", "noLink"], v || undefined)}
            placeholder="#"
          />
        </InspectorField>

        <InspectorField label="Nav gap" hint="Gap between nav items, e.g. 28px or 2em">
          <InspectorInput
            value={desktop?.navGap ?? ""}
            onChange={(v) => set(["desktop", "navGap"], v || undefined)}
            placeholder="28px (default)"
          />
        </InspectorField>
      </InspectorSection>

      {/* ===== Desktop Nav Left ===== */}
      <NavColumnEditor
        title="Nav Left"
        icon={<PanelLeft className="h-3 w-3" />}
        items={navLeft}
        path={["desktop", "navigation", "left"]}
        set={set}
      />

      {/* ===== Desktop Nav Right ===== */}
      <NavColumnEditor
        title="Nav Right"
        icon={<PanelRight className="h-3 w-3" />}
        items={navRight}
        path={["desktop", "navigation", "right"]}
        set={set}
      />

      {/* ===== Mobile Top Bar ===== */}
      <InspectorSection title="Mobile Top Bar" icon={<Smartphone className="h-3 w-3" />} defaultOpen={false}>
        <InspectorField label="Phone href">
          <HrefInput
            hrefValue={top?.phoneHref ?? ""}
            noLink={!!top?.phoneNoLink}
            onHrefChange={(v) => set(["mobile", "top", "phoneHref"], v)}
            onNoLinkChange={(v) => set(["mobile", "top", "phoneNoLink"], v || undefined)}
            placeholder="tel:+16108830878"
          />
        </InspectorField>

        <InspectorField label="Email href">
          <HrefInput
            hrefValue={top?.emailHref ?? ""}
            noLink={!!top?.emailNoLink}
            onHrefChange={(v) => set(["mobile", "top", "emailHref"], v)}
            onNoLinkChange={(v) => set(["mobile", "top", "emailNoLink"], v || undefined)}
            placeholder="mailto:info@ibcballet.com"
          />
        </InspectorField>
      </InspectorSection>

      {/* ===== Mobile Masthead ===== */}
      <InspectorSection title="Mobile Masthead" defaultOpen={false}>
        <InspectorField label="Logo" stacked>
          <LogoField
            value={mastheadLogo}
            onChange={(next) => set(["mobile", "masthead", "logo"], next)}
            assetPlaceholder="ibc-ballet-pre"
          />
        </InspectorField>

        <InspectorField label="Tagline" stacked>
          <InspectorTextarea
            value={masthead?.tagline ?? ""}
            onChange={(v) => set(["mobile", "masthead", "tagline"], v)}
            placeholder="ENHANCE\nYOUR TECHNIQUE..."
            rows={3}
          />
        </InspectorField>
      </InspectorSection>

      {/* ===== Mobile Portal ===== */}
      <InspectorSection title="Mobile Portal" defaultOpen={false}>
        <InspectorInput
          value={portal?.label ?? ""}
          onChange={(v) => set(["mobile", "portal", "label"], v)}
          placeholder="Parent Portal"
        />
        <HrefInput
          hrefValue={portal?.href ?? ""}
          noLink={!!portal?.noLink}
          onHrefChange={(v) => set(["mobile", "portal", "href"], v)}
          onNoLinkChange={(v) => set(["mobile", "portal", "noLink"], v || undefined)}
          placeholder="#"
        />
      </InspectorSection>

      {/* ===== Mobile Menu ===== */}
      <InspectorSection
        title="Mobile Menu"
        icon={<Menu className="h-3 w-3" />}
        defaultOpen={false}
        badge={
          <button
            type="button"
            onClick={() =>
              set(["mobile", "menu"], [...menu, { label: "", href: "", children: [] }])
            }
            className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
          </button>
        }
      >
        <div className="space-y-2">
          {menu.map((m, idx) => (
            <NavItemEditor
              key={idx}
              item={m}
              basePath={["mobile", "menu", idx]}
              set={set}
              onToggleHidden={() =>
                set(["mobile", "menu"], setAt(menu, idx, { ...m, hidden: !m?.hidden }))
              }
              onToggleNoLink={() =>
                set(["mobile", "menu"], setAt(menu, idx, { ...m, noLink: !m?.noLink }))
              }
              idx={idx}
            />
          ))}
          {menu.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">
              Falls back to desktop nav when empty
            </p>
          )}
        </div>
      </InspectorSection>

      {/* ===== Mobile Promo ===== */}
      <InspectorSection title="Mobile Promo" icon={<Megaphone className="h-3 w-3" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorInput
            value={promo?.label ?? ""}
            onChange={(v) => set(["mobile", "promo", "label"], v)}
            placeholder="CHECK OUT"
          />
          <InspectorInput
            value={promo?.label2 ?? ""}
            onChange={(v) => set(["mobile", "promo", "label2"], v)}
            placeholder="OUR"
          />
        </div>

        <InspectorField label="Logo" stacked>
          <LogoField
            value={promoLogo}
            onChange={(next) => set(["mobile", "promo", "logo"], next)}
            assetPlaceholder="simply-dance"
          />
        </InspectorField>

        <div className="grid grid-cols-2 gap-1.5">
          <InspectorInput
            value={promo?.logoText ?? ""}
            onChange={(v) => set(["mobile", "promo", "logoText"], v)}
            placeholder="Logo text"
          />
          <InspectorInput
            value={promo?.subText ?? ""}
            onChange={(v) => set(["mobile", "promo", "subText"], v)}
            placeholder="Sub text"
          />
        </div>

        <InspectorField label="Href">
          <HrefInput
            hrefValue={promo?.href ?? ""}
            noLink={!!promo?.noLink}
            onHrefChange={(v) => set(["mobile", "promo", "href"], v)}
            onNoLinkChange={(v) => set(["mobile", "promo", "noLink"], v || undefined)}
            placeholder="#"
          />
        </InspectorField>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
