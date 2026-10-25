import type { ReactElement } from 'react';

import type { InfoPanelLayout } from './InfoPanel.types';
import styles from './InfoPanelRules.module.css';

/** The rules of a panel (header line, three accents, two dividers): SVG rects, never snapped. */
const RULES = [
  { rule: 'header-line', className: styles.rule },
  { rule: 'accent-0', className: styles.accent },
  { rule: 'accent-1', className: styles.accent },
  { rule: 'accent-2', className: styles.accent },
  { rule: 'divider-0', className: styles.rule },
  { rule: 'divider-1', className: styles.rule },
] as const;

/**
 * The rules of an `InfoPanelDetails` (72:751, 62:83, 56:36): the header line, three accents and
 * two dividers in one hidden svg at the enclosing panel's origin, each rect placed by `layout`.
 */
export function InfoPanelRules({ layout }: { readonly layout: InfoPanelLayout }): ReactElement {
  return (
    <svg className={styles.rules} data-layout={layout} aria-hidden="true" focusable="false">
      {RULES.map(({ rule, className }) => (
        <rect key={rule} className={className} data-rule={rule} />
      ))}
    </svg>
  );
}
