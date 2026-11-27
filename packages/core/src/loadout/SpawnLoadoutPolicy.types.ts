import type { Loadout } from './Loadout.types';
import type { LoadoutProblem } from './LoadoutValidator.types';

/**
 * A spawn loadout that failed validation, and the loadout used instead (05 §12): its Legend's
 * auto-build, else the class default.
 */
export type LoadoutRejection = {
  readonly definitionId: string;
  readonly given: Loadout;
  readonly problems: readonly LoadoutProblem[];
  readonly used: Loadout;
};
