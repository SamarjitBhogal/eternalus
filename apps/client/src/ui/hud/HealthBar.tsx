import type { ReactElement } from 'react';

import { ResourceBar } from './ResourceBar';

/**
 * The health bar (13 §3's HUD table; Figma 62:289 + "1850" 65:642): `ResourceBar` for `health`,
 * so a `SegmentedBar` with its value numeral, "—" while unknown, and no shield overlay.
 */
export function HealthBar({
  className,
}: {
  readonly className?: string | undefined;
}): ReactElement {
  return <ResourceBar resource="health" className={className} />;
}
