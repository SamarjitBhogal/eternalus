import type { ReactElement } from 'react';

import { classNames } from './classNames';
import styles from './LockGlyph.module.css';

/**
 * A padlock, drawn in code (no third-party glyph) in the text colour around it (`currentColor`):
 * the non-colour cue of a locked class or Legend (CD-05, 13 §7). Decorative; the caller's text
 * ("Locked") carries the meaning.
 */
export function LockGlyph({
  className,
}: {
  readonly className?: string | undefined;
}): ReactElement {
  return (
    <svg
      className={classNames(styles.glyph, className)}
      viewBox="0 0 16 20"
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.shackle} d="M 4 9 V 6 A 4 4 0 0 1 12 6 V 9" />
      <rect className={styles.body} x="1" y="9" width="14" height="11" rx="2" />
    </svg>
  );
}
