import type { ControllerId } from '../content/ai/ai.types';
import type { SeededRandomState } from '../utils/SeededRandom.types';

/** A controller's plain-data memory between decisions: FSM state, target, timers (11 §2). */
type AiMemory = Readonly<Record<string, string | number | boolean | null>>;

/**
 * Everything one entity's controller remembers (architecture 11 §2), as plain data in state, so
 * it is hashed, snapshotted and replayed like any other state.
 */
export type Brain = {
  readonly controllerId: ControllerId;
  readonly profileId: string;
  readonly memory: AiMemory;
  /** This brain's own seeded stream (11 §5), advanced only by its controller. */
  readonly rngState: SeededRandomState;
};
