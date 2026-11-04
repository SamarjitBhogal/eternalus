import type { CSSProperties } from 'react';

import type { RasterBox } from '../../bridge/catalogue.types';

/**
 * Inline CSS custom properties for values computed at runtime (13 §7): bar fills, sweeps, mask
 * URLs, content-supplied colour tokens. React's `CSSProperties` has no `--*` keys; this types them
 * without an assertion: `style={cssVars({ '--segmented-bar-fill': '42%' })}`.
 */
export function cssVars(vars: Readonly<Record<`--${string}`, string>>): CSSProperties {
  return vars;
}

/**
 * A manifest draw box (frame px) as the unitless `--<name>-left/-top/-width/-height` the module
 * CSS reads.
 */
export function boxVars(name: string, box: RasterBox): CSSProperties {
  return cssVars({
    [`--${name}-left`]: String(box.left),
    [`--${name}-top`]: String(box.top),
    [`--${name}-width`]: String(box.width),
    [`--${name}-height`]: String(box.height),
  });
}
