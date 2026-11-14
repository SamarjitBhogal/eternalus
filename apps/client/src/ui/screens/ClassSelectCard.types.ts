import type { KeyboardEvent } from 'react';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { ClassSlot } from './classSelectLayout.types';

/** What a class card of the class step draws and reports (`ClassSelectCard`). */
export type ClassSelectCardProps = {
  readonly card: LegendClassCard;
  /** The card's slot in the row (`classSlot`). */
  readonly slot: ClassSlot;
  readonly allyCount: number;
  readonly isPicked: boolean;
  /** A hover or focus preview shows this card in the panel (the hover cue, CD-11). */
  readonly isPreviewed: boolean;
  /** Holds the group's tab stop (roving tabindex). */
  readonly isTabbable: boolean;
  /** Takes the focus on mount: the class Back returned to (CD-11, WCAG 2.4.3). */
  readonly isAutoFocused: boolean;
  /** Id of the panel that describes the shown class. */
  readonly describedBy: string;
  readonly onPick: () => void;
  /** A hover or focus starts (`true`) or ends (`false`) this card's panel preview. */
  readonly onPreview: (isPreviewing: boolean) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};
