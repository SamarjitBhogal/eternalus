import { FiniteTransformsInvariant } from './invariants/FiniteTransformsInvariant';
import { HealthWithinBoundsInvariant } from './invariants/HealthWithinBoundsInvariant';
import { GuardWithinLeashInvariant } from './invariants/GuardWithinLeashInvariant';
import { HordeMembershipConsistentInvariant } from './invariants/HordeMembershipConsistentInvariant';
import { LevelMatchesXpInvariant } from './invariants/LevelMatchesXpInvariant';
import { NoDeathWithoutKillerInvariant } from './invariants/NoDeathWithoutKillerInvariant';
import { NoMapObjectOverlapInvariant } from './invariants/NoMapObjectOverlapInvariant';
import { NoRemovalWithoutCauseInvariant } from './invariants/NoRemovalWithoutCauseInvariant';
import { PhaseMonotonicInvariant } from './invariants/PhaseMonotonicInvariant';
import { StatusStacksWithinMaxInvariant } from './invariants/StatusStacksWithinMaxInvariant';
import type { DefaultInvariantRunnerOptions } from './DefaultInvariantRunner.types';
import { InvariantRunner } from './InvariantRunner';

/** The runner with every built-in invariant. This is the one place that lists them (02 §9). */
export class DefaultInvariantRunner extends InvariantRunner {
  /** Creates a runner with every built-in invariant (`DefaultInvariantRunnerOptions`). */
  public constructor({
    debug,
    logger,
    curves,
    phaseOrder,
    terminalPhases,
  }: DefaultInvariantRunnerOptions) {
    super(
      [
        new NoRemovalWithoutCauseInvariant(),
        new NoDeathWithoutKillerInvariant(),
        new NoMapObjectOverlapInvariant(),
        new HealthWithinBoundsInvariant(),
        new FiniteTransformsInvariant(),
        new HordeMembershipConsistentInvariant(),
        new GuardWithinLeashInvariant(),
        new LevelMatchesXpInvariant(curves),
        new StatusStacksWithinMaxInvariant(),
        new PhaseMonotonicInvariant(phaseOrder, terminalPhases),
      ],
      debug,
      logger,
    );
  }
}
