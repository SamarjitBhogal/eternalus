import type { ReactElement } from 'react';

import { STRINGS } from '../strings';
import styles from './Countdown.module.css';

/**
 * The character-select countdown (62:135, 58:281): whole seconds left, the Figma's static look at
 * every value (no urgency state, I-60). A `timer`, so assistive technology reads it on demand and
 * never announces each tick. The session owns the time; this only shows it.
 */
export function Countdown({
  remainingSeconds,
}: {
  readonly remainingSeconds: number;
}): ReactElement {
  return (
    <p
      className={styles.countdown}
      role="timer"
      aria-label={STRINGS.characterSelect.countdownLabel}
    >
      {remainingSeconds}
    </p>
  );
}
