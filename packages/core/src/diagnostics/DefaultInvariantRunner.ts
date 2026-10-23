import { FiniteTransformsInvariant } from './invariants/FiniteTransformsInvariant';
import { HealthWithinBoundsInvariant } from './invariants/HealthWithinBoundsInvariant';
import { LevelMatchesXpInvariant } from './invariants/LevelMatchesXpInvariant';
import { NoDeathWithoutKillerInvariant } from './invariants/NoDeathWithoutKillerInvariant';
import { NoRemovalWithoutCauseInvariant } from './invariants/NoRemovalWithoutCauseInvariant';
import { StatusStacksWithinMaxInvariant } from './invariants/StatusStacksWithinMaxInvariant';
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
   */
  public constructor(
    config: DebugConfig,
    logger: Logger,
    curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>,
  ) {
    super(
      [
        new NoRemovalWithoutCauseInvariant(),
        new NoDeathWithoutKillerInvariant(),
        new HealthWithinBoundsInvariant(),
        new FiniteTransformsInvariant(),
        new LevelMatchesXpInvariant(curves),
        new StatusStacksWithinMaxInvariant(),
      ],
      config,
      logger,
    );
  }
}
