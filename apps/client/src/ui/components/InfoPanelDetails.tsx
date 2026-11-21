import type { ReactElement } from 'react';

import type { DetailRow, DetailSlot } from '../../bridge/catalogue.types';
import { STRINGS } from '../strings';
import { AssetImage } from './AssetImage';
import { INFO_PANEL_ICON_RENDITIONS, INFO_PANEL_ROW_COUNT } from './InfoPanelDetails.constants';
import type { InfoPanelLayout } from './InfoPanel.types';
import styles from './InfoPanelDetails.module.css';
import { InfoPanelRules } from './InfoPanelRules';

/** Row labels by slot (View Details); `undefined` draws none. */
type RowLabels = Readonly<Record<DetailSlot, string>> | undefined;

/**
 * One detail slot: its icon (or the placeholder box), its label when `labels` has one, and its
 * name (or the missing-name dash).
 */
function detailRow(
  row: DetailRow | undefined,
  index: number,
  layout: InfoPanelLayout,
  labels: RowLabels,
): ReactElement {
  const iconAssetId = row?.iconAssetId ?? null;
  const label = row === undefined ? undefined : labels?.[row.slot];
  return (
    <li key={index} data-row={index}>
      {iconAssetId === null ? (
        <span className={styles.placeholder} aria-hidden="true" />
      ) : (
        <AssetImage
          assetId={iconAssetId}
          rendition={INFO_PANEL_ICON_RENDITIONS[layout]}
          className={styles.icon}
        />
      )}
      {label !== undefined && <span className={styles.label}>{label}</span>}
      <span className={styles.name}>{row?.displayName ?? STRINGS.characterSelect.missingName}</span>
    </li>
  );
}

/**
 * The details half of an `InfoPanel` (72:751, 62:83, 56:36): the header box and text, the rules
 * (`InfoPanelRules`) and the layout's icon-and-name rows (`INFO_PANEL_ROW_COUNT`: the Figma's
 * three, or the Legend's four, DEC-65), positioned in the enclosing panel's px by `layout`.
 * Extra rows are not shown, a missing row or icon shows the placeholder box, a missing name a
 * dash (CD-13). View Details (DEC-103) has no header (`null`) and labels each row (`rowLabels`).
 */
export function InfoPanelDetails({
  layout,
  header,
  rows,
  rowLabels,
}: {
  readonly layout: InfoPanelLayout;
  readonly header: string | null;
  readonly rows: readonly DetailRow[];
  readonly rowLabels?: RowLabels;
}): ReactElement {
  return (
    <div className={styles.details} data-layout={layout}>
      {header !== null && (
        <>
          <span className={styles.headerBox} aria-hidden="true" />
          <h4 className={styles.headerText}>{header}</h4>
        </>
      )}
      <InfoPanelRules layout={layout} hasHeader={header !== null} />
      <ul className={styles.rows}>
        {Array.from({ length: INFO_PANEL_ROW_COUNT[layout] }, (_, index) =>
          detailRow(rows[index], index, layout, rowLabels),
        )}
      </ul>
    </div>
  );
}
