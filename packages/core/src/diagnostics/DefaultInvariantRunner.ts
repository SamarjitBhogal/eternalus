import { FiniteTransformsInvariant } from './invariants/FiniteTransformsInvariant';
import { HealthWithinBoundsInvariant } from './invariants/HealthWithinBoundsInvariant';
import { NoRemovalWithoutCauseInvariant } from './invariants/NoRemovalWithoutCauseInvariant';
import { ProgressionLevelInvariant } from './invariants/ProgressionLevelInvariant';
import { InvariantRunner } from './InvariantRunner';
import type { DebugConfig } from './InvariantRunner.types';
import type { Logger } from './Logger.types';

/** The runner with every built-in invariant. This is the one place that lists them (02 §9). */
export class DefaultInvariantRunner extends InvariantRunner {
  /** Creates a runner with every built-in invariant. */
  public constructor(config: DebugConfig, logger: Logger) {
    super(
      [
        new NoRemovalWithoutCauseInvariant(),
        new HealthWithinBoundsInvariant(),
        new FiniteTransformsInvariant(),
        new ProgressionLevelInvariant(),
      ],
      config,
      logger,
    );
  }
}
