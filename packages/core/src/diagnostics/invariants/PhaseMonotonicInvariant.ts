import type { MatchPhase } from '../../config/matchPhases';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `phase-monotonic` (architecture 12 §12): every phase change of this tick moves the match forward
 * in the phase order, never back to an earlier phase or into the phase it is in, and never out of
 * a terminal phase (`victory`, `defeat`). It keeps no scratch: it reads this tick's
 * `phase-changed` events from the state. Runs every tick.
 */
export class PhaseMonotonicInvariant implements Invariant {
  public readonly id = 'phase-monotonic';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /**
   * @param order - The phase order (`MATCH_PHASES`), injected: `diagnostics/` may import only the
   *   types of `config/` (02 §2).
   * @param terminal - The phases a match never leaves (`TERMINAL_MATCH_PHASES`), injected likewise.
   */
  public constructor(
    private readonly order: readonly MatchPhase[],
    private readonly terminal: readonly MatchPhase[],
  ) {}

  /**
   * Flags each of this tick's phase changes that does not move forward or that leaves a terminal
   * phase, in event order.
   */
  public check(state: GameState): readonly Violation[] {
    return state
      .phaseChangesThisTick()
      .filter(
        ({ from, to }) =>
          this.terminal.includes(from) || this.order.indexOf(to) <= this.order.indexOf(from),
      )
      .map(({ from, to }) => ({
        invariantId: this.id,
        severity: this.severity,
        message: this.terminal.includes(from)
          ? `The match phase moved from "${from}" to "${to}", out of a terminal phase.`
          : `The match phase moved from "${from}" to "${to}", which is not forward.`,
        entityId: null,
        details: { from, to },
      }));
  }
}
