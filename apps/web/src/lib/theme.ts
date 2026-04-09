type Tokens = any;

export function tokensToCssVars(tokens: Tokens): Record<string, string> {
  const vars: Record<string, string> = {};

  const colors = tokens?.colors ?? {};
  const radius = tokens?.radius ?? {};
  const typography = tokens?.typography ?? {};

  // colors
  if (colors.bg) vars["--color-bg"] = colors.bg;
  if (colors.fg) vars["--color-fg"] = colors.fg;
  if (colors.primary) vars["--color-primary"] = colors.primary;
  if (colors.secondary) vars["--color-secondary"] = colors.secondary;
  if (colors.muted) vars["--color-muted"] = colors.muted;
  if (colors.card) vars["--color-card"] = colors.card;
  if (colors.line) vars["--color-line"] = colors.line;

  // radius
  if (radius.sm) vars["--radius-sm"] = radius.sm;
  if (radius.md) vars["--radius-md"] = radius.md;
  if (radius.lg) vars["--radius-lg"] = radius.lg;

  // typography
  if (typography.fontSans) vars["--font-sans"] = typography.fontSans;
  if (typography.fontDisplay) vars["--font-display"] = typography.fontDisplay;

  return vars;
}