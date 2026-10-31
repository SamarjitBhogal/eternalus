import type { ReactElement } from 'react';

import { INFO_PANEL_ROW_COUNT } from './InfoPanelDetails.constants';
import type { InfoPanelLayout } from './InfoPanel.types';
import styles from './InfoPanelRules.module.css';

/**
 * A layout's rules: the header line (when the panel has a header), one accent per row, one divider
 * between two rows.
 */
function rulesOf(
  layout: InfoPanelLayout,
  hasHeader: boolean,
): readonly { readonly rule: string; readonly className: string | undefined }[] {
  const rowCount = INFO_PANEL_ROW_COUNT[layout];
  return [
    ...(hasHeader ? [{ rule: 'header-line', className: styles.rule }] : []),
    ...Array.from({ length: rowCount }, (_, row) => ({
      rule: `accent-${String(row)}`,
      className: styles.accent,
    })),
    ...Array.from({ length: rowCount - 1 }, (_, row) => ({
      rule: `divider-${String(row)}`,
      className: styles.rule,
    })),
  ];
}

/**
 * The rules of an `InfoPanelDetails` (72:751, 62:83, 56:36): the header line, an accent per row
 * and a divider between rows (three rows on the class layouts, four on the Legend's, DEC-65) in
 * one hidden svg at the enclosing panel's origin, each rect placed by `layout`. SVG rects, never
 * snapped. Without a header (View Details) there is no header line.
 */
export function InfoPanelRules({
  layout,
  hasHeader = true,
}: {
  readonly layout: InfoPanelLayout;
  readonly hasHeader?: boolean;
}): ReactElement {
  return (
    <svg className={styles.rules} data-layout={layout} aria-hidden="true" focusable="false">
      {rulesOf(layout, hasHeader).map(({ rule, className }) => (
        <rect key={rule} className={className} data-rule={rule} />
      ))}
    </svg>
  );
}
