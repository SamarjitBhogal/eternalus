import type { InputAction } from '../../bridge/Binding.types';

/** One input (by `chordKey`) that is bound to several actions at once. */
export type BindingConflict = {
  readonly chord: string;
  readonly actions: readonly InputAction[];
};
