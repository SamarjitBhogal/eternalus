import type { ReactElement } from 'react';

import { ResourceBar } from './ResourceBar';

/**
 * The aether bar (13 §3's HUD table; Figma 65:632 + "4700" 65:643): `ResourceBar` for `aether`,
 * so a `SegmentedBar` with its value numeral, "—" while unknown, and no shield overlay.
 */
export function AetherBar({
  className,
}: {
  readonly className?: string | undefined;
}): ReactElement {
  return <ResourceBar resource="aether" className={className} />;
}
