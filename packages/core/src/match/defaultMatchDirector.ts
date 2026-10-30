import type { MatchTimeline } from './MatchTimeline';
import type { MatchDirectorOptions } from './MatchDirector.types';
import type { GameState } from '../state/GameState';
import { MATCH_PHASES } from '../config/matchPhases';
import { createDefaultMatchPhases } from './defaultMatchPhases';
import { createDefaultTimelineActions } from './defaultTimelineActions';
import { createDefaultVictoryConditions } from './defaultVictoryConditions';
import { MatchDirector } from './MatchDirector';

/** What `createDefaultMatchDirector` needs from its caller. */
export type DefaultMatchDirectorOptions = {
  /** The match the victory conditions listen to. */
  readonly state: GameState;
  /** The resolved timeline; `state.match.schedule` holds its marks. */
  readonly timeline: MatchTimeline;
  readonly debug: MatchDirectorOptions['debug'];
  readonly logger: MatchDirectorOptions['logger'];
};

/**
 * The default `MatchDirector` (architecture 12 §4): the default phases, timeline actions and
 * victory conditions, in `MATCH_PHASES` order. The one place that wires them, so `Simulation`
 * and the scenario tests build the same director.
 */
export const createDefaultMatchDirector = ({
  state,
  timeline,
  debug,
  logger,
}: DefaultMatchDirectorOptions): MatchDirector =>
  new MatchDirector({
    phases: createDefaultMatchPhases(),
    timeline,
    actions: createDefaultTimelineActions(),
    order: MATCH_PHASES,
    debug,
    logger,
    conditions: createDefaultVictoryConditions(state),
  });
