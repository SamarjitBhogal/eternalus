import type { ReactElement } from 'react';

import styles from './Countdown.module.css';

/**
 * A session countdown on the selection artboard (62:135, 58:281): whole seconds left, the Figma's
 * static look at every value (no urgency state, HC-S1). A `timer` named by `label`, so assistive
 * technology reads it on demand and never announces each tick. The session owns the time; this
 * only shows it.
 */
export function Countdown({
  remainingSeconds,
  label,
}: {
  readonly remainingSeconds: number;
  /** What the time is for (the character select's, the win/lose screen's). */
  readonly label: string;
}): ReactElement {
  return (
    <p className={styles.countdown} role="timer" aria-label={label}>
      {remainingSeconds}
    </p>
  );
}
