import type { GameState } from '../state/GameState';
import type { Invariant, InvariantSeverity, Violation } from './Invariant.types';
import { REPORTED_COMMANDS, REPORTED_EVENTS } from './InvariantRunner.constants';
import type { AssertLevel, DebugConfig } from './InvariantRunner.types';
import { InvariantViolationError } from './InvariantViolationError';
import type { Logger, SeverityText } from './Logger.types';
import { makeLogRecord } from './makeLogRecord';

/**
 * Runs the invariants that are due this tick and reports each violation twice, in a fixed order:
 * an `invariant-violated` game event, then one `LogRecord` with the seed, the tick and the recent
 * commands and events (architecture 15 §2 and §5). With `throwOnViolation` it then throws.
 */
export class InvariantRunner {
  private config: DebugConfig;

  /**
   * Creates a runner for `invariants`.
   *
   * @param invariants - The rules to check, in report order.
   * @param config - The assert level, the periodic cadence and whether to throw.
   * @param logger - Where violation reports go.
   */
  public constructor(
    private readonly invariants: readonly Invariant[],
    config: DebugConfig,
    private readonly logger: Logger,
  ) {
    this.config = InvariantRunner.checked(config);
  }

  /** The current settings. */
  public get debug(): DebugConfig {
    return this.config;
  }

  /** Changes the assert level (and optionally the periodic cadence) from the next run. */
  public setLevel(assertLevel: AssertLevel, heavyEvery = this.config.heavyEvery): void {
    this.config = InvariantRunner.checked({ ...this.config, assertLevel, heavyEvery });
  }

  /**
   * Checks every due invariant against `state` and reports what broke.
   *
   * @returns Every violation found, in invariant order.
   * @throws InvariantViolationError when `throwOnViolation` is set and anything broke.
   */
  public run(state: GameState): readonly Violation[] {
    if (this.config.assertLevel === 'off') {
      return [];
    }

    const isHeavyTick =
      this.config.assertLevel === 'heavy' && state.tick % this.config.heavyEvery === 0;
    const violations = this.invariants
      .filter((invariant) => invariant.cadence === 'tick' || isHeavyTick)
      .flatMap((invariant) => invariant.check(state));

    for (const violation of violations) {
      this.report(violation, state);
    }

    if (this.config.throwOnViolation && violations.length > 0) {
      throw new InvariantViolationError(violations, state.tick, state.seed);
    }

    return violations;
  }

  private report(violation: Violation, state: GameState): void {
    const { invariantId, entityId, message, details, severity } = violation;
    state.events.emit('invariant-violated', { invariantId, tick: state.tick, details });
    this.logger.log(
      makeLogRecord(InvariantRunner.levelOf(severity), 'core.invariants', message, {
        tick: state.tick,
        event: {
          name: 'invariant-violated',
          attributes: { invariantId, entityId, seed: state.seed, tick: state.tick },
        },
        context: {
          recentCommands: state.recentCommands().slice(-REPORTED_COMMANDS),
          recentEvents: state.events.recentEvents().slice(-REPORTED_EVENTS),
        },
      }),
    );
  }

  private static levelOf(severity: InvariantSeverity): SeverityText {
    const levels: Readonly<Record<InvariantSeverity, SeverityText>> = {
      warn: 'WARN',
      error: 'ERROR',
      fatal: 'FATAL',
    };
    return levels[severity];
  }

  private static checked(config: DebugConfig): DebugConfig {
    if (!Number.isInteger(config.heavyEvery) || config.heavyEvery < 1) {
      throw new RangeError(
        `DebugConfig heavyEvery must be a whole number >= 1, got ${String(config.heavyEvery)}.`,
      );
    }
    return config;
  }
}
