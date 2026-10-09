import type { ReactElement, ReactNode } from 'react';

import styles from './Button.module.css';

/** A themed button. Its text is its accessible name. */
export function Button({
  children,
  onClick,
  autoFocus = false,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly autoFocus?: boolean;
}): ReactElement {
  return (
    <button type="button" className={styles.button} onClick={onClick} autoFocus={autoFocus}>
      {children}
    </button>
  );
}
