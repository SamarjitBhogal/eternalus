import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { EffectShape } from '../content/abilities/AbilityDefinition.types';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { WorldObjectStore } from '../state/WorldObjectStore';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { casterState, unitsWithWarriorKit } from './__fixtures__/casterState';
import { testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { TargetQuery } from './TargetQuery';

const DISC = { kind: 'circle', radius: 5 } as const;
const ON_CASTER = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };

const setUp = () => {
  const { state, factory, caster } = casterState();
  const add = (kind: string, definitionId: string, team: Team, position: Vec2) => {
    const entity = factory.create(kind, definitionId, { position, team });
    state.entities.add(entity);
    return entity;
  };
  const query = new TargetQuery(testAbilityRegistry([]));
  return { state, caster, add, query };
};

/** A village house, 14 m by 18 m (`MapVillageBuilder`), its west wall `gap` metres east of the origin. */
const houseEastOf = (gap: number): MapObject => ({
  id: 'house-1',
  kind: 'house',
  isBlocking: true,
  footprints: [
    [
      { x: gap, y: -9 },
      { x: gap + 14, y: -9 },
      { x: gap + 14, y: 9 },
      { x: gap, y: 9 },
    ],
  ],
});

/**
 * A light Warrior at the origin and `house`, placed as a match places map objects
 * (`WorldObjectStore`: an obstacle entity at the footprint's centre, with a `MapObjectBody`).
 */
const withHouse = (house: MapObject) => {
  const units = unitsWithWarriorKit();
  const { house: houseDefinition } = MAP_OBJECT_DEFINITIONS;
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    {
      has: (id) => id === houseDefinition.id || units.has(id),
      get: (id) => (id === houseDefinition.id ? houseDefinition : units.get(id)),
    },
    undefined,
    loadWeapons(30),
  );
  const state = new GameState(createDefaultGameConfig(), 1);
  const caster = factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' });
  state.entities.add(caster);
  const world = new WorldObjectStore([house], factory, state.entities, MAP_OBJECT_DEFINITIONS);
  const houseId = world.snapshot()[0]?.entityId;
  const query = new TargetQuery(testAbilityRegistry([]));
  const hits = (shape: EffectShape, from: Vec2, to: Vec2) =>
    query.find(state, caster.id, shape, { from, to }, { team: 'enemies' });
  return { houseId, hits };
};

describe('TargetQuery', () => {
  it('finds the live entities in the shape, enemies or allies of the caster, sorted by id', () => {
    const { state, caster, add, query } = setUp();
    const enemies = Array.from({ length: 10 }, () =>
      add('light-mob', 'training-dummy', 'dark', { x: 1, y: 0 }),
    ).map(({ id }) => id); // entity-2 .. entity-11
    const ally = add('warrior', 'warrior', 'light', { x: 0, y: 1 });
    add('light-mob', 'training-dummy', 'dark', { x: 20, y: 0 }); // out of reach
    const tower = add('buff-tower', 'buff-tower', 'dark', { x: 2, y: 2 });
    add('light-mob', 'training-dummy', 'dark', { x: 2, y: 0 })
      .getComponent(Health)
      .applyDamage(1e9);

    const foes = query.find(state, caster.id, DISC, ON_CASTER, { team: 'enemies' });
    const friends = query.find(state, caster.id, DISC, ON_CASTER, { team: 'allies' });
    const everyone = query.find(state, caster.id, DISC, ON_CASTER, {
      team: 'all',
      includeSelf: true,
    });

    // String order: entity-10 and entity-11 sort before entity-2.
    expect(foes).toEqual([...enemies, tower.id].sort());
    expect(foes[0]).toBe('entity-10');
    expect(friends).toEqual([ally.id]);
    expect(everyone).toContain(caster.id);
    expect(everyone).toHaveLength(foes.length + 2);
  });

  it('leaves the caster out unless the filter includes it', () => {
    const { state, caster, query } = setUp();

    expect(query.find(state, caster.id, DISC, ON_CASTER, { team: 'all' })).toEqual([]);
    expect(
      query.find(state, caster.id, DISC, ON_CASTER, { team: 'allies', includeSelf: true }),
    ).toEqual([caster.id]);
  });

  it('hits a house by its walls, not its centre: a 4 m circle 1.5 m outside the west wall', () => {
    const near = withHouse(houseEastOf(1.5));
    const far = withHouse(houseEastOf(4.5));
    const origin = { x: 0, y: 0 };

    expect(near.houseId).toBeDefined();
    expect(near.hits({ kind: 'circle', radius: 4 }, origin, origin)).toEqual([near.houseId]);
    expect(far.hits({ kind: 'circle', radius: 4 }, origin, origin)).toEqual([]);
  });

  it('hits a house a path passes beside or crosses, measured to its walls', () => {
    const { houseId, hits } = withHouse(houseEastOf(1.5));
    const path = (width: number): EffectShape => ({ kind: 'path', width });

    // 2 m south of the south wall, the house's centre 11 m away.
    expect(hits(path(5), { x: 0, y: -11 }, { x: 20, y: -11 })).toEqual([houseId]);
    expect(hits(path(3), { x: 0, y: -11 }, { x: 20, y: -11 })).toEqual([]);
    // Straight through the house, both ends and every corner far from the line.
    expect(hits(path(1), { x: 5, y: -30 }, { x: 5, y: 30 })).toEqual([houseId]);
  });
});
