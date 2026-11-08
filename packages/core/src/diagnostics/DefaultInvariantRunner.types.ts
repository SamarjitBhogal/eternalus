import type { MatchPhase } from '../config/matchPhases';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import type { DebugConfig } from './InvariantRunner.types';
import type { Logger } from './Logger.types';

/** What the default invariant runner is built from (DEC-174, as DEC-113 (4) for the director). */
export type DefaultInvariantRunnerOptions = {
  /** How much checking runs, and whether a violation throws. */
  readonly debug: DebugConfig;
  /** Where violations are reported when `debug.throwOnViolation` is off. */
  readonly logger: Logger;
  /** The level curves `level-matches-xp` checks against, injected. */
  readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>;
  /** The phase order `phase-monotonic` checks against (`MATCH_PHASES`), injected. */
  readonly phaseOrder: readonly MatchPhase[];
  /** The phases `phase-monotonic` lets no move leave (`TERMINAL_MATCH_PHASES`), injected. */
  readonly terminalPhases: readonly MatchPhase[];
};
