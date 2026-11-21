import type { MatchPhase } from '../../config/matchPhases';
import type { MatchPhaseState } from '../MatchPhaseState.types';

/**
 * A phase with no rules of its own: entering, updating and leaving it change nothing. A phase
 * class extends it while it has no rules; once it has some, it implements `MatchPhaseState`
 * itself, as `CountdownPhase` does.
 */
export abstract class PassivePhase implements MatchPhaseState {
  public abstract readonly phase: MatchPhase;

  /** Does nothing. */
  public enter(): void {
    // No entry rules.
  }

  /** Does nothing. */
  public update(): void {
    // No per-tick rules.
  }

  /** Does nothing. */
  public exit(): void {
    // No exit rules.
  }
}
