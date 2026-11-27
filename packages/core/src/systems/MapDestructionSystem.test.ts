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

/** A palace map object with one wall in it, and a system that collapses through `damage`. */
const setUp = (damage: DamagePipeline) => {
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
  const worldObjects = new WorldObjectStore({
    objects: [
      parent,
      { ...parent, id: 'wall', kind: 'wall', isBlocking: true, buildingId: 'palace' },
    ],
    factory,
    entities: state.entities,
    definitions: MAP_OBJECT_DEFINITIONS,
  });
  state.worldObjects = worldObjects;
  state.events.on('entity-removed', ({ entityId }) => {
    worldObjects.removed(entityId);
  });
  const collapse = new MapDestructionSystem(state, damage);
  const hits: string[] = [];
  state.events.on('entity-died', ({ entityId }) => hits.push(entityId));
  /** Kills the palace with `damage`, then runs the collapse and the removal. */
  const fell = () => {
    const id = worldObjects.snapshot()[0]?.entityId ?? '';
    damage.apply(state, id, 1_000_000, {
      attackerId: null,
      kind: 'environment',
      definitionId: 'test',
    });
    collapse.update({ state, logger: new NullLogger() });
    new DeathSystem().update({ state, logger: new NullLogger() });
  };
  return { state, worldObjects, hits, fell };
};

describe('MapDestructionSystem', () => {
  it('destroys owned walls through attributed damage and leaves all contents walkable after retirement', () => {
    const { state, worldObjects, hits, fell } = setUp(new DamagePipeline());

    fell();

    expect(hits).toHaveLength(2);
    expect(state.entities.size).toBe(0);
    expect(worldObjects.snapshot().every((o) => o.condition === 'destroyed')).toBe(true);
  });

  it('fells every content in full though a damage step would weaken the hit (DEC-388)', () => {
    const halving = { name: 'halving', adjust: ({ amount }: { amount: number }) => amount / 2 };
    const { state, hits, fell } = setUp(new DamagePipeline([halving]));

    fell();

    expect(hits).toHaveLength(2);
    expect(state.entities.size).toBe(0);
  });
});
