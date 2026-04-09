import type { components } from "@acme/openapi-client";

// ─── Core block types (from OpenAPI schema) ───────────────────────────────────

export type AdminBlock = components["schemas"]["AdminBlockDto"];
export type AdminPage = components["schemas"]["AdminPageDto"];
export type AdminPageShort = components["schemas"]["AdminPageShortDto"];

// ─── Layout / visibility types ────────────────────────────────────────────────

export interface BlockHide {
  base?: boolean; // <md (mobile)
  md?: boolean;   // ≥md
  lg?: boolean;   // ≥lg
}

export interface BlockLayout {
  hide?: BlockHide;
  anchor?: string;
  container?: string;
  [key: string]: unknown;
}

export interface BlockData {
  _layout?: BlockLayout;
  [key: string]: unknown;
}
