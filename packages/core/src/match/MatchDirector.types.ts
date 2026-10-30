import type { MatchPhase } from '../config/matchPhases';
import type { DebugConfig } from '../diagnostics/InvariantRunner.types';
import type { Logger } from '../diagnostics/Logger.types';
import type { MatchPhaseRegistry } from './MatchPhaseState.types';
import type { MatchTimeline } from './MatchTimeline';
import type { TimelineActionRegistry } from './TimelineActionRegistry.types';
import type { VictoryCondition } from './VictoryCondition.types';

/** What a `MatchDirector` is built from (architecture 12 §4); every part is injected. */
export type MatchDirectorOptions = {
  /** One state per phase (`defaultMatchPhases.ts`). */
  readonly phases: MatchPhaseRegistry;
  /** The resolved timeline; `state.match.schedule` holds its marks in the same order. */
  readonly timeline: MatchTimeline;
  /** One handler per timeline action kind (`defaultTimelineActions.ts`). */
  readonly actions: TimelineActionRegistry;
  /** The phase order transitions follow (`MATCH_PHASES`). */
  readonly order: readonly MatchPhase[];
  /** A move that is not forward is a bug: it throws when set (tests), else it is logged (browser). */
  readonly debug: Pick<DebugConfig, 'throwOnViolation'>;
  /** Where a skipped move is reported when `debug.throwOnViolation` is off. */
  readonly logger: Logger;
  /** The victory conditions in check order (`defaultVictoryConditions.ts`); the first verdict wins. */
  readonly conditions: readonly VictoryCondition[];
};
