import { type ReactElement, type ReactNode, useId } from 'react';

import styles from './Panel.module.css';

/** A titled surface; the title names the region for assistive technology. */
export function Panel({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  const titleId = useId();
  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  );
}
