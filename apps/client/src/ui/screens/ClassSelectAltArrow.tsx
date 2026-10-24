import type { ReactElement } from 'react';

import { STRINGS } from '../strings';
import styles from './ClassSelectAltArrow.module.css';

/** The two arrows of the alternate layout, at the hidden 62:115 "Arrows" positions (CD-10). */
type AltArrowDirection = 'previous' | 'next';

const LABELS: Readonly<Record<AltArrowDirection, string>> = {
  previous: STRINGS.characterSelect.previousClass,
  next: STRINGS.characterSelect.nextClass,
};

/** A chevron in a unit box, its point toward `next` (mirrored by CSS for `previous`). */
const CHEVRON_PATH = 'M 0.35 0.2 L 0.65 0.5 L 0.35 0.8';

/**
 * A previous / next class button of the alternate class layout (62:70 has no picker, CD-10): a
 * named button with an inline chevron drawn in code, placed by its direction beside the countdown.
 */
export function ClassSelectAltArrow({
  direction,
  onPress,
}: {
  readonly direction: AltArrowDirection;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className={styles.arrow}
      data-direction={direction}
      aria-label={LABELS[direction]}
      onClick={onPress}
    >
      <svg className={styles.chevron} viewBox="0 0 1 1" aria-hidden="true" focusable="false">
        <path d={CHEVRON_PATH} />
      </svg>
    </button>
  );
}
