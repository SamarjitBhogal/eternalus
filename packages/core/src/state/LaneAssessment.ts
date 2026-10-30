import type { LaneAssessmentWeights } from '../content/ai/ai.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { GameState } from './GameState';

/**
 * How badly `team` is doing on each lane (MS-9, architecture 18 §3.3), lanes in index order: the
 * weighted score of structure damage not dealt, structures lost and how far enemy hordes have
 * pushed past the lane's midpoint. Reads only `state`; O(lanes × hordes). `mostLaneScore` is the
 * highest a score can be.
 *
 * @remarks ponytail: damage-not-dealt is 1 and structures-lost 0 on every lane until structure
 * entities exist (minion plan M2c), so only `pushedBack` separates lanes for now.
 */
export const laneScores = (
  state: GameState,
  team: PlayableTeam,
  weights: LaneAssessmentWeights,
): readonly { readonly id: string; readonly index: number; readonly score: number }[] => {
  const routes = state.world?.routes;
  if (routes === undefined) {
    return [];
  }
  return routes.lanes.map((lane) => {
    const half = routes.length(lane.id) / 2;
    let deepest = 0;
    state.hordes.forEach((horde) => {
      if (horde.lane === lane.id && horde.team !== team) {
        deepest = Math.max(deepest, horde.progress);
      }
    });
    const pushedBack = half === 0 ? 0 : Math.max(0, deepest - half) / half;
    const score =
      weights.damageNotDealt * 1 + weights.structuresLost * 0 + weights.pushedBack * pushedBack;
    return { id: lane.id, index: lane.index, score };
  });
};

/** The highest score `laneScores` can give a lane: every term at its most (each runs to 1). */
export const mostLaneScore = (weights: LaneAssessmentWeights): number =>
  weights.damageNotDealt + weights.structuresLost + weights.pushedBack;

/**
 * The lane where `team` is worst off: the highest `laneScores` score. Ties go to the lane nearest
 * the middle (`floor(numLanes / 2)` by index), then to the lower index, so at match start it is
 * the middle lane.
 *
 * @returns The lane's `MapLane.id`, or `undefined` for a match without a map.
 */
export const assessLanes = (
  state: GameState,
  team: PlayableTeam,
  weights: LaneAssessmentWeights,
): string | undefined => {
  const scores = laneScores(state, team, weights);
  const middle = Math.floor(scores.length / 2);
  let worst: { readonly id: string; readonly score: number; readonly offMiddle: number } | null =
    null;
  for (const { id, index, score } of scores) {
    const offMiddle = Math.abs(index - middle);
    // Lanes come in ascending index, so a strict comparison keeps the lower index on a full tie.
    if (
      worst === null ||
      score > worst.score ||
      (score === worst.score && offMiddle < worst.offMiddle)
    ) {
      worst = { id, score, offMiddle };
    }
  }
  return worst?.id;
};
