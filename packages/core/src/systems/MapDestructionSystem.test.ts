import { describe, expect, it } from 'vitest';
import { GameState } from '../state/GameState';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import { DamagePipeline } from '../combat/DamagePipeline';
import { MapDestructionSystem } from './MapDestructionSystem';
import { DeathSystem } from './DeathSystem';
import { NullLogger } from '../diagnostics/NullLogger';
import type { MapObject } from '../content/maps/mapObjects.types';

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
    state.worldObjects = new WorldObjectStore(
      [parent, { ...parent, id: 'wall', kind: 'wall', isBlocking: true, buildingId: 'palace' }],
      factory,
      state.entities,
      MAP_OBJECT_DEFINITIONS,
    );
    state.events.on('entity-removed', ({ entityId }) => state.worldObjects?.removed(entityId));
    const damage = new DamagePipeline();
    const collapse = new MapDestructionSystem(state, damage);
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
});
