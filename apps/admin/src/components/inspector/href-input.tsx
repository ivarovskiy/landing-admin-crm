"use client";

import { Link2, Link2Off } from "lucide-react";
import { InspectorInput } from "./section";

/**
 * Href input with built-in "no-link" toggle.
 *
 * Renders an href text field plus a small icon button that flips a separate
 * `noLink` flag. When `noLink` is on, the href field is dimmed/disabled visually
 * — the corresponding renderer should treat the item as a plain non-clickable
 * label (rendered as <span> instead of <a>).
 */
export function HrefInput({
  hrefValue,
  noLink = false,
  onHrefChange,
  onNoLinkChange,
  placeholder,
}: {
  hrefValue: string;
  noLink?: boolean;
  onHrefChange: (v: string) => void;
  onNoLinkChange: (v: boolean) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-1">
      <div className={`flex-1 ${noLink ? "opacity-40 pointer-events-none" : ""}`}>
        <InspectorInput
          value={hrefValue}
          onChange={onHrefChange}
          placeholder={noLink ? "(non-link)" : (placeholder ?? "Href")}
        />
      </div>
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
