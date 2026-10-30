import type { DirectorContext } from '../DirectorContext.types';
import type { MatchPhaseState } from '../MatchPhaseState.types';

/**
 * The countdown, where every match starts (architecture 12 §2). It is a freeze (DEC-81,
 * DEC-84, DEC-88): spawns still happen, but every unit stays idle until it ends: nothing walks,
 * attacks or casts, and turning is allowed. Entering holds units idle and leaving releases them.
 * The director runs after `MovementSystem`, so a phase entered at tick T takes effect from step
 * T+1: a countdown that ends at tick T holds steps 0..T, and a 0 s countdown still holds step 0.
 */
export class CountdownPhase implements MatchPhaseState {
  public readonly phase = 'countdown';

  /** Holds every unit idle. */
  public enter({ state }: DirectorContext): void {
    state.match.isIdleHeld = true;
  }

  /** Does nothing: the countdown ends by timeline entry, not by a per-tick rule. */
  public update(): void {
    // No per-tick rules.
  }

  /** Releases the idle hold. */
  public exit({ state }: DirectorContext): void {
    state.match.isIdleHeld = false;
  }
}
