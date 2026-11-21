import { describe, expect, it } from 'vitest';
import { GameState } from '../state/GameState';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import {
  MAP_OBJECT_DEFINITIONS,
  RUINED_FORT_WALL_DEFINITION,
} from '../content/maps/mapObjectDefinitions';
import { DamagePipeline } from '../combat/DamagePipeline';
import { fixtureFactory } from '../state/__fixtures__/fortTower';
import { MapDestructionSystem } from './MapDestructionSystem';
import { DeathSystem } from './DeathSystem';
import { NullLogger } from '../diagnostics/NullLogger';
import type { MapObject } from '../content/maps/mapObjects.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { MatchGrid } from '../map/MatchGrid';
import { MatchWorld } from '../state/MatchWorld';

describe('MapDestructionSystem', () => {
  it('destroys owned walls through attributed damage and leaves all contents walkable after retirement', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const definitions = new Map(
      Object.values(MAP_OBJECT_DEFINITIONS).map((definition) => [definition.id, definition]),
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), {
      has: (id) => definitions.has(id),
      get: (id) => {
        const definition = definitions.get(id);
        if (definition === undefined) throw new Error('Unknown fixture');
        return definition;
      },
    });
    const parent: MapObject = {
      id: 'palace',
      kind: 'stronghold',
      isBlocking: false,
      footprints: [
        [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
        ],
      ],
    };
    state.worldObjects = new WorldObjectStore({
      objects: [
        parent,
        { ...parent, id: 'wall', kind: 'wall', isBlocking: true, buildingId: 'palace' },
      ],
      factory,
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
    state.events.on('entity-removed', ({ entityId }) => state.worldObjects?.removed(entityId));
    const damage = new DamagePipeline();
    const collapse = new MapDestructionSystem({
      state,
      damage,
      flowFields: null,
      ruinWall: RUINED_FORT_WALL_DEFINITION,
    });
    const hits: string[] = [];
    state.events.on('entity-died', ({ entityId }) => hits.push(entityId));
    const id = state.worldObjects.snapshot()[0]?.entityId ?? '';
    damage.apply(state, id, 10000, { attackerId: null, kind: 'environment', definitionId: 'test' });
    collapse.update({ state, logger: new NullLogger() });
    new DeathSystem().update({ state, logger: new NullLogger() });
    expect(hits).toHaveLength(2);
    expect(state.entities.size).toBe(0);
    expect(state.worldObjects.snapshot().every((o) => o.isDestroyed)).toBe(true);
  });

  it('reopens the grid under a retired blocking object without lane flow fields: A* reads the grid too (07 §10)', () => {
    const map = { ...BLOCKED_LANE_MAP, terrain: [] };
    const rock: MapObject = {
      id: 'rock-1',
      kind: 'rock',
      isBlocking: true,
      footprints: [
        [
          { x: 60, y: 18 },
          { x: 62, y: 18 },
          { x: 62, y: 20 },
          { x: 60, y: 20 },
        ],
      ],
    };
    const world = new MatchWorld(
      map,
      MatchGrid.build(map, [rock], { cellSize: 2, features: MAP_FEATURE_DEFINITIONS }),
    );
    const state = new GameState(createDefaultGameConfig(), 1, world);
    state.worldObjects = new WorldObjectStore({
      objects: [rock],
      factory: fixtureFactory(),
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
    state.events.on('entity-removed', ({ entityId }) => state.worldObjects?.removed(entityId));
    const damage = new DamagePipeline();
    new MapDestructionSystem({
      state,
      damage,
      flowFields: null,
      ruinWall: RUINED_FORT_WALL_DEFINITION,
    });
    expect(world.grid.isWalkableAt(61, 19)).toBe(false);

    const id = state.worldObjects.snapshot()[0]?.entityId ?? '';
    damage.apply(state, id, 10000, { attackerId: null, kind: 'environment', definitionId: 'test' });
    new DeathSystem().update({ state, logger: new NullLogger() });

    expect(world.grid.isWalkableAt(61, 19)).toBe(true);
  });
});
