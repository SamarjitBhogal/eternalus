import type { ReactElement } from 'react';

import type { KitCost, KitRow } from '../../bridge/catalogue.types';
import { STRINGS } from '../strings';
import { KeyGlyph } from './KeyGlyph';
import styles from './InfoPanelKit.module.css';

const { kit: text } = STRINGS.characterSelect;

/** A cost as text: an aether cost by its amount, a charge-based ultimate as a meter. */
const costText = (cost: KitCost): string =>
  cost.kind === 'aether' ? text.aetherCost(cost.amount) : text.chargeCost;

/** The cost and cooldown parts of a kit row's line, or the not-available note. */
function facts(row: KitRow): readonly string[] {
  if (!row.isAvailable) return [text.unavailable];
  const cost = costText(row.cost);
  return row.cooldownSeconds === null ? [cost] : [cost, text.cooldown(row.cooldownSeconds)];
}

/**
 * The text of one kit ability under its name (DEC-199): the key it is bound to, its cost and its
 * cooldown on one line, then its description where the layout has room for it (`hasDescription`:
 * View Details; the Legend panel's rows are too short). A charge-based ultimate shows the meter instead of an
 * aether cost; an ability that is not built yet shows "Not yet available" and the dimmed look. The
 * enclosing row places it (`--meta-dy`, `--text-dy`, `--text-x`, `--text-w`).
 */
export function InfoPanelKit({
  row,
  hasDescription,
}: {
  readonly row: KitRow;
  readonly hasDescription: boolean;
}): ReactElement {
  return (
    <>
      <p className={styles.meta} data-available={row.isAvailable}>
        <KeyGlyph action={row.slot} appearance="bare" />
        {facts(row).map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </p>
      {hasDescription && (
        <p className={styles.description} data-available={row.isAvailable}>
          {row.description}
        </p>
      )}
    </>
  );
}
