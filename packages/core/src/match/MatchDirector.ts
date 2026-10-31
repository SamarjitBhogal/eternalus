import type { TimelineAction, TimelineActionKind } from '../config/MatchTimelineEntry.types';
import type { MatchPhase } from '../config/matchPhases';
import { TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { makeLogRecord } from '../diagnostics/makeLogRecord';
import type { GameState } from '../state/GameState';
import type { MatchResult, Verdict } from '../state/MatchResult.types';
import { StateHasher } from '../state/StateHasher';
import { canonicalJson } from '../utils/canonicalJson';
import { fnv1a } from '../utils/fnv1a';
import type { DirectorContext } from './DirectorContext.types';
import type { MatchDirectorOptions } from './MatchDirector.types';

/**
 * Runs a match through its phases from timeline data, and ends it on the first verdict
 * (architecture 12 §4, §6). It never calls a system: it changes `state.match` and emits events,
 * and everything it remembers lives in `state.match`, so it is hashed and replayed. Phases,
 * actions and victory conditions are injected registries, so a new phase, timed event or way to
 * win never changes this class.
 */
export class MatchDirector {
  private readonly hasher = new StateHasher();

  /**
   * @param options - The phases, timeline, actions, phase order and victory conditions, plus the
   *   debug setting and logger.
   */
  public constructor(private readonly options: MatchDirectorOptions) {}

  /**
   * Enters the phase the match starts in. Called once, before the first tick, so that phase's
   * rules (the countdown's idle hold) already cover tick 0. Emits nothing: no phase changed.
   */
  public start(state: GameState): void {
    this.options.phases[state.match.phase].enter(this.contextFor(state));
  }

  /**
   * Once per tick, in this fixed order: fire every due timeline entry (tick <= the current tick)
   * from `state.match.timelineCursor` on, run the current phase's `update`, fold the tick's
   * scoring (so a kill on the ending tick is in the result), then check the victory conditions in
   * order and end the match on the first verdict. Does nothing once the match has a result: the
   * director is inert after the end.
   */
  public update(state: GameState): void {
    if (state.match.result !== null) {
      return;
    }
    const context = this.contextFor(state);
    this.fireDueEntries(context);
    this.options.phases[state.match.phase].update(context);
    this.options.scoring.fold(context);
    const verdict = this.firstVerdict(context);
    if (verdict !== null) {
      this.end(verdict, context);
    }
  }

  /** Asks every condition in registry order and keeps the first verdict; later ones are not asked. */
  private firstVerdict(context: DirectorContext): Verdict | null {
    for (const condition of this.options.conditions) {
      const verdict = condition.check(context);
      if (verdict !== null) {
        return verdict;
      }
    }
    return null;
  }

  /**
   * Ends the match (12 §6): builds the `MatchResult`, stores it in `state.match.result`, enters
   * `victory` when the winner is `state.match.playerTeam`, else `defeat` (a draw too, 12 §2),
   * then emits `match-ended` with the stored result.
   *
   * - `finalHash` is the `StateHasher` hash of the state on the ending tick, after that tick's
   *   systems and timeline entries, taken before the result is stored and the terminal phase is
   *   entered. It is not `ReplayOutcome.finalHash` (the hash after a replay's last tick).
   * - `durationTicks` is `state.tick + 1`: the ticks the match ran from tick 0, the countdown and
   *   the ending tick included, so it equals `Simulation.tick` right after the step that ended it.
   * - `configHash` is FNV-1a over the canonical config (keys sorted at every depth).
   * - `legends` and `teams` are copies of `state.match.scoring`, this tick's fold included.
   */
  private end(verdict: Verdict, context: DirectorContext): void {
    const { state } = context;
    const { match } = state;
    const { legends, teams } = match.scoring;
    const result: MatchResult = {
      winner: verdict.winner,
      condition: verdict.condition,
      playerTeam: match.playerTeam,
      hadHuman: match.humanLegendId !== null,
      durationTicks: state.tick + 1,
      seed: state.seed,
      configHash: fnv1a(canonicalJson(state.config)),
      legends: legends.map((row) => ({ ...row })),
      teams: { light: { ...teams.light }, dark: { ...teams.dark } },
      finalHash: this.hasher.hash(state),
    };
    match.result = result;
    this.transition(verdict.winner === match.playerTeam ? 'victory' : 'defeat', context);
    state.events.emit('match-ended', { result });
  }

  private fireDueEntries(context: DirectorContext): void {
    const { match } = context.state;
    const { entries } = this.options.timeline;
    let entry = entries[match.timelineCursor];
    while (entry !== undefined && entry.tick <= context.state.tick) {
      // Advance first, so an entry never fires twice, even when its action throws.
      match.timelineCursor += 1;
      this.run(entry.action, context);
      entry = entries[match.timelineCursor];
    }
  }

  private run<K extends TimelineActionKind>(action: TimelineAction<K>, context: DirectorContext) {
    this.options.actions[action.kind].run(action, context);
  }

  private transition(to: MatchPhase, context: DirectorContext): void {
    const { phases, order } = this.options;
    const { state } = context;
    const from = state.match.phase;
    if (TERMINAL_MATCH_PHASES.includes(from) || order.indexOf(to) <= order.indexOf(from)) {
      // A backwards (or repeated) phase, or any move out of a terminal one, is a bug: validation
      // keeps it out of the timeline, and the director does nothing after the end.
      this.rejectMove(from, to, state);
      return;
    }
    phases[from].exit(context);
    state.setPhase(to);
    phases[to].enter(context);
  }

  /** Throws in tests; in the browser, logs the bug and leaves the phase as it is. */
  private rejectMove(from: MatchPhase, to: MatchPhase, state: GameState): void {
    const reason = TERMINAL_MATCH_PHASES.includes(from)
      ? `"${from}" is terminal`
      : 'phases only move forward';
    const message = `The match cannot move from phase "${from}" to "${to}": ${reason}.`;
    if (this.options.debug.throwOnViolation) {
      throw new Error(message);
    }
    this.options.logger.log(
      makeLogRecord('ERROR', 'core.match', message, { tick: state.tick, attributes: { from, to } }),
    );
  }

  private contextFor(state: GameState): DirectorContext {
    const context: DirectorContext = {
      state,
      enterPhase: (phase) => {
        this.transition(phase, context);
      },
    };
    return context;
  }
}
