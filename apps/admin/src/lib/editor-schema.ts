export type Breakpoint = "base" | "md" | "lg";

export type ResponsiveValue<T> = {
  base?: T;
  md?: T;
  lg?: T;
};

export type ElementType = "text" | "image" | "button" | "logo" | "group";

export type LayoutArea = "top" | "bottom" | "left" | "center" | "right";
export type AlignValue = "start" | "center" | "end";
export type WidthPreset = "auto" | "sm" | "md" | "lg" | "full";

export interface ResponsiveVisibility {
  base?: boolean;
  md?: boolean;
  lg?: boolean;
}

export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: string;
  weight?: number;
  letterSpacing?: string;
  lineHeight?: string;
  textTransform?: "none" | "uppercase";
  textAlign?: "left" | "center" | "right";
}

export interface ColorStyle {
  text?: string;
  fill?: string;
  stroke?: string;
  shadow?: string;
  background?: string;
}

export interface DecorationStyle {
  titleVariant?: "plain" | "outline" | "outline-stamp";
  pillVariant?: "flat" | "stamp";
  borderRadius?: string;
}

export interface SpacingStyle {
  padding?: string;
  margin?: string;
  gap?: string;
}

export interface ElementStyle {
  typography?: TypographyStyle;
  color?: ColorStyle;
  decoration?: DecorationStyle;
  spacing?: SpacingStyle;
}

export interface ElementLayout {
  area?: LayoutArea;
  justify?: AlignValue;
  align?: AlignValue;
  width?: WidthPreset;
  order?: ResponsiveValue<number>;
  offset?: ResponsiveValue<{
    x?: number;
    y?: number;
  }>;
}

export interface ElementNode {
  id: string;
  type: ElementType;
  name?: string;
  slot?: string;
  content?: Record<string, unknown>;
  style?: ElementStyle;
  visibility?: ResponsiveVisibility;
  layout?: ElementLayout;
  children?: ElementNode[];
}

export interface BlockNode {
  id?: string;
  type: string;
  variant: string;
  layout?: Record<string, unknown>;
  elements: ElementNode[];
  meta?: Record<string, unknown>;
}

function makeId(prefix = "el") {
  const random =
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${prefix}-${random}`;
}

export function createElement(
  type: ElementType,
  partial: Partial<ElementNode> = {}
): ElementNode {
  return {
    id: partial.id ?? makeId(type),
    type,
    name: partial.name,
    slot: partial.slot,
    content: partial.content ?? {},
    style: partial.style ?? {},
    visibility: partial.visibility ?? { base: true, md: true, lg: true },
    layout: partial.layout ?? {},
    children: partial.children ?? [],
  };
}

export function createTextElement(
  text = "",
  partial: Partial<ElementNode> = {}
): ElementNode {
  return createElement("text", {
    ...partial,
    content: { text, ...(partial.content ?? {}) },
  });
}

export function createButtonElement(
  label = "",
  href = "#",
  partial: Partial<ElementNode> = {}
): ElementNode {
  return createElement("button", {
    ...partial,
    content: { label, href, ...(partial.content ?? {}) },
  });
}

export function ensureBlockNode(input: Partial<BlockNode>): BlockNode {
  return {
    id: input.id,
    type: input.type ?? "unknown",
    variant: input.variant ?? "v1",
    layout: input.layout ?? {},
    elements: Array.isArray(input.elements) ? input.elements : [],
    meta: input.meta ?? {},
  };
}

export function upsertElement(
  elements: ElementNode[],
  next: ElementNode
): ElementNode[] {
  const index = elements.findIndex((item) => item.id === next.id);
  if (index === -1) return [...elements, next];

  return elements.map((item, idx) => (idx === index ? next : item));
}

export function removeElement(
  elements: ElementNode[],
  elementId: string
): ElementNode[] {
  return elements.filter((item) => item.id !== elementId);
}

export function findElement(
  elements: ElementNode[],
  elementId: string
): ElementNode | undefined {
  return elements.find((item) => item.id === elementId);
}

export function reorderElements(
  elements: ElementNode[],
  fromIndex: number,
  toIndex: number
): ElementNode[] {
  const copy = [...elements];
  const [moved] = copy.splice(fromIndex, 1);

  if (!moved) return elements;

  copy.splice(toIndex, 0, moved);
  return copy;
}
