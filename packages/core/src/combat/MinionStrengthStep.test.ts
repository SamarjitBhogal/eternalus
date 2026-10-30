import { describe, expect, it } from 'vitest';

import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MINION_STRENGTH } from '../content/mobs/minionModifiers';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { MinionStrengthStep } from './MinionStrengthStep';

/** The shipped curve with `balancing.md`'s 0.75 floor, so the far end shows the clamp. */
const CURVE = { ...MINION_STRENGTH, min: 0.75 };

/** A light minion in a light horde on lane-0 (160 m from x 20 to x 180), and a Warrior. */
const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const minion = factory.create('light-mob', 'light-minion', {
    team: 'light',
    position: { x: 20, y: 20 },
  });
  const legend = factory.create('warrior', 'warrior', { team: 'dark', position: { x: 0, y: 0 } });
  state.entities.add(minion);
  state.entities.add(legend);
  state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds: [minion.id],
    progress: 0,
  });
  const walk = (x: number) => {
    minion.getComponent(Transform).moveTo({ x, y: 20 });
  };
  return { state, minion: minion.id, legend: legend.id, walk };
};

describe('MinionStrengthStep', () => {
  it('follows m(t) = clamp(1 + k(1 − 2t)): 1.5 at home, 1 mid-lane, clamped at the far end', () => {
    const { state, minion, legend, walk } = setUp();
    const step = new MinionStrengthStep(CURVE);
    const hit = (from: string, to: string) =>
      step.adjust(
        {
          targetId: to,
          amount: 100,
          source: { attackerId: from, kind: 'weapon', definitionId: 'x' },
        },
        state,
      );

    expect(hit(minion, legend)).toBeCloseTo(150);
    expect(hit(legend, minion)).toBeCloseTo(100 / 1.5);
    walk(60);
    expect(hit(minion, legend)).toBeCloseTo(125);
    walk(100);
    expect(hit(minion, legend)).toBeCloseTo(100);
    walk(180);
    expect(hit(minion, legend)).toBeCloseTo(75);
  });

  it('never goes below base stats with the shipped curve (DISC-24), and leaves Legends at 1', () => {
    const { state, minion, legend, walk } = setUp();
    const step = new MinionStrengthStep(MINION_STRENGTH);
    walk(180);

    expect(
      step.adjust(
        {
          targetId: legend,
          amount: 100,
          source: { attackerId: minion, kind: 'weapon', definitionId: 'x' },
        },
        state,
      ),
    ).toBeCloseTo(100);
    expect(
      step.adjust(
        {
          targetId: legend,
          amount: 40,
          source: { attackerId: null, kind: 'status', definitionId: 'x' },
        },
        state,
      ),
    ).toBe(40);
  });

  it('moves the base-stat point toward the enemy per tower the enemy lost (DISC-24), capped', () => {
    const { state, minion, legend, walk } = setUp();
    const step = new MinionStrengthStep(MINION_STRENGTH);
    const hit = () =>
      step.adjust(
        {
          targetId: legend,
          amount: 100,
          source: { attackerId: minion, kind: 'weapon', definitionId: 'x' },
        },
        state,
      );
    walk(100);

    // Its own losses never shift its point: still base stats at mid-lane.
    state.teams.light.towersLostByLane['lane-0'] = 2;
    expect(hit()).toBeCloseTo(100);
    // One dark loss: the base-stat point moves to 0.6, so mid-lane is 1 + 0.5 · (1 − 0.5 / 0.6).
    state.teams.dark.towersLostByLane['lane-0'] = 1;
    expect(hit()).toBeCloseTo(100 * (1 + 0.5 * (1 - 0.5 / 0.6)));
    // Home strength does not change.
    walk(20);
    expect(hit()).toBeCloseTo(150);
    // Nine losses would pass the cap: the point stops at maxBasePoint (0.9).
    state.teams.dark.towersLostByLane['lane-0'] = 9;
    walk(100);
    expect(hit()).toBeCloseTo(100 * (1 + 0.5 * (1 - 0.5 / 0.9)));
    // A loss on another lane changes nothing here.
    state.teams.dark.towersLostByLane = { 'lane-1': 3 };
    expect(hit()).toBeCloseTo(100);
  });

  it('refuses a base-stat point outside the lane', () => {
    expect(() => new MinionStrengthStep({ ...MINION_STRENGTH, basePoint: 0 })).toThrow('basePoint');
    expect(() => new MinionStrengthStep({ ...MINION_STRENGTH, maxBasePoint: 0.4 })).toThrow(
      'basePoint',
    );
  });

  it('is 1 for everyone in a match without a map', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const step = new MinionStrengthStep(CURVE);

    expect(
      step.adjust(
        {
          targetId: 'a',
          amount: 10,
          source: { attackerId: 'b', kind: 'weapon', definitionId: 'x' },
        },
        state,
      ),
    ).toBe(10);
  });
});
