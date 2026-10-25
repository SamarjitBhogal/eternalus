import type { KeyboardEvent, ReactElement } from 'react';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { LegendClassId } from '../../bridge/domain.types';
import { ClassSelectCard } from './ClassSelectCard';
import { ClassSelectCardHalo } from './ClassSelectCardHalo';
import styles from './ClassSelectCardRow.module.css';
import { classSlot } from './classSelectLayout';
import type { RowPlate } from './selectionGeometry.types';

/**
 * The class cards of the class step (62:146), the top-most layer of 62:125: its root is lifted
 * above every other element of the step and the shell by its module's `z-index: 1` (Figma's
 * layer order, reference 15 §2). Inside it, bottom to top: the picked class's row plate while it
 * is drawn (CD-16: Figma's own halo, its three holes left empty so the text beneath shows), else
 * the live halo; then one radio group in content order, labelled by the step heading. Only the
 * cards take pointer events.
 */
export function ClassSelectCardRow({
  labelledBy,
  describedBy,
  cards,
  allyCounts,
  pickedClassId,
  previewClassId,
  tabbableIndex,
  autoFocusClassId,
  rowPlate,
  onPick,
  onPreview,
  onCardKeyDown,
}: {
  /** Id of the step heading that names the group. */
  readonly labelledBy: string;
  /** Id of the panel that describes the shown class. */
  readonly describedBy: string;
  readonly cards: readonly LegendClassCard[];
  readonly allyCounts: Readonly<Record<LegendClassId, number>>;
  readonly pickedClassId: LegendClassId | null;
  readonly previewClassId: LegendClassId | null;
  readonly tabbableIndex: number;
  /** The card that takes the focus on mount (Back), or `null`. */
  readonly autoFocusClassId: LegendClassId | null;
  readonly rowPlate: RowPlate | null;
  readonly onPick: (classId: LegendClassId) => void;
  /** A card's preview starts (its class id) or ends (`null`). */
  readonly onPreview: (classId: LegendClassId | null) => void;
  readonly onCardKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
}): ReactElement {
  return (
    <div className={styles.row} data-count={cards.length}>
      {rowPlate === null ? (
        <ClassSelectCardHalo cards={cards} pickedClassId={pickedClassId} />
      ) : (
        <img
          className={styles.rowPlate}
          src={rowPlate.url}
          style={rowPlate.box}
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
        />
      )}
      <div className={styles.cards} role="radiogroup" aria-labelledby={labelledBy}>
        {cards.map((card, index) => (
          <ClassSelectCard
            key={card.classId}
            card={card}
            slot={classSlot(cards.length, index)}
            allyCount={allyCounts[card.classId] ?? 0}
            isPicked={card.classId === pickedClassId}
            isPreviewed={card.classId === previewClassId}
            isTabbable={index === tabbableIndex}
            isAutoFocused={card.classId === autoFocusClassId}
            describedBy={describedBy}
            onPick={() => {
              onPick(card.classId);
            }}
            onPreview={(isPreviewing) => {
              onPreview(isPreviewing ? card.classId : null);
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
