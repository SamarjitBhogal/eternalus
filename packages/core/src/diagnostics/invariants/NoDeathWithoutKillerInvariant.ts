import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `no-death-without-killer` (architecture 15 §3, 05 §9): every entity removed this tick with the
 * cause `died` took its lethal hit through the damage pipeline, so the hit named a killer. A death
 * without one means something wrote `Health` around the pipeline (the requirements' "dies without
 * another entity or a defensive tower killing it").
 */
export class NoDeathWithoutKillerInvariant implements Invariant {
  public readonly id = 'no-death-without-killer';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every `died` removal of this tick that has no killer. */
  public check(state: GameState): readonly Violation[] {
    return state.entities
      .removedThisTick()
      .filter(({ entityId, cause }) => cause === 'died' && state.killerOf(entityId) === undefined)
      .map(({ entityId }) => ({
        invariantId: this.id,
        severity: this.severity,
        message: `Entity "${entityId}" died with no entity-died killer this tick (did its lethal hit skip the damage pipeline?).`,
        entityId,
        details: {},
      }));
  }
}
