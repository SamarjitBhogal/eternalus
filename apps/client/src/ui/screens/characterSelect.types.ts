import type { LegendClassId } from '../../bridge/domain.types';

/** The two steps of the character-select phase (F1): pick a class, then one of its Legends. */
export type SelectionStep = 'class' | 'legend';

/** Props every selection step receives from the shell. */
export type SelectionStepProps = {
  /** The class just cleared by Back, picked again and focused on entry; `null` on first entry. */
  readonly preferredClassId: LegendClassId | null;
};
