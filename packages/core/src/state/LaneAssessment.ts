import { Health } from '../components/Health';
import type { LaneAssessmentWeights } from '../content/ai/ai.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { GameState } from './GameState';

/** The enemy's lane structures' remaining health over their starting total; 1 with none. */
const damageNotDealt = (state: GameState, lane: string, enemy: PlayableTeam): number => {
  let remaining = 0;
  let starting = 0;
  for (const { id, startingHealth } of state.laneStructures.onLane(lane, enemy)) {
    starting += startingHealth;
    remaining += state.entities.get(id)?.findComponent(Health)?.total ?? 0;
  }
  return starting === 0 ? 1 : Math.min(1, remaining / starting);
};

/** The share of `team`'s lane structures already destroyed; 0 with none. */
const structuresLost = (state: GameState, lane: string, team: PlayableTeam): number => {
  const own = state.laneStructures.onLane(lane, team);
  const lost = own.filter(({ id }) => !state.entities.isAlive(id)).length;
  return own.length === 0 ? 0 : lost / own.length;
};

/**
 * The lane where `team` is worst off (MS-9, architecture 18 §3.3): the highest weighted score of
 * structure damage not dealt, structures lost and how far enemy hordes have pushed past the
 * lane's midpoint. Ties go to the lane nearest the middle (`floor(numLanes / 2)` by index), then
 * to the lower index, so at match start it is the middle lane. Reads only `state`; O(lanes ×
 * hordes).
 * Structure terms read `state.laneStructures` (the lane's towers and gate at match start) and
 * each one's current `Health.total`; a destroyed structure counts as 0 remaining.
 *
 * @returns The lane's `MapLane.id`, or `undefined` for a match without a map.
 */
export const assessLanes = (
  state: GameState,
  team: PlayableTeam,
  weights: LaneAssessmentWeights,
): string | undefined => {
  const routes = state.routes;
  if (routes === null) {
    return undefined;
  }
  const middle = Math.floor(routes.lanes.length / 2);
  let worst: { readonly id: string; readonly score: number; readonly offMiddle: number } | null =
    null;
  for (const lane of routes.lanes) {
    const half = routes.length(lane.id) / 2;
    let deepest = 0;
    state.hordes.forEach((horde) => {
      if (horde.lane === lane.id && horde.team !== team) {
        deepest = Math.max(deepest, horde.progress);
      }
    });
    const pushedBack = half === 0 ? 0 : Math.max(0, deepest - half) / half;
    const score =
      weights.damageNotDealt * damageNotDealt(state, lane.id, team === 'light' ? 'dark' : 'light') +
      weights.structuresLost * structuresLost(state, lane.id, team) +
      weights.pushedBack * pushedBack;
    const offMiddle = Math.abs(lane.index - middle);
    // Lanes come in ascending index, so a strict comparison keeps the lower index on a full tie.
    if (
      worst === null ||
      score > worst.score ||
      (score === worst.score && offMiddle < worst.offMiddle)
    ) {
      worst = { id: lane.id, score, offMiddle };
    }
  }
  return worst?.id;
};
