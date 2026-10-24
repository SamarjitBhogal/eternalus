import type { ReactElement } from 'react';

import type { DetailRow } from '../../bridge/catalogue.types';
import { STRINGS } from '../strings';
import { AssetImage } from './AssetImage';
import { INFO_PANEL_ICON_RENDITIONS, INFO_PANEL_ROW_COUNT } from './InfoPanel.constants';
import type { InfoPanelLayout } from './InfoPanel.types';
import styles from './InfoPanelDetails.module.css';

/** The rules of a panel (header line, three accents, two dividers): SVG rects, never snapped (CSUI E3). */
const RULES = [
  { rule: 'header-line', className: styles.rule },
  { rule: 'accent-0', className: styles.accent },
  { rule: 'accent-1', className: styles.accent },
  { rule: 'accent-2', className: styles.accent },
  { rule: 'divider-0', className: styles.rule },
  { rule: 'divider-1', className: styles.rule },
] as const;

/** One detail slot: its icon (or the placeholder box) and its name (or the missing-name dash). */
function detailRow(
  row: DetailRow | undefined,
  index: number,
  layout: InfoPanelLayout,
): ReactElement {
  const iconAssetId = row?.iconAssetId ?? null;
  return (
    <li key={index} className={styles.row} data-row={index}>
      {iconAssetId === null ? (
        <span className={styles.placeholder} aria-hidden="true" />
      ) : (
        <AssetImage
          assetId={iconAssetId}
          rendition={INFO_PANEL_ICON_RENDITIONS[layout]}
          className={styles.icon}
        />
      )}
      <span className={styles.name}>{row?.displayName ?? STRINGS.characterSelect.missingName}</span>
    </li>
  );
}

/**
 * The details half of an `InfoPanel` (72:751, 62:83, 56:36): the header box and text, the rules
 * and three icon-and-name rows, positioned in the enclosing panel's px by `layout`. Exactly three
 * slots (the Figma's): extra rows are not shown, a missing row or icon shows the placeholder box,
 * a missing name a dash (CD-13).
 */
export function InfoPanelDetails({
  layout,
  header,
  rows,
}: {
  readonly layout: InfoPanelLayout;
  readonly header: string;
  readonly rows: readonly DetailRow[];
}): ReactElement {
  return (
    <div className={styles.details} data-layout={layout}>
      <span className={styles.headerBox} aria-hidden="true" />
      <h4 className={styles.headerText}>{header}</h4>
      <svg className={styles.rules} aria-hidden="true" focusable="false">
        {RULES.map(({ rule, className }) => (
          <rect key={rule} className={className} data-rule={rule} />
        ))}
      </svg>
      <ul className={styles.rows}>
        {Array.from({ length: INFO_PANEL_ROW_COUNT }, (_, index) =>
          detailRow(rows[index], index, layout),
        )}
      </ul>
    </div>
  );
}
