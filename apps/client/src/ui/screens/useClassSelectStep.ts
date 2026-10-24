import { useState, type KeyboardEvent } from 'react';

import type { AssetId, LegendClassCard } from '../../bridge/catalogue.types';
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
  /** The card that takes the focus on mount: the class Back returned to (CD-11), else `null`. */
  readonly autoFocusClassId: LegendClassId | null;
  /** The picked class's row plate while it is loaded and boxed (I-69's one predicate), else `null`. */
  readonly rowPlate: RowPlate | null;
  /** Select Class's chrome plate, for every pick (FID-R4-01); `null` = live CSS. */
  readonly selectClassChromeAssetId: AssetId | null;
  readonly actions: ClassStepActions;
  /** Arrow / Home / End on the card at `index`: picks where it lands and moves the focus there. */
  readonly onCardKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
};

const toStepCard = (card: LegendClassCard): ClassStepCard => ({
  classId: card.classId,
  isAvailable: isSelectableClass(card),
});

/**
 * The class step's model for either layout. The pick is local until Select Class / View Details
 * (CS3): a hover or focus previews a class in the panel, arrows move the focus and pick where
 * they land (I-14), nothing is emitted meanwhile. `preferredClassId` (Back) is picked again and
 * focused on mount. The row plate is decided here once, from the pick (I-69).
 */
export function useClassSelectStep(preferredClassId: LegendClassId | null): ClassSelectStepModel {
  const cards = useAppSelector(contentSlice.selectors.selectLegendClasses);
  const allyCounts = useAppSelector(selectAllyCountsByClass);
  const chromeAssetId = useAppSelector(contentSlice.selectors.selectSelectClassChromeAssetId);
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
    autoFocusClassId: preferredClassId,
    rowPlate,
    selectClassChromeAssetId: chromeAssetId,
    actions,
    onCardKeyDown: rovingKeyDown(actions.move),
  };
}
