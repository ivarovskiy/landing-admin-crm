"use client";

import { useState } from "react";
import { Link2, Link2Off, ChevronDown, Globe } from "lucide-react";
import { InspectorInput } from "./section";

type PageLite = { id: string; slug: string; parentId?: string | null };

/** Returns "/slug" for regular pages and "/" for the home page */
function pageToHref(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}

/** Returns the slug for a given href, or null if it doesn't match any page */
function hrefToSlug(href: string, pages: PageLite[]): string | null {
  if (href === "/" || href === "") return pages.some((p) => p.slug === "home") ? "home" : null;
  const match = href.match(/^\/([^/]+)\/?$/);
  if (!match) return null;
  const slug = match[1];
  return pages.some((p) => p.slug === slug) ? slug : null;
}

function buildLabel(page: PageLite): string {
  const href = pageToHref(page.slug);
  const display = page.slug === "home" ? "Home" : page.slug;
  return `${display}  (${href})`;
}

/**
 * Href input with an optional page picker dropdown.
 * When `pages` is provided, shows a two-mode UI:
 *   • Page mode   — dropdown of known pages
 *   • Custom mode — plain text input (for external URLs, anchors, etc.)
 * Falls back to a plain HrefInput when no pages are provided.
 */
export function PageHrefInput({
  hrefValue,
  noLink = false,
  onHrefChange,
  onNoLinkChange,
  pages,
  placeholder,
}: {
  hrefValue: string;
  noLink?: boolean;
  onHrefChange: (v: string) => void;
  onNoLinkChange: (v: boolean) => void;
  pages?: PageLite[];
  placeholder?: string;
}) {
  const hasPages = pages && pages.length > 0;
  const matchedSlug = hasPages ? hrefToSlug(hrefValue, pages) : null;
  const [custom, setCustom] = useState(!matchedSlug && !!hrefValue);

  const isCustom = custom || !hasPages;

  function handleSelectPage(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "__custom__") {
      setCustom(true);
      return;
    }
    setCustom(false);
    onHrefChange(pageToHref(val));
  }

  function switchToCustom() {
    setCustom(true);
  }

  function switchToPage() {
    setCustom(false);
    // If current value matches a page, keep it; otherwise clear
    if (!hrefToSlug(hrefValue, pages ?? [])) {
      onHrefChange("");
    }
  }

  return (
    <div className="flex gap-1">
      <div className={`flex-1 min-w-0 ${noLink ? "opacity-40 pointer-events-none" : ""}`}>
        {isCustom ? (
          <div className="flex gap-1">
            <div className="flex-1 min-w-0">
              <InspectorInput
                value={hrefValue}
                onChange={onHrefChange}
                placeholder={noLink ? "(non-link)" : (placeholder ?? "Href")}
              />
            </div>
            {hasPages && (
              <button
                type="button"
                onClick={switchToPage}
                title="Switch to page picker"
                className="shrink-0 pt-1.5 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-1">
            <div className="relative flex-1 min-w-0">
              <select
                value={matchedSlug ?? "__custom__"}
                onChange={handleSelectPage}
                className="w-full h-7 rounded-md border border-input bg-background px-2 pr-6 text-xs text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-ring truncate"
              >
                {(pages ?? []).map((p) => (
                  <option key={p.id} value={p.slug}>
                    {buildLabel(p)}
                  </option>
                ))}
                <option value="__custom__">Custom URL…</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
            <button
              type="button"
              onClick={switchToCustom}
              title="Enter custom URL"
              className="shrink-0 pt-1.5 text-muted-foreground hover:text-foreground"
            >
              <Globe className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* no-link toggle */}
      <button
        type="button"
        onClick={() => onNoLinkChange(!noLink)}
        className={[
          "shrink-0 pt-1.5",
          noLink ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
        ].join(" ")}
        title={noLink ? "Make clickable link" : "Make non-clickable (label only)"}
      >
        {noLink ? <Link2Off className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      </button>
    </div>
  );
}
