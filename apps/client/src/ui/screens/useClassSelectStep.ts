import { useState } from 'react';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { LegendClassId } from '../../bridge/domain.types';
import { useAppSelector } from '../../bridge/hooks';
import { isSelectableClass } from '../../bridge/selectionRules';
import { selectAllyCountsByClass } from '../../bridge/selectors/selectAllyCountsByClass';
import { type ClassPanel, selectClassPanel } from '../../bridge/selectors/selectClassPanel';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { rovingKeyDown, tabbableRovingIndex } from '../components/rovingRadio';
import { useAssetBox } from '../components/useAssetBox';
import { useAssetUrl } from '../components/useAssetUrl';
import { classStepActions, type ClassStepActions } from './classStepActions';
import {
  type ClassStepCard,
  type ClassStepLocal,
  initialClassStep,
  shownClassId,
} from './classStepState';
import { rowPlateOf } from './selectionGeometry';
import type { RowPlate } from './selectionGeometry.types';

/** State and handlers shared by both class layouts. */
type ClassSelectStepModel = {
  readonly cards: readonly LegendClassCard[];
  readonly allyCounts: Readonly<Record<LegendClassId, number>>;
  readonly local: ClassStepLocal;
  /** The panel of the shown class (preview, else pick, else the first available), layout applied. */
  readonly panel: ClassPanel | undefined;
  /** The card picked on screen, not yet selected (`select-class` comes with Select Class). */
  readonly picked: LegendClassCard | undefined;
  readonly tabbableIndex: number;
  /** The picked class's row plate while loaded and boxed (one predicate, CD-16), else `null`. */
  readonly rowPlate: RowPlate | null;
  readonly actions: ClassStepActions;
  /** Arrow / Home / End on the card at `index`: picks where it lands and moves the focus there. */
  readonly onCardKeyDown: ReturnType<typeof rovingKeyDown>;
};

const toStepCard = (card: LegendClassCard): ClassStepCard => ({
  classId: card.classId,
  isAvailable: isSelectableClass(card),
});

/**
 * The class step's model for either layout. The pick is local until Select Class / View Details
 * (HC-F1): a hover or focus previews a class in the panel, arrows move the focus and pick where
 * they land, nothing is emitted meanwhile. `preferredClassId` (Back) is picked again and
 * focused on mount. The row plate is decided here once, from the pick (CD-16).
 */
export function useClassSelectStep(preferredClassId: LegendClassId | null): ClassSelectStepModel {
  const cards = useAppSelector(contentSlice.selectors.selectLegendClasses);
  const allyCounts = useAppSelector(selectAllyCountsByClass);
  const stepCards = cards.map(toStepCard);
  const [local, setLocal] = useState(() => initialClassStep(stepCards, preferredClassId));
  const panel = useAppSelector((state) => selectClassPanel(state, shownClassId(local, stepCards)));
  const picked = cards.find((card) => card.classId === local.pickedClassId);
  const plateId = picked?.art.rowPlate ?? null;
  const rowPlate = rowPlateOf(useAssetUrl(plateId), useAssetBox(plateId));
  const actions = classStepActions(stepCards, local, setLocal);
  return {
    cards,
    allyCounts,
    local,
    panel,
    picked,
    tabbableIndex: tabbableRovingIndex(
      stepCards.map((card) => ({ ...card, isPicked: card.classId === local.pickedClassId })),
    ),
    rowPlate,
    actions,
    onCardKeyDown: rovingKeyDown(actions.move),
  };
}
