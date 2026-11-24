import { describe, expect, it } from 'vitest';

import { Deploying } from '../components/Deploying';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { OBSTACLE_DEFINITIONS } from '../content/obstacles/obstacleCatalogue';
import type { MapDefinition } from '../content/maps/maps.types';
import { RuntimeWalls } from '../map/RuntimeWalls';
import { WorldMap } from '../map/WorldMap';
import { CollisionResolver } from '../physics/CollisionResolver';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import { GameState } from '../state/GameState';
import type { Polygon } from '../utils/geometry.types';
import { createDefaultEntityRegistry } from './defaultEntityRegistry';
import { EntityFactory } from './EntityFactory';
import { EntitySummoner } from './EntitySummoner';

const UNITS = loadDefaultContent(30);
const BOUNDS = { x: 0, y: 0, width: 40, height: 20 };
const EMPTY_MAP: MapDefinition = {
  id: 'empty',
  displayName: 'Empty',
  width: 40,
  height: 20,
  seed: 0,
  lanes: [],
  terrain: [],
  features: [],
};
/** A rock from x 14 to 15 and y 0 to 20: east of the walls the tests place. */
const ROCK: Polygon = [
  { x: 14, y: 0 },
  { x: 15, y: 0 },
  { x: 15, y: 20 },
  { x: 14, y: 20 },
];

/** A state with the rock as its one wall, placed walls on it, a factory and a summoner. */
const setUp = () => {
  const index = new StaticCollisionIndex([{ id: 'rock', polygon: ROCK }]);
  const grid = WorldMap.fromDefinition(EMPTY_MAP, 1, () => false);
  const changed: (readonly number[])[] = [];
  const walls = new RuntimeWalls(index, grid, BOUNDS, (cells) => changed.push(cells));
  const state = new GameState(createDefaultGameConfig(), 1, null, {
    walls,
    collisions: new CollisionResolver(index, BOUNDS),
  });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    {
      has: (id) => UNITS.has(id) || OBSTACLE_DEFINITIONS.has(id),
      get: (id) => (OBSTACLE_DEFINITIONS.has(id) ? OBSTACLE_DEFINITIONS.get(id) : UNITS.get(id)),
    },
    undefined,
    loadWeapons(30),
  );
  const warriorAt = (x: number, y: number) => {
    const warrior = factory.create('warrior', 'warrior', { position: { x, y }, team: 'dark' });
    state.entities.add(warrior);
    return warrior;
  };
  return { state, grid, changed, summoner: new EntitySummoner(factory), warriorAt };
};

/** The Shield Wall barrier 3 m east of (10, 10), its long side north to south. */
const EAST_OF_TEN = { position: { x: 13, y: 10 }, facing: { x: 1, y: 0 } };

describe('EntitySummoner', () => {
  it('adds the body facing its way, with its outline and health, and announces it as neutral', () => {
    const { state, summoner } = setUp();
    const spawned: string[] = [];
    state.events.on('entity-spawned', ({ entityId, kind, team }) =>
      spawned.push(`${entityId} ${kind} ${team}`),
    );

    const id = summoner.summon(state, 'shield-wall-barrier', EAST_OF_TEN);

    const body = state.entities.get(id);
    expect(spawned).toEqual([`${id} obstacle neutral`]);
    expect(body?.getComponent(Transform).facing).toEqual({ x: 1, y: 0 });
    expect(body?.getComponent(Health).max).toBe(800);
    expect(body?.getComponent(Footprint).polygons).toEqual([
      [
        { x: 12.5, y: 8 },
        { x: 13.5, y: 8 },
        { x: 13.5, y: 12 },
        { x: 12.5, y: 12 },
      ],
    ]);
  });

  it('makes its outline a wall: the walls call it blocked and its cells unwalkable', () => {
    const { state, grid, changed, summoner } = setUp();

    summoner.summon(state, 'shield-wall-barrier', EAST_OF_TEN);

    expect(state.walls?.isBlocked(EAST_OF_TEN_BOX)).toBe(true);
    expect(grid.isWalkableAt(13, 10)).toBe(false);
    expect(changed).toHaveLength(1);
  });

  it('pushes a unit it covers out of its outline the shortest way, and one beside it not at all', () => {
    const { state, summoner, warriorAt } = setUp();
    const inside = warriorAt(12.8, 10);
    const beside = warriorAt(11, 10);

    summoner.summon(state, 'shield-wall-barrier', EAST_OF_TEN);

    expect(inside.getComponent(Transform).position.x).toBeCloseTo(12.5 - 0.5, 5);
    expect(beside.getComponent(Transform).position).toEqual({ x: 11, y: 10 });
  });

  it('leaves a mob walking out of its structure where it stands: walls do not stop it (DEC-133)', () => {
    const { state, summoner, warriorAt } = setUp();
    const deploying = warriorAt(12.8, 10);
    deploying.addComponent(new Deploying({ x: 0, y: 10 }));

    summoner.summon(state, 'shield-wall-barrier', EAST_OF_TEN);

    expect(deploying.getComponent(Transform).position).toEqual({ x: 12.8, y: 10 });
  });

  it('stops a push at another wall, short of it', () => {
    const { state, summoner, warriorAt } = setUp();
    const trapped = warriorAt(13.4, 10);

    summoner.summon(state, 'shield-wall-barrier', EAST_OF_TEN);

    expect(trapped.getComponent(Transform).position.x).toBeLessThan(14 - 0.5);
  });

  it('takes a body out as despawned and announces it', () => {
    const { state, summoner } = setUp();
    const removed: string[] = [];
    state.events.on('entity-removed', ({ entityId, cause }) =>
      removed.push(`${entityId} ${cause}`),
    );
    const id = summoner.summon(state, 'shield-wall-barrier', EAST_OF_TEN);

    summoner.despawn(state, id);

    expect(state.entities.has(id)).toBe(false);
    expect(removed).toEqual([`${id} despawned`]);
  });
});

/** A small box inside the wall `EAST_OF_TEN` places. */
const EAST_OF_TEN_BOX: Polygon = [
  { x: 12.9, y: 9.9 },
  { x: 13.1, y: 9.9 },
  { x: 13.1, y: 10.1 },
  { x: 12.9, y: 10.1 },
];
