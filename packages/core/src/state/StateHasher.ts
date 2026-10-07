import { fnv1a } from '../utils/fnv1a';
import type { GameState } from './GameState';

/**
 * Fingerprints a match state as a 32-bit FNV-1a hash of its canonical serialisation: the RNG
 * state, then the snapshot (tick, phase, every entity in store order with fields in a fixed
 * order). Equal states hash equal; two runs that diverge show it at the next hash.
 */
export class StateHasher {
  /** The hash of `state` right now. */
  public hash(state: GameState): number {
    return fnv1a(JSON.stringify([state.rng.getState(), state.snapshot()]));
  }
}
