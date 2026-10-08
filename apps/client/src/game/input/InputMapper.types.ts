import type { InputAction } from '../../bridge/Binding.types';

/** Which actions are active this frame, and which started or ended since the last one. */
export type ActionState = {
  readonly held: ReadonlySet<InputAction>;
  readonly pressed: ReadonlySet<InputAction>;
  readonly released: ReadonlySet<InputAction>;
};
