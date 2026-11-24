import { describe, expect, it } from 'vitest';

import type { SummonSpec } from '../../content/abilities/AbilityDefinition.types';
import { OBSTACLE_DEFINITIONS } from '../../content/obstacles/obstacleCatalogue';
import { GameState } from '../../state/GameState';
import type { PlacedWalls } from '../../state/PlacedWalls.types';
import type { Polygon } from '../../utils/geometry.types';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { RecordingSummoner } from '../__fixtures__/RecordingSummoner';
import { SummonEffect } from './SummonEffect';

/** Shield Wall's step: the barrier 3 m ahead, at most 2 per caster. */
const WALL: SummonSpec = {
  kind: 'summon',
  definitionId: 'shield-wall-barrier',
  distance: 3,
  maxActive: 2,
};

/** Walls that record each outline asked about and call every outline blocked or none. */
const wallsThatSay = (isBlocked: boolean) => {
  const asked: Polygon[] = [];
  const walls: PlacedWalls = {
    isBlocked: (outline) => {
      asked.push(outline);
      return isBlocked;
    },
    add: () => undefined,
    remove: () => undefined,
  };
  return { walls, asked };
};

/** The caster state's caster on a state with `walls`. */
const casterOn = (walls: PlacedWalls) => {
  const { state: plain, caster } = casterState();
  const state = new GameState(plain.config, 1, null, { walls });
  state.entities.add(caster);
  return { state, caster };
};

describe('SummonEffect', () => {
  const effect = new SummonEffect(OBSTACLE_DEFINITIONS);

  it('has the kind it is registered under', () => {
    expect(effect.kind).toBe('summon');
  });

  it('describes the outline it places, its distance ahead, for the overlay', () => {
    expect(effect.describe(WALL)).toEqual([
      {
        kind: 'summon',
        shape: {
          kind: 'outline',
          corners: OBSTACLE_DEFINITIONS.get('shield-wall-barrier').footprint,
          distance: 3,
        },
      },
    ]);
  });

  it('describes nothing for a body with no outline', () => {
    const plain = new SummonEffect({ has: () => true, get: () => ({}) });

    expect(plain.describe(WALL)).toEqual([]);
  });

  it('checks its own fields: a known body, a distance of 0 or more, a whole cap of 1 or more', () => {
    expect(effect.validate(WALL)).toEqual([]);
    expect(
      effect.validate({ ...WALL, definitionId: 'no-such-body', distance: -1, maxActive: 0 }),
    ).toEqual([
      'summon definition "no-such-body" is unknown',
      'summon distance must not be negative',
      'summon maxActive must be positive',
    ]);
    expect(effect.validate({ ...WALL, maxActive: 1.5 })).toEqual([
      'summon maxActive must be a whole number',
    ]);
  });

  it('places the body the distance ahead along the aim, facing it, and records it for the caster', () => {
    const { state, caster } = casterState();
    const summoner = new RecordingSummoner();

    castSteps(state, caster.id, [WALL], { aim: { x: 0, y: 5 }, summoner });

    expect(summoner.summoned).toEqual([
      {
        definitionId: 'shield-wall-barrier',
        placement: { position: { x: 0, y: 3 }, facing: { x: 0, y: 1 } },
      },
    ]);
    expect(state.summons.placedBy(caster.id, 'shield-wall-barrier')).toEqual(['summoned-1']);
  });

  it('removes the oldest body over the cap before it places a new one', () => {
    const { state, caster } = casterState();
    const summoner = new RecordingSummoner();

    for (let cast = 0; cast < 3; cast += 1) castSteps(state, caster.id, [WALL], { summoner });

    expect(summoner.despawned).toEqual(['summoned-1']);
  });

  it('removes none when a body that left the world freed its place', () => {
    const { state, caster } = casterState();
    const summoner = new RecordingSummoner();
    castSteps(state, caster.id, [WALL], { summoner });
    castSteps(state, caster.id, [WALL], { summoner });

    state.events.emit('entity-removed', { entityId: 'summoned-1', cause: 'died' });
    castSteps(state, caster.id, [WALL], { summoner });

    expect(summoner.despawned).toEqual([]);
    expect(state.summons.placedBy(caster.id, 'shield-wall-barrier')).toEqual([
      'summoned-2',
      'summoned-3',
    ]);
  });

  it('refuses an aim whose outline the walls call blocked, asking about the outline it would place', () => {
    const blocked = wallsThatSay(true);
    const { state, caster } = casterOn(blocked.walls);

    expect(
      effect.aimBlockedBy(WALL, { point: { x: 10, y: 0 }, targetId: null }, caster.id, state),
    ).toBe('no-target');
    expect(blocked.asked).toEqual([
      [
        { x: 2.5, y: -2 },
        { x: 3.5, y: -2 },
        { x: 3.5, y: 2 },
        { x: 2.5, y: 2 },
      ],
    ]);
  });

  it('takes any aim the walls leave room for, and every aim with no walls (no map objects)', () => {
    const open = casterOn(wallsThatSay(false).walls);
    const plain = casterState();
    const aim = { point: { x: 10, y: 0 }, targetId: null };

    expect(effect.aimBlockedBy(WALL, aim, open.caster.id, open.state)).toBeNull();
    expect(effect.aimBlockedBy(WALL, aim, plain.caster.id, plain.state)).toBeNull();
  });
});
