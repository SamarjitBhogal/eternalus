import type { ReactElement, ReactNode } from 'react';

import styles from './Button.module.css';

/** A themed button. Its text is its accessible name; `isDisabled` greys it and stops clicks. */
export function Button({
  children,
  onClick,
  autoFocus = false,
  isDisabled = false,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly autoFocus?: boolean;
  readonly isDisabled?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      autoFocus={autoFocus}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}
