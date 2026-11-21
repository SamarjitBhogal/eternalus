import type { ScoringOptions } from '../content/match/scoring.types';
import type { MatchTimeline } from './MatchTimeline';
import type { MatchDirectorOptions } from './MatchDirector.types';
import type { GameState } from '../state/GameState';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { StateHasher } from '../state/StateHasher';
import { createDefaultMatchPhases } from './defaultMatchPhases';
import { createDefaultScoringRules } from './defaultScoringRules';
import { createDefaultTimelineActions } from './defaultTimelineActions';
import { createDefaultVictoryConditions } from './defaultVictoryConditions';
import { MatchDirector } from './MatchDirector';
import { Scoring } from './Scoring';

/** What `createDefaultMatchDirector` needs from its caller. */
export type DefaultMatchDirectorOptions = {
  /** The match the victory conditions listen to. */
  readonly state: GameState;
  /** The resolved timeline; `state.match.schedule` holds its marks. */
  readonly timeline: MatchTimeline;
  readonly debug: MatchDirectorOptions['debug'];
  readonly logger: MatchDirectorOptions['logger'];
  /** The points and the assist window `Scoring` counts with (`content/match/scoring.ts`). */
  readonly scoring: ScoringOptions;
};

/**
 * The default `MatchDirector` (architecture 12 §4): the default phases, timeline actions and
 * victory conditions, in `MATCH_PHASES` order, and `Scoring`. The one place that wires them, so
 * `Simulation` and the scenario tests build the same director. Build it before anything spawns:
 * `Scoring` gives a row only to a Legend whose `entity-spawned` it heard.
 */
export const createDefaultMatchDirector = ({
  state,
  timeline,
  debug,
  logger,
  scoring,
}: DefaultMatchDirectorOptions): MatchDirector =>
  new MatchDirector({
    phases: createDefaultMatchPhases(),
    timeline,
    actions: createDefaultTimelineActions(),
    order: MATCH_PHASES,
    terminal: TERMINAL_MATCH_PHASES,
    hasher: new StateHasher(),
    debug,
    logger,
    conditions: createDefaultVictoryConditions(state),
    scoring: new Scoring(state, createDefaultScoringRules(scoring, state.config.tickRate)),
  });
