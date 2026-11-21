import { type ReactElement, type ReactNode, useState } from 'react';

import styles from './LiveRegion.module.css';
import { LiveRegionContext } from './useLiveRegion';

/**
 * The app's one polite live region (DEC-282 (7)), mounted with the app and outside the screen
 * switch, so it is in the page, empty, long before any screen draws a line. A component says a
 * line by portalling it into the region (`useLiveRegion`), so a screen reader meets the line as a
 * change to a region it already knows, also when the component appears holding it (the
 * match-start overlay at 10 s). It is visually hidden.
 */
export function LiveRegion({ children }: { readonly children: ReactNode }): ReactElement {
  const [region, setRegion] = useState<HTMLElement | null>(null);
  return (
    <LiveRegionContext value={region}>
      {children}
      <span ref={setRegion} className={styles.srOnly} aria-live="polite" />
    </LiveRegionContext>
  );
}
