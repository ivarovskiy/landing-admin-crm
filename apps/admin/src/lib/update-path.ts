/**
 * Immutable nested object update helper.
 *
 * Replaces deep spread chains like:
 *   onChange({ ...value, mobile: { ...mobile, menu: setAt(menu, idx, { ...m, label: v }) } })
 *
 * With:
 *   onChange(updatePath(value, ['mobile', 'menu', idx, 'label'], v))
 */
export function updatePath<T = any>(
  obj: T,
  path: (string | number)[],
  value: unknown,
): T {
  if (path.length === 0) return value as T;

  const [head, ...rest] = path;
  const source: any = obj ?? (typeof head === "number" ? [] : {});

  if (typeof head === "number") {
    const arr = Array.isArray(source) ? source.slice() : [];
    arr[head] = updatePath(arr[head], rest, value);
    return arr as T;
  }

  return {
    ...source,
    [head]: updatePath(source[head], rest, value),
  } as T;
}
