import type { CSSProperties } from 'react';

/**
 * Inline CSS custom properties for values computed at runtime (13 §7): bar fills, sweeps, mask
 * URLs, content-supplied colour tokens. React's `CSSProperties` has no `--*` keys; this types them
 * without an assertion: `style={cssVars({ '--segmented-bar-fill': '42%' })}`.
 */
export function cssVars(vars: Readonly<Record<`--${string}`, string>>): CSSProperties {
  return vars;
}
