import type { ReactElement } from 'react';

import { classNames } from '../components/classNames';
import { cssVars } from '../components/cssVars';
import { meterAttributes, percentOf } from './hudMeter';
import { HUD_BAR_TIERS } from './SegmentedBar.constants';
import styles from './SegmentedBar.module.css';
import { type SegmentFill, segmentedBarFills } from './segmentedBarFills';

/** Which colour set a bar draws with: the resource bars' reds and blues, or the HUD cream. */
type SegmentedBarTone = 'health' | 'aether' | 'cream';
/** Which Figma geometry: health/aether (145 × 20), ultimate charge (164.667 × 10), weapon (86 × 10). */
type SegmentedBarSize = 'resource' | 'ultimate' | 'weapon';

const TONE_CLASS: Readonly<Record<SegmentedBarTone, string | undefined>> = {
  health: styles.toneHealth,
  aether: styles.toneAether,
  cream: styles.toneCream,
};

const SIZE_CLASS: Readonly<Record<SegmentedBarSize, string | undefined>> = {
  resource: styles.resource,
  ultimate: styles.ultimate,
  weapon: styles.weapon,
};

const FILL_CLASS: Readonly<Record<SegmentFill['state'], string | undefined>> = {
  full: styles.full,
  leading: styles.leading,
  empty: styles.empty,
  'no-data': styles.noData,
};

/**
 * The HUD's three-segment bar (HUD spec §3.6, §3.8, §3.9): full segments flat, the segment holding
 * the value ramps up to it and draws the 1 % white marker, the rest is the dim track; `null` is
 * the no-data hatch (CD-13). A meter with the value as a percentage, or an image "No data yet"
 * (I-87). Values jump to each published value; nothing transitions (I-60).
 */
export function SegmentedBar({
  label,
  fraction,
  valueText,
  tone,
  size,
  className,
}: {
  readonly label: string;
  /** 0..1; `null` while the value is unknown. */
  readonly fraction: number | null;
  /** The spoken value, e.g. "1850 of 2220"; the percentage when absent. */
  readonly valueText?: string | undefined;
  readonly tone: SegmentedBarTone;
  readonly size: SegmentedBarSize;
  readonly className?: string | undefined;
}): ReactElement {
  const meter = fraction === null ? null : { now: percentOf(fraction), max: 100, text: valueText };
  return (
    <div
      className={classNames(styles.bar, TONE_CLASS[tone], SIZE_CLASS[size], className)}
      {...meterAttributes(label, meter)}
    >
      {segmentedBarFills(fraction, HUD_BAR_TIERS).map((fill, index) => (
        // The segments are a fixed row of three; the index is their identity.
        <div key={index} className={styles.segment} aria-hidden="true">
          <div
            className={classNames(styles.fill, FILL_CLASS[fill.state])}
            style={
              fill.state === 'leading'
                ? cssVars({ '--segmented-bar-fill': `${String(fill.percent)}%` })
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
