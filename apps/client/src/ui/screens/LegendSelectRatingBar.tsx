import { useId, type ReactElement } from 'react';

import { STRINGS } from '../strings';
import styles from './LegendSelectRatingBar.module.css';

/** The meter's scale: a rating of 0..1 is announced as 0..100. */
const METER_MAX = 100;

/**
 * One role-rating bar of the Legend step (58:323): the axis label over an outlined track whose
 * fill spans `value` of the track's inner travel. A rated Legend's bar is a `meter`; an unrated
 * one (`null`) shows the empty track and is an image named "<label>: No data yet" with no value
 * attributes (CD-13). Placed by its parent; one row is 401 × 38.
 */
export function LegendSelectRatingBar({
  label,
  value,
}: {
  readonly label: string;
  /** 0..1; `null` while the Legend has no rating. */
  readonly value: number | null;
}): ReactElement {
  const labelId = useId();
  if (value === null) {
    return (
      <div
        className={styles.bar}
        role="img"
        aria-label={`${label}: ${STRINGS.characterSelect.noRating}`}
      >
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
        <span className={styles.track} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div
      className={styles.bar}
      role="meter"
      aria-labelledby={labelId}
      aria-valuemin={0}
      aria-valuemax={METER_MAX}
      aria-valuenow={Math.round(value * METER_MAX)}
    >
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.travel}>
          <span className={styles.fill} style={{ width: `${String(value * 100)}%` }} />
        </span>
      </span>
    </div>
  );
}
