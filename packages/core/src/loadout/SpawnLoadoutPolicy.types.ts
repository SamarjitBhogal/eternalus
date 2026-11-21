import type { Loadout } from './Loadout.types';
import type { LoadoutProblem } from './LoadoutValidator.types';

/** A spawn loadout that failed validation, and the auto-build used instead (05 §12). */
export type LoadoutRejection = {
  readonly definitionId: string;
  readonly given: Loadout;
  readonly problems: readonly LoadoutProblem[];
  readonly used: Loadout;
};
