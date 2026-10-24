import type { ReactElement } from 'react';

import { cssVars } from '../components/cssVars';
import { classNames, meterAttributes, percentOf } from './hudMeter';
import styles from './StatusBar.module.css';

/**
 * The thin structure / capture bar (HUD spec §3.1, §3.3): a left-aligned fill under a 1 px
 * inside-stroked track; `null` is the no-data hatch. The caller's class sizes it (46 × 6 under a
 * structure, 62 × 6 under an objective). A meter, or an image "No data yet" (I-87).
 */
export function StatusBar({
  label,
  fraction,
  className,
}: {
  readonly label: string;
  /** 0..1; `null` while the value is unknown. */
  readonly fraction: number | null;
  readonly className?: string | undefined;
}): ReactElement {
  return (
    <div
      className={classNames(styles.bar, fraction === null && styles.noData, className)}
      style={
        fraction === null
          ? undefined
          : cssVars({ '--status-bar-fill': `${String(fraction * 100)}%` })
      }
      {...meterAttributes(label, fraction === null ? null : { now: percentOf(fraction), max: 100 })}
    />
  );
}
