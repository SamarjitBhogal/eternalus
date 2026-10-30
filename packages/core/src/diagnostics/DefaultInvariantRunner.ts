import { FiniteTransformsInvariant } from './invariants/FiniteTransformsInvariant';
import { HealthWithinBoundsInvariant } from './invariants/HealthWithinBoundsInvariant';
import { LevelMatchesXpInvariant } from './invariants/LevelMatchesXpInvariant';
import { NoDeathWithoutKillerInvariant } from './invariants/NoDeathWithoutKillerInvariant';
import { NoRemovalWithoutCauseInvariant } from './invariants/NoRemovalWithoutCauseInvariant';
import { PhaseMonotonicInvariant } from './invariants/PhaseMonotonicInvariant';
import { StatusStacksWithinMaxInvariant } from './invariants/StatusStacksWithinMaxInvariant';
import type { MatchPhase } from '../config/matchPhases';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { InvariantRunner } from './InvariantRunner';
import type { DebugConfig } from './InvariantRunner.types';
import type { Logger } from './Logger.types';

/** The runner with every built-in invariant. This is the one place that lists them (02 §9). */
export class DefaultInvariantRunner extends InvariantRunner {
  /**
   * Creates a runner with every built-in invariant.
   *
   * @param curves - The level curves `level-matches-xp` checks against, injected.
   * @param phaseOrder - The phase order `phase-monotonic` checks against (`MATCH_PHASES`), injected.
   * @param terminalPhases - The phases `phase-monotonic` lets no move leave
   *   (`TERMINAL_MATCH_PHASES`), injected.
   */
  public constructor(
    config: DebugConfig,
    logger: Logger,
    curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>,
    phaseOrder: readonly MatchPhase[],
    terminalPhases: readonly MatchPhase[],
  ) {
    super(
      [
        new NoRemovalWithoutCauseInvariant(),
        new NoDeathWithoutKillerInvariant(),
        new HealthWithinBoundsInvariant(),
        new FiniteTransformsInvariant(),
        new LevelMatchesXpInvariant(curves),
        new StatusStacksWithinMaxInvariant(),
        new PhaseMonotonicInvariant(phaseOrder, terminalPhases),
      ],
      config,
      logger,
    );
  }
}
