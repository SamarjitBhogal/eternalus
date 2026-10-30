import { Health } from '../components/Health';
import type { LaneAssessmentWeights } from '../content/ai/ai.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { GameState } from './GameState';

/** The share of `team`'s own lane structures' starting health they have lost; 0 with none. */
const structureDamageTaken = (state: GameState, lane: string, team: PlayableTeam): number => {
  let remaining = 0;
  let starting = 0;
  for (const { id, startingHealth } of state.laneStructures.onLane(lane, team)) {
    starting += startingHealth;
    remaining += state.entities.get(id)?.findComponent(Health)?.total ?? 0;
  }
  return starting === 0 ? 0 : Math.max(0, 1 - remaining / starting);
};

/**
 * The lane where `team` is struggling most (MS-9, DEC-89, architecture 18 §3.3): the highest
 * weighted score of the damage its own lane structures took, how far enemy hordes have pushed
 * past the lane's midpoint and the lane's share of the damage its Legends and mobs took since its
 * last heavy wave. Ties go to the lane nearest the middle (`floor(numLanes / 2)` by index), then
 * to the lower index, so at match start it is the middle lane. Reads only `state`; O(lanes ×
 * (hordes + lanes)).
 * The structure term reads `state.laneStructures` (the lane's towers and gate at match start) and
 * each one's current `Health.total`; a destroyed structure counts as 0 remaining. The ally term
 * reads `state.allyDamage`.
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
      weights.structureDamageTaken * structureDamageTaken(state, lane.id, team) +
      weights.pushedBack * pushedBack +
      weights.alliesHurt * state.allyDamage.share(team, lane.id);
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
