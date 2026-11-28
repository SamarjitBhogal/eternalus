import type { KeyboardEvent } from 'react';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import type { LegendSlot } from './legendSelectLayout.types';

/** What a Legend card of the Legend step draws and reports (`LegendSelectCard`). */
export type LegendSelectCardProps = {
  readonly legend: LegendCardView;
  /** The card's slot in the row (`legendSlot`): its box and text offsets per look. */
  readonly slot: LegendSlot;
  readonly isRowPlateMode: boolean;
  /** Holds the group's tab stop (roving tabindex) and the focus on entry. */
  readonly isTabbable: boolean;
  readonly onPick: () => void;
  /** A hover or focus starts (`true`) or ends (`false`) this card's panel preview. */
  readonly onPreview: (isPreviewing: boolean) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};
