import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { UNIT_DEFINITIONS } from '../content/units/unitDefinitions';
import type { UnitDefinition } from '../content/units/units.types';
import { DefaultEntityRegistry } from './DefaultEntityRegistry';
import { Entity } from './Entity';
import { EntityFactory } from './EntityFactory';
import { EntityRegistry } from './EntityRegistry';
import { Unit } from './Unit';
import type { UnitSpawnContext } from './Unit.types';

const MAX_DEPTH_BELOW_ENTITY = 3;

/** How many classes sit between `entityClass` and `Entity`, counting `entityClass` itself. */
const depthBelowEntity = (entityClass: object): number => {
  let depth = 0;
  let current: object | null = entityClass;

  while (current !== null && current !== Entity) {
    depth += 1;
    current = Object.getPrototypeOf(current) as object | null;
  }

  if (current === null) {
    throw new Error('Not an Entity class.');
  }

  return depth;
};

const spawnContext = (definition: UnitDefinition): UnitSpawnContext => ({
  definition,
  position: { x: 10, y: 20 },
  team: 'light',
});

describe('DefaultEntityRegistry', () => {
  it('is an EntityRegistry, so it works anywhere a registry is expected', () => {
    expect(new DefaultEntityRegistry()).toBeInstanceOf(EntityRegistry);
  });

  it('registers a class for every unit definition kind', () => {
    const registry = new DefaultEntityRegistry();

    for (const definition of UNIT_DEFINITIONS.all()) {
      expect(registry.has(definition.kind)).toBe(true);
    }
  });

  it('spawns every unit definition with the unit components', () => {
    const factory = new EntityFactory(new DefaultEntityRegistry());

    for (const definition of UNIT_DEFINITIONS.all()) {
      const entity = factory.create(definition.kind, definition.id, spawnContext(definition));

      expect(entity.kind).toBe(definition.kind);
      expect(entity.get(Transform).position).toEqual({ x: 10, y: 20 });
      expect(entity.get(Health).base).toBe(definition.baseHealth);
      expect(entity.get(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
      expect(entity.get(TeamMembership).team).toBe('light');
      expect(entity.get(Collider).shape.radius).toBe(definition.footprintRadius);
    }
  });

  it('measures depth below Entity and rejects non-Entity classes', () => {
    expect(depthBelowEntity(new DefaultEntityRegistry().get('warrior') ?? {})).toBe(3);
    expect(() => depthBelowEntity(Object)).toThrow('Not an Entity class.');
  });

  it('keeps every registered class at most 3 levels below Entity', () => {
    const registry = new DefaultEntityRegistry();

    for (const definition of UNIT_DEFINITIONS.all()) {
      const entityClass = registry.get(definition.kind) ?? {};

      expect(depthBelowEntity(entityClass)).toBeLessThanOrEqual(MAX_DEPTH_BELOW_ENTITY);
    }
  });

  it('adds a new kind with a class, a content entry and one registry line', () => {
    // 1. The class.
    class FakeMob extends Unit {
      public readonly kind = 'fake-mob';

      public readonly family = 'mob';
    }
    // 2. The content entry.
    const fakeDefinition: UnitDefinition = {
      ...UNIT_DEFINITIONS.get('heavy-mob'),
      id: 'fake-mob',
      kind: 'fake-mob',
    };
    // 3. The registry line.
    const registry = new DefaultEntityRegistry();
    registry.register('fake-mob', FakeMob);

    const entity = new EntityFactory(registry).create(
      'fake-mob',
      'fake-mob',
      spawnContext(fakeDefinition),
    );

    expect(entity).toBeInstanceOf(FakeMob);
    expect(entity.get(Health).base).toBe(fakeDefinition.baseHealth);
    expect(depthBelowEntity(FakeMob)).toBe(2);
  });
});
