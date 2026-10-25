import type { KeyboardEvent, ReactElement } from 'react';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { LegendSelectCard } from './LegendSelectCard';
import { LegendSelectCardHalo } from './LegendSelectCardHalo';
import styles from './LegendSelectCardRow.module.css';
import { legendSlot } from './legendSelectLayout';

/**
 * The Legend cards of the Legend step (55:270), one radio group in content order labelled by the
 * step heading; each card in its slot (`legendSlot`), the picked one enlarged in place. Beneath
 * them the live halo (61:3) while no row plate is drawn: with `isRowPlateShown` the plate holds
 * the halo and the picked card's art, so the halo is dropped and the picked card draws only its
 * text, focus ring and hit area (CD-16). The row plate itself is the step's (Figma's layer
 * order, reference 15 §2).
 */
export function LegendSelectCardRow({
  labelledBy,
  legends,
  tabbableIndex,
  isRowPlateShown,
  onPick,
  onPreview,
  onCardKeyDown,
}: {
  /** Id of the step heading that names the group. */
  readonly labelledBy: string;
  readonly legends: readonly LegendCardView[];
  readonly tabbableIndex: number;
  readonly isRowPlateShown: boolean;
  readonly onPick: (legend: LegendCardView) => void;
  /** A card's preview starts (its spec id) or ends (`null`). */
  readonly onPreview: (specId: string | null) => void;
  readonly onCardKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
}): ReactElement {
  return (
    <div className={styles.row} data-count={legends.length}>
      {!isRowPlateShown && <LegendSelectCardHalo legends={legends} />}
      <div className={styles.cards} role="radiogroup" aria-labelledby={labelledBy}>
        {legends.map((legend, index) => (
          <LegendSelectCard
            key={legend.specId}
            legend={legend}
            slot={legendSlot(legends.length, index)}
            isRowPlateMode={isRowPlateShown && legend.isPicked}
            isTabbable={index === tabbableIndex}
            onPick={() => {
              onPick(legend);
            }}
            onPreview={(isPreviewing) => {
              onPreview(isPreviewing ? legend.specId : null);
            }}
            onKeyDown={(event) => {
              onCardKeyDown(event, index);
            }}
          />
        ))}
      </div>
    </div>
  );
}
