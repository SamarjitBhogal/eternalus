import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { hudSlice } from '../../bridge/slices/hudSlice';
import { STRINGS } from '../strings';
import { SegmentedBar } from './SegmentedBar';

/**
 * The ultimate charge bar (Figma 65:722): the ultimate slot's `charge` on the cream segmented
 * bar. A leaf of its own, so a publish that changes the charge re-renders only it.
 */
export function UltimateChargeBar({
  className,
}: {
  readonly className?: string | undefined;
}): ReactElement {
  const charge = useAppSelector(hudSlice.selectors.selectUltimateCharge);
  return (
    <SegmentedBar
      label={STRINGS.hud.ultimateCharge}
      fraction={charge}
      tone="cream"
      size="ultimate"
      className={className}
    />
  );
}
