import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import type { MapDefinition } from '../content/maps/maps.types';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { GameState } from './GameState';
import type { PlayableTeam } from '../teams/teams.types';
import { assessLanes } from './LaneAssessment';

/** `count` straight lanes of length 100, `lane-0` … `lane-{count - 1}`. */
const mapWithLanes = (count: number): MapDefinition => ({
  ...TWO_LANE_MAP,
  lanes: Array.from({ length: count }, (_, index) => ({
    id: `lane-${String(index)}`,
    index,
    path: [
      { x: 0, y: index * 10 },
      { x: 100, y: index * 10 },
    ],
  })),
});

const stateWith = (lanes: number, hordes: readonly [string, PlayableTeam, number][]) => {
  const state = new GameState(createDefaultGameConfig(), 1, mapWithLanes(lanes));
  hordes.forEach(([lane, team, progress], index) => {
    state.hordes.add({
      id: `horde-${String(index)}`,
      team,
      weightClass: 'light',
      lane,
      formationId: 'ranks',
      memberIds: [`entity-${String(index)}`],
      progress,
    });
  });
  return state;
};

describe('assessLanes', () => {
  it('picks the middle lane when every lane ties, as at match start', () => {
    expect(assessLanes(stateWith(3, []), 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-1');
    expect(assessLanes(stateWith(5, []), 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-2');
  });

  it('picks the lane an enemy horde has pushed deepest past the midpoint', () => {
    // A Dark horde 80 % down lane-0 and one only 40 % down lane-2 (still on its own half).
    const state = stateWith(3, [
      ['lane-0', 'dark', 80],
      ['lane-2', 'dark', 40],
      ['lane-1', 'light', 90],
    ]);

    expect(assessLanes(state, 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-0');
    // Light's own horde never counts against Light; for Dark it is the deepest push.
    expect(assessLanes(state, 'dark', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-1');
  });

  it('breaks a tie between lanes equally far from the middle toward the lower index', () => {
    const three = stateWith(3, [
      ['lane-0', 'dark', 75],
      ['lane-2', 'dark', 75],
    ]);
    const five = stateWith(5, [
      ['lane-1', 'dark', 75],
      ['lane-3', 'dark', 75],
    ]);

    expect(assessLanes(three, 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-0');
    expect(assessLanes(five, 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-1');
  });

  it('has no answer without a map', () => {
    const state = new GameState(createDefaultGameConfig(), 1);

    expect(assessLanes(state, 'light', LANE_ASSESSMENT_WEIGHTS)).toBeUndefined();
  });
});
