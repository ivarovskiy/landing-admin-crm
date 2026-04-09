/* ================================================================
   Editable Element Schema
   ================================================================
   Universal element model for the constrained visual editor.
   Block data is converted to/from this schema via adapters.
   ================================================================ */

// ── Responsive helpers ──────────────────────────────────────────

export type ResponsiveValue<T> = {
  base?: T;
  md?: T;
  lg?: T;
};

export type ResponsiveVisibility = {
  hide?: {
    base?: boolean;
    md?: boolean;
    lg?: boolean;
  };
};

// ── Typography ──────────────────────────────────────────────────

export type TypographyStyle = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textAlign?: "left" | "center" | "right";
};

// ── Colors ──────────────────────────────────────────────────────

export type ColorStyle = {
  text?: string;
  fill?: string;
  stroke?: string;
  shadow?: string;
  background?: string;
  border?: string;
};

// ── Decoration ──────────────────────────────────────────────────

export type DecorationStyle = {
  titleVariant?: string;
  pillVariant?: string;
  radius?: string;
  borderWidth?: string;
  shadowOffsetX?: string;
  shadowOffsetY?: string;
};

// ── Combined style ──────────────────────────────────────────────

export type ElementStyle = {
  typography?: TypographyStyle;
  color?: ColorStyle;
  decoration?: DecorationStyle;
};

// ── Layout ──────────────────────────────────────────────────────

export type ElementLayout = {
  area?: "top" | "left" | "center" | "right" | "bottom";
  justify?: "start" | "center" | "end";
  align?: "start" | "center" | "end";
  width?: "auto" | "xs" | "sm" | "md" | "lg" | "full";
  order?: ResponsiveValue<number>;
  offset?: {
    base?: { x?: number; y?: number };
    md?: { x?: number; y?: number };
    lg?: { x?: number; y?: number };
  };
};

// ── Content types ───────────────────────────────────────────────

export type TextContent = {
  text?: string;
};

export type ImageContent = {
  src?: string;
  alt?: string;
  href?: string;
};

export type ButtonContent = {
  label?: string;
  href?: string;
};

export type LogoContent = {
  kind?: "asset" | "url";
  name?: string;
  src?: string;
  alt?: string;
};

// ── Editable element (discriminated union) ──────────────────────

export type EditableElement =
  | {
      id: string;
      type: "text";
      slot?: string;
      label?: string;
      content: TextContent;
      style?: ElementStyle;
      layout?: ElementLayout;
      visibility?: ResponsiveVisibility;
    }
  | {
      id: string;
      type: "image";
      slot?: string;
      label?: string;
      content: ImageContent;
      style?: ElementStyle;
      layout?: ElementLayout;
      visibility?: ResponsiveVisibility;
    }
  | {
      id: string;
      type: "button";
      slot?: string;
      label?: string;
      content: ButtonContent;
      style?: ElementStyle;
      layout?: ElementLayout;
      visibility?: ResponsiveVisibility;
    }
  | {
      id: string;
      type: "logo";
      slot?: string;
      label?: string;
      content: LogoContent;
      style?: ElementStyle;
      layout?: ElementLayout;
      visibility?: ResponsiveVisibility;
    };

// ── Adapter interface ───────────────────────────────────────────

export type BlockEditorAdapter = {
  /** Convert legacy block data → editable elements */
  toEditableElements(data: any): EditableElement[];
  /** Apply edited elements back into legacy block data */
  applyEditableElements(data: any, elements: EditableElement[]): any;
};

// ── Visual editor definition (registry entry) ───────────────────

export type BlockVisualEditorDefinition = {
  key: string;
  adapter: BlockEditorAdapter;
};
