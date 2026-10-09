import type { ReactElement } from 'react';

import { Button } from './Button';
import styles from './MenuList.module.css';

/** One menu option. */
export type MenuItem = {
  readonly id: string;
  readonly label: string;
  readonly onSelect: () => void;
};

/**
 * A vertical list of menu buttons in a labelled `<nav>`. The first item takes focus, so Enter
 * activates it and Tab / Shift+Tab move through the rest.
 */
export function MenuList({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly MenuItem[];
}): ReactElement {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={item.id}>
            <Button onClick={item.onSelect} autoFocus={index === 0}>
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
