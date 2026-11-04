import type { LegendClassId } from '../../bridge/domain.types';

/**
 * The steps of the character-select phase: pick a class, then one of its Legends (HC-F1); after
 * LOCK IN, the locked view until the countdown ends (DEC-60).
 */
export type SelectionStep = 'class' | 'legend' | 'locked';

/** Props every selection step receives from the shell. */
export type SelectionStepProps = {
  /** The class just cleared by Back, picked again and focused on entry; `null` on first entry. */
  readonly preferredClassId: LegendClassId | null;
};
