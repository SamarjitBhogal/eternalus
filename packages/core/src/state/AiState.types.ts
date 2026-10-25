import type { AiMemory, ControllerId } from '../content/ai/ai.types';
import type { SeededRandomState } from '../utils/SeededRandom.types';

/** Re-exported for `state/` readers; it lives in content types because `components/` reads it. */
export type { AiMemory };

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
