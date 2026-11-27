import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import type { SummonSpec } from '../../content/abilities/AbilityDefinition.types';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { OBSTACLE_DEFINITIONS } from '../../content/obstacles/obstacleCatalogue';
import type { ObstacleDefinition } from '../../content/obstacles/obstacles.types';
import { SHIELD_WALL_BARRIER } from '../../content/obstacles/shieldWallBarrier';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntitySummoner } from '../../entities/EntitySummoner';
import type { GameEventMap } from '../../state/GameEvents.types';
import { GameState } from '../../state/GameState';
import type { PlacedWalls } from '../../state/PlacedWalls.types';
import type { Polygon } from '../../utils/geometry.types';
import { IdGenerator } from '../../utils/IdGenerator';
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

/** The Shield Wall barrier and a second body like it, so a test can place two definitions. */
const BODIES = new ContentCatalogue<ObstacleDefinition>([
  SHIELD_WALL_BARRIER,
  { ...SHIELD_WALL_BARRIER, id: 'other-barrier' },
]);

/**
 * The caster state with a real summoner, whose bodies take the ids `entity-101`, `entity-102`, ...
 * in the order they are placed. `despawned` lists each body the summoner takes out; `place` puts a
 * body for `ownerId` straight into the match (not through a cast).
 */
const placing = () => {
  const { state, caster } = casterState();
  const summoner = new EntitySummoner(
    new EntityFactory(createDefaultEntityRegistry(), BODIES, new IdGenerator(100)),
  );
  const despawned: string[] = [];
  state.events.on('entity-removed', ({ entityId }) => despawned.push(entityId));
  const place = (ownerId: string, definitionId = WALL.definitionId): string =>
    summoner.summon(
      state,
      definitionId,
      { position: { x: 0, y: 3 }, facing: { x: 1, y: 0 } },
      ownerId,
    ).bodyId;
  return { state, caster, summoner, despawned, place };
};

/** The ids of the Shield Wall barriers in the store, in store order. */
const standing = (state: GameState): string[] => {
  const ids: string[] = [];
  state.entities.forEach((entity) => {
    if (entity.definitionId === WALL.definitionId) ids.push(entity.id);
  });
  return ids;
};

/** The caster state's caster on a state with `walls`. */
const casterOn = (walls: PlacedWalls) => {
  const { state: plain, caster } = casterState();
  const state = new GameState(plain.config, 1, null, { walls });
  state.entities.add(caster);
  return { state, caster };
};

describe('SummonEffect', () => {
  const effect = new SummonEffect(OBSTACLE_DEFINITIONS, 40);

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
    const plain = new SummonEffect({ has: () => true, get: () => ({}) }, 40);

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

  it('places the body the distance ahead along the aim, facing it, owned by the caster', () => {
    const { state, caster } = casterState();
    const summoner = new RecordingSummoner();

    castSteps(state, caster.id, [WALL], { aim: { x: 0, y: 5 }, summoner });

    expect(summoner.summoned).toEqual([
      {
        definitionId: 'shield-wall-barrier',
        placement: { position: { x: 0, y: 3 }, facing: { x: 0, y: 1 } },
        ownerId: caster.id,
      },
    ]);
  });

  it('removes the oldest body over the cap before it places a new one', () => {
    const { state, caster, summoner, despawned } = placing();

    for (let cast = 0; cast < 3; cast += 1) castSteps(state, caster.id, [WALL], { summoner });

    expect(despawned).toEqual(['entity-101']);
    expect(standing(state)).toEqual(['entity-102', 'entity-103']);
  });

  it('counts only the caster’s own standing bodies of its definition, oldest first (DEC-382, HC-B43 (3))', () => {
    const { state, caster, summoner, despawned, place } = placing();
    const a = place(caster.id);
    const b = place('entity-50');
    const other = place(caster.id, 'other-barrier');
    const c = place(caster.id);

    castSteps(state, caster.id, [WALL], { summoner });

    expect(despawned).toEqual([a]);
    expect([b, other, c].every((id) => state.entities.has(id))).toBe(true);
  });

  it('removes none when a body that left the world freed its place', () => {
    const { state, caster, summoner, despawned } = placing();
    castSteps(state, caster.id, [WALL], { summoner });
    castSteps(state, caster.id, [WALL], { summoner });

    state.entities.remove('entity-101', 'died');
    castSteps(state, caster.id, [WALL], { summoner });

    expect(despawned).toEqual([]);
    expect(standing(state)).toEqual(['entity-102', 'entity-103']);
  });

  it('removes none when a body broke this tick and still waits in the store (DEC-382, HC-B43 (9))', () => {
    const { state, caster, summoner, despawned } = placing();
    castSteps(state, caster.id, [WALL], { summoner });
    castSteps(state, caster.id, [WALL], { summoner });
    const broken = state.entities.get('entity-101')?.getComponent(Health);
    broken?.applyDamage(broken.current);

    castSteps(state, caster.id, [WALL], { summoner });

    expect(despawned).toEqual([]);
    expect(standing(state)).toEqual(['entity-101', 'entity-102', 'entity-103']);
  });

  it('deals each pinned enemy the impact damage, 40, credited to the caster; a pinned ally takes none (DEC-382, HC-B43 (6))', () => {
    const { state, factory, caster } = casterState();
    const spawn = (team: 'light' | 'dark', x: number) => {
      const unit = factory.create('warrior', 'warrior', { position: { x, y: 3 }, team });
      state.entities.add(unit);
      return unit;
    };
    const enemy = spawn('dark', 1);
    const ally = spawn('light', -1);
    const hits: GameEventMap['damage-applied'][] = [];
    state.events.on('damage-applied', (hit) => hits.push(hit));

    castSteps(state, caster.id, [WALL], {
      summoner: new RecordingSummoner([enemy.id, ally.id]),
    });

    expect(hits).toEqual([
      {
        targetId: enemy.id,
        amount: 40,
        absorbed: 0,
        source: { attackerId: caster.id, kind: 'ability', definitionId: 'test-cast' },
      },
    ]);
    expect(ally.getComponent(Health).current).toBe(ally.getComponent(Health).max);
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
