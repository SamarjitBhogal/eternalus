import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition, MapFeature } from '../content/maps/maps.types';
import type { PlayableTeam } from '../teams/teams.types';
import { matchWorldOf } from './__fixtures__/matchWorld';
import { spawnMapStructures } from './__fixtures__/spawnMapStructures';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { GameState } from './GameState';
import { LaneStructures } from './LaneStructures';

const GLYPH = { shape: 'dot', size: 1, colourRole: 'team' } as const;

const darkOnLane0 = (id: string, kind: MapFeature['kind'], x: number): MapFeature => ({
  id,
  kind,
  team: 'dark',
  definitionId: kind,
  position: { x, y: 20 },
  minimapGlyph: GLYPH,
  laneId: 'lane-0',
});

/**
 * The two-lane map with a second dark tower and a dark gate on lane-0 (x 20 to 180), their ids
 * sorting against their place on the lane, so only the marching order can put them right.
 */
const MAP: MapDefinition = {
  ...TWO_LANE_MAP,
  features: [
    ...TWO_LANE_MAP.features,
    darkOnLane0('a-gate-dark-0', 'gate', 170),
    darkOnLane0('z-tower-dark-0', 'spawner-tower', 120),
  ],
};

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(MAP));
  spawnMapStructures(state);
  /** The structure of `team` standing at x `x` (each test structure has its own x). */
  const at = (team: PlayableTeam, x: number) => {
    let found: string | undefined;
    state.entities.forEach((entity) => {
      if (
        state.entities.teamOf(entity.id) === team &&
        entity.findComponent(Transform)?.position.x === x
      ) {
        found = entity.id;
      }
    });
    if (found === undefined) {
      throw new Error(`no ${team} structure at x ${String(x)}`);
    }
    return found;
  };
  const destroy = (id: string) => {
    state.entities.get(id)?.getComponent(Health).applyDamage(1e9);
  };
  const objective = (attacker: PlayableTeam, lane = 'lane-0') =>
    state.laneStructures.objectiveFor(lane, attacker, state.entities);
  return { state, at, destroy, objective };
};

describe('LaneStructures (architecture 18 §6.2)', () => {
  it('gives the standing enemy structures in marching order, the Stronghold last, then null', () => {
    const { at, destroy, objective } = setUp();
    const order = [at('dark', 120), at('dark', 140), at('dark', 170), at('dark', 190)];

    const seen: (string | undefined)[] = [];
    for (const id of order) {
      seen.push(objective('light')?.id);
      destroy(id);
    }

    expect(seen).toEqual(order);
    expect(objective('light')).toBeNull();
  });

  it('places an objective by its distance from the attacker’s end, the Stronghold at the lane’s end', () => {
    const { at, destroy, objective } = setUp();

    // lane-0 runs 160 m from x 20; light's first objective, the tower at x 120, is 100 m along.
    const tower = objective('light');
    expect(tower).toMatchObject({ kind: 'spawner-tower', progress: 100 });
    expect(tower?.frontProgress).toBe(100 - (tower?.radius ?? 0));
    // Dark marches from x 180: light's tower at x 60 is 120 m along.
    expect(objective('dark')).toMatchObject({ kind: 'spawner-tower', progress: 120 });

    [120, 140, 170].forEach((x) => {
      destroy(at('dark', x));
    });
    expect(objective('light')).toMatchObject({
      kind: 'stronghold',
      progress: 160,
      frontProgress: 160,
    });
  });

  it('reports a gate unbreakable until its collider says otherwise', () => {
    const { state, at, destroy, objective } = setUp();
    destroy(at('dark', 120));
    destroy(at('dark', 140));
    const gate = at('dark', 170);

    expect(objective('light')).toMatchObject({ id: gate, isBreakable: false });

    state.entities.get(gate)?.getComponent(Collider).setUnbreakable(false);
    expect(objective('light')).toMatchObject({ id: gate, isBreakable: true });
  });

  it('counts a team’s fallen structures of one kind', () => {
    const { state, at, destroy } = setUp();
    destroy(at('dark', 120));
    destroy(at('dark', 150));

    expect(state.laneStructures.lostCount('dark', 'spawner-tower', state.entities)).toBe(1);
    expect(state.laneStructures.lostCount('dark', 'buff-tower', state.entities)).toBe(1);
    expect(state.laneStructures.lostCount('light', 'spawner-tower', state.entities)).toBe(0);
  });

  it('lists a team’s structures on a lane in id order, without the Stronghold', () => {
    const { state, at } = setUp();

    expect(state.laneStructures.onLane('lane-0', 'dark').map(({ id }) => id)).toEqual(
      [at('dark', 170), at('dark', 140), at('dark', 120)].sort(),
    );
    expect(state.laneStructures.onLane('lane-1', 'light').map(({ kind }) => kind)).toEqual([
      'buff-tower',
    ]);
  });

  it('is empty without a map', () => {
    const state = new GameState(createDefaultGameConfig(), 1);

    expect(LaneStructures.EMPTY.objectiveFor('lane-0', 'light', state.entities)).toBeNull();
    expect(LaneStructures.EMPTY.onLane('lane-0', 'light')).toEqual([]);
  });
});
