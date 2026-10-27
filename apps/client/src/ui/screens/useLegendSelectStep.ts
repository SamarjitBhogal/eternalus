import { useState } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { useAppSelector } from '../../bridge/hooks';
import {
  selectLegendStepView,
  type LegendCardView,
  type LegendStepView,
} from '../../bridge/selectors/selectLegendStepView';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { rovingKeyDown, tabbableRovingIndex } from '../components/rovingRadio';
import { useAssetBox } from '../components/useAssetBox';
import { useAssetUrl } from '../components/useAssetUrl';
import { legendStepActions, type LegendStepActions } from './legendStepActions';
import { shownLegend } from './legendStepState';
import { rowPlateOf } from './selectionGeometry';
import type { RowPlate } from './selectionGeometry.types';

/** The Legend step's state and handlers. */
type LegendSelectStepModel = {
  readonly view: LegendStepView;
  /** The Legend the panel and the rating bars show: the previewed, else the picked, else the first. */
  readonly shown: LegendCardView | null;
  readonly tabbableIndex: number;
  readonly actions: LegendStepActions;
  /** The picked Legend's row plate while loaded and boxed (one predicate, CD-16), else `null`. */
  readonly rowPlate: RowPlate | null;
  /** LOCK IN's chrome plate: the catalogue's only while the row plate is drawn (CD-16). */
  readonly lockInChromeAssetId: AssetId | null;
  readonly onPreview: (specId: string | null) => void;
  readonly onCardKeyDown: ReturnType<typeof rovingKeyDown>;
};

/**
 * The Legend step's model, or `null` on the class step. A hover or focus previews a Legend in the
 * panel without emitting; arrows move the focus along the cards and pick where they land
 * (`legendStepActions.move`; HC-F1). The row plate and LOCK IN's chrome plate are decided here
 * once, from the picked Legend (CD-16).
 */
export function useLegendSelectStep(): LegendSelectStepModel | null {
  const view = useAppSelector(selectLegendStepView);
  const lockInChrome = useAppSelector(contentSlice.selectors.selectLockInChromeAssetId);
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null);
  const picked = view?.legends.find((legend) => legend.isPicked);
  const plateId = picked?.rowPlateAssetId ?? null;
  const rowPlate = rowPlateOf(useAssetUrl(plateId), useAssetBox(plateId));
  if (view === null) return null;
  const actions = legendStepActions(view);
  return {
    view,
    shown: shownLegend(view.legends, previewSpecId),
    tabbableIndex: tabbableRovingIndex(view.legends),
    actions,
    rowPlate,
    lockInChromeAssetId: rowPlate === null ? null : lockInChrome,
    onPreview: setPreviewSpecId,
    onCardKeyDown: rovingKeyDown(actions.move),
  };
}
