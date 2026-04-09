import type {
  EditableElement,
  ElementStyle,
  ElementLayout,
  TypographyStyle,
  ColorStyle,
  DecorationStyle,
  ResponsiveVisibility,
} from "./types";

/* ================================================================
   Safe defaults
   ================================================================ */

export const DEFAULT_TYPOGRAPHY: TypographyStyle = {
  fontFamily: undefined,
  fontSize: undefined,
  fontWeight: undefined,
  lineHeight: undefined,
  letterSpacing: undefined,
  textTransform: undefined,
  textAlign: undefined,
};

export const DEFAULT_COLOR: ColorStyle = {
  text: undefined,
  fill: undefined,
  stroke: undefined,
  shadow: undefined,
  background: undefined,
  border: undefined,
};

export const DEFAULT_DECORATION: DecorationStyle = {
  titleVariant: undefined,
  pillVariant: undefined,
  radius: undefined,
  borderWidth: undefined,
  shadowOffsetX: undefined,
  shadowOffsetY: undefined,
};

export const DEFAULT_LAYOUT: ElementLayout = {
  area: undefined,
  justify: undefined,
  align: undefined,
  width: undefined,
};

export const DEFAULT_VISIBILITY: ResponsiveVisibility = {
  hide: { base: false, md: false, lg: false },
};

/* ================================================================
   Merge helpers — shallow merge, undefined values are skipped
   ================================================================ */

function mergeShallow<T extends Record<string, any>>(
  base: T | undefined,
  patch: Partial<T> | undefined,
): T | undefined {
  if (!patch) return base;
  if (!base) return patch as T;
  const result = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) (result as any)[k] = v;
  }
  return result;
}

export function mergeTypography(
  base?: TypographyStyle,
  patch?: Partial<TypographyStyle>,
): TypographyStyle | undefined {
  return mergeShallow(base, patch);
}

export function mergeColor(
  base?: ColorStyle,
  patch?: Partial<ColorStyle>,
): ColorStyle | undefined {
  return mergeShallow(base, patch);
}

export function mergeDecoration(
  base?: DecorationStyle,
  patch?: Partial<DecorationStyle>,
): DecorationStyle | undefined {
  return mergeShallow(base, patch);
}

export function mergeElementStyle(
  base?: ElementStyle,
  patch?: Partial<ElementStyle>,
): ElementStyle | undefined {
  if (!patch) return base;
  return {
    typography: mergeTypography(base?.typography, patch.typography),
    color: mergeColor(base?.color, patch.color),
    decoration: mergeDecoration(base?.decoration, patch.decoration),
  };
}

export function mergeElementLayout(
  base?: ElementLayout,
  patch?: Partial<ElementLayout>,
): ElementLayout | undefined {
  return mergeShallow(base, patch);
}

/* ================================================================
   Normalization
   ================================================================ */

export function normalizeResponsiveVisibility(
  v: any,
): ResponsiveVisibility {
  if (!v || typeof v !== "object") return { hide: {} };
  const hide = v.hide ?? {};
  return {
    hide: {
      base: !!hide.base,
      md: !!hide.md,
      lg: !!hide.lg,
    },
  };
}

/** Ensure element has all required fields with safe defaults */
export function normalizeEditableElement(
  el: EditableElement,
): EditableElement {
  return {
    ...el,
    style: el.style ?? {},
    layout: el.layout ?? {},
    visibility: normalizeResponsiveVisibility(el.visibility),
  } as EditableElement;
}

/* ================================================================
   Element finders
   ================================================================ */

/** Find element by id */
export function findElement(
  elements: EditableElement[],
  id: string,
): EditableElement | undefined {
  return elements.find((el) => el.id === id);
}

/** Update a single element in the list by id */
export function updateElement(
  elements: EditableElement[],
  id: string,
  patch: Partial<EditableElement>,
): EditableElement[] {
  return elements.map((el) =>
    el.id === id ? ({ ...el, ...patch } as EditableElement) : el,
  );
}

/* ================================================================
   Clean helpers — strip undefined values for deterministic output
   ================================================================ */

export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result = {} as any;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v;
  }
  return result;
}
