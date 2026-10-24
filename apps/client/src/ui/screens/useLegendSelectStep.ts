import { useState, type KeyboardEvent } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { useAppSelector } from '../../bridge/hooks';
import {
  selectLegendStepView,
  type LegendCardView,
  type LegendStepView,
} from '../../bridge/selectors/selectLegendStepView';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { tabbableRovingIndex } from '../components/rovingRadio';
import { useAssetUrl } from '../components/useAssetUrl';
import { legendStepActions, type LegendStepActions } from './legendStepActions';
import { ROW_PLATE_BOXES } from './LegendSelectStep.constants';
import type { RasterBox } from './legendSelectLayout.types';

/** The Legend row plate to draw: its URL at its full box. */
type LegendRowPlate = { readonly url: string; readonly box: RasterBox };

/** The Legend step's state and handlers. */
type LegendSelectStepModel = {
  readonly view: LegendStepView;
  /** The Legend the panel and the rating bars show: the previewed, else the picked, else the first. */
  readonly shown: LegendCardView | null;
  readonly tabbableIndex: number;
  readonly actions: LegendStepActions;
  /** The picked Legend's row plate while it is loaded and boxed (I-69's one predicate), else `null`. */
  readonly rowPlate: LegendRowPlate | null;
  /** LOCK IN's chrome plate: the catalogue's only while the row plate is drawn (FID-R4-01). */
  readonly lockInChromeAssetId: AssetId | null;
  readonly onPreview: (specId: string | null) => void;
  readonly onCardKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
};

function rowPlateOf(assetId: AssetId | null, url: string | null): LegendRowPlate | null {
  const box = assetId === null ? undefined : ROW_PLATE_BOXES[assetId];
  return url === null || box === undefined ? null : { url, box };
}

/**
 * The Legend step's model, or `null` on the class step. A hover or focus previews a Legend in the
 * panel without emitting (SUB P2); arrows move the focus along the cards and pick where they land
 * (`legendStepActions.move`, I-14). The row plate and LOCK IN's chrome plate are decided here
 * once, from the picked Legend (I-69).
 */
export function useLegendSelectStep(): LegendSelectStepModel | null {
  const view = useAppSelector(selectLegendStepView);
  const lockInChrome = useAppSelector(contentSlice.selectors.selectLockInChromeAssetId);
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null);
  const picked = view?.legends.find((legend) => legend.isPicked);
  const plateId = picked?.rowPlateAssetId ?? null;
  const rowPlate = rowPlateOf(plateId, useAssetUrl(plateId));
  if (view === null) return null;
  const actions = legendStepActions(view);
  return {
    view,
    shown:
      view.legends.find((legend) => legend.specId === previewSpecId) ??
      picked ??
      view.legends[0] ??
      null,
    tabbableIndex: tabbableRovingIndex(view.legends),
    actions,
    rowPlate,
    lockInChromeAssetId: rowPlate === null ? null : lockInChrome,
    onPreview: setPreviewSpecId,
    onCardKeyDown: (event, index) => {
      const next = actions.move(index, event.key);
      if (next === null) return;
      event.preventDefault();
      event.currentTarget.parentElement
        ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        [next]?.focus();
    },
  };
}
