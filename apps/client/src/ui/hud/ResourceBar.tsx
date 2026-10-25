import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { hudSlice } from '../../bridge/slices/hudSlice';
import type { RootState } from '../../bridge/store';
import { classNames } from '../components/classNames';
import { STRINGS } from '../strings';
import { fractionOf } from './hudMeter';
import styles from './ResourceBar.module.css';
import { SegmentedBar } from './SegmentedBar';

/** The two resource bars of the HUD (62:284). */
type HudResource = 'health' | 'aether';

/** What each resource bar reads and how it draws (a registry, rule 12). */
const RESOURCES: Readonly<
  Record<
    HudResource,
    {
      readonly label: string;
      readonly tone: HudResource;
      readonly selectCurrent: (state: RootState) => number | null;
      readonly selectMax: (state: RootState) => number | null;
    }
  >
> = {
  health: {
    label: STRINGS.hud.health,
    tone: 'health',
    selectCurrent: hudSlice.selectors.selectHealth,
    selectMax: hudSlice.selectors.selectMaxHealth,
  },
  aether: {
    label: STRINGS.hud.aether,
    tone: 'aether',
    selectCurrent: hudSlice.selectors.selectAether,
    selectMax: hudSlice.selectors.selectMaxAether,
  },
};

/**
 * The health or aether bar (Figma 62:284): a `SegmentedBar` with the current value as a numeral
 * over its right end (Figma "1850" 65:642, "4700" 65:643), "—" while it is unknown. No shield
 * segments (13 §10). Reads its own two values (a leaf, so a publish re-renders only it).
 */
export function ResourceBar({
  resource,
  className,
}: {
  readonly resource: HudResource;
  readonly className?: string | undefined;
}): ReactElement {
  const { label, tone, selectCurrent, selectMax } = RESOURCES[resource];
  const current = useAppSelector(selectCurrent);
  const max = useAppSelector(selectMax);
  const fraction = fractionOf(current, max);
  return (
    <div className={classNames(styles.resource, className)}>
      <SegmentedBar
        label={label}
        fraction={fraction}
        valueText={
          current === null || max === null
            ? undefined
            : STRINGS.hud.meterValue(Math.round(current), max)
        }
        tone={tone}
        size="resource"
      />
      <span className={styles.value} aria-hidden="true">
        {current === null ? STRINGS.hud.noData : String(Math.round(current))}
      </span>
    </div>
  );
}
