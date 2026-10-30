import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import type { MapDefinition } from '../content/maps/maps.types';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { GameState } from './GameState';
import type { PlayableTeam } from '../teams/teams.types';
import { Health } from '../components/Health';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { IdGenerator } from '../utils/IdGenerator';
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

  it('scores structure damage not dealt and structures lost (the 18 §3.3 worked example)', () => {
    /** Three SpawnerTowers (3,000 health each) per team on every lane, then indexed. */
    const withTowers = (state: GameState) => {
      const factory = new EntityFactory(
        createDefaultEntityRegistry(),
        STRUCTURE_DEFINITIONS,
        new IdGenerator(1000),
      );
      const towers = new Map<string, string[]>();
      for (const lane of state.routes?.lanes ?? []) {
        for (const team of ['light', 'dark'] as const) {
          const ids = [20, 30, 40].map((x) => {
            const position = { x: team === 'light' ? x : 100 - x, y: lane.index * 10 };
            const entity = factory.create('spawner-tower', 'spawner-tower', {
              team,
              position,
              laneId: lane.id,
            });
            state.entities.add(entity);
            return entity.id;
          });
          towers.set(`${lane.id}:${team}`, ids);
        }
      }
      state.indexStructures();
      const halve = (key: string) => {
        for (const id of towers.get(key) ?? []) {
          state.entities.get(id)?.getComponent(Health).applyDamage(1500);
        }
      };
      return { towers, halve };
    };
    // Light lost 1 of 3 on lane-0, a Dark horde is 80 % down it; Light halved Dark's lane-2.
    const first = stateWith(3, [['lane-0', 'dark', 80]]);
    const one = withTowers(first);
    first.entities.remove(one.towers.get('lane-0:light')?.[0] ?? '', 'died');
    one.halve('lane-2:dark');
    // Dark hordes 75 % down lane-0 and lane-2; Light halved Dark's lane-1.
    const second = stateWith(3, [
      ['lane-0', 'dark', 75],
      ['lane-2', 'dark', 75],
    ]);
    withTowers(second).halve('lane-1:dark');

    expect(assessLanes(first, 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-0');
    expect(assessLanes(second, 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-0');
    // Damage dealt alone makes a lane better off: halving Dark's lane-1 moves Light off it.
    const third = stateWith(3, []);
    withTowers(third).halve('lane-1:dark');
    expect(assessLanes(third, 'light', LANE_ASSESSMENT_WEIGHTS)).toBe('lane-0');
  });

  it('has no answer without a map', () => {
    const state = new GameState(createDefaultGameConfig(), 1);

    expect(assessLanes(state, 'light', LANE_ASSESSMENT_WEIGHTS)).toBeUndefined();
  });
});
