import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { UnitDefinition } from '../content/units/units.types';
import { createDefaultEntityRegistry } from './defaultEntityRegistry';
import { Entity } from './Entity';
import { EntityFactory } from './EntityFactory';
import { Mob } from './Mob';

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

const UNIT_DEFINITIONS = loadDefaultContent(30);
const PLACEMENT = { position: { x: 10, y: 20 }, team: 'light' } as const;

describe('createDefaultEntityRegistry', () => {
  it('registers every shipped kind: Legends, mobs, obstacles and projectiles', () => {
    const registry = createDefaultEntityRegistry();

    for (const kind of ['warrior', 'sentinel', 'magus', 'light-mob', 'obstacle', 'projectile']) {
      expect(registry.has(kind)).toBe(true);
    }
  });

  it('builds a new registry on every call', () => {
    expect(createDefaultEntityRegistry()).not.toBe(createDefaultEntityRegistry());
  });

  it('registers a class for every unit definition kind', () => {
    const registry = createDefaultEntityRegistry();

    for (const definition of UNIT_DEFINITIONS.all()) {
      expect(registry.has(definition.kind)).toBe(true);
    }
  });

  it('spawns every unit definition with the unit components', () => {
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);

    for (const definition of UNIT_DEFINITIONS.all()) {
      const entity = factory.create(definition.kind, definition.id, PLACEMENT);

      expect(entity.kind).toBe(definition.kind);
      expect(entity.getComponent(Transform).position).toEqual({ x: 10, y: 20 });
      expect(entity.getComponent(Health).current).toBe(definition.baseHealth);
      expect(entity.getComponent(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
      expect(entity.getComponent(TeamMembership).team).toBe('light');
      expect(entity.getComponent(Collider).shape.radius).toBe(definition.footprintRadius);
    }
  });

  it('measures depth below Entity and rejects non-Entity classes', () => {
    expect(depthBelowEntity(createDefaultEntityRegistry().get('warrior') ?? {})).toBe(3);
    expect(() => depthBelowEntity(Object)).toThrow('Not an Entity class.');
  });

  it('keeps every registered class at most 3 levels below Entity', () => {
    const registry = createDefaultEntityRegistry();

    for (const definition of UNIT_DEFINITIONS.all()) {
      const entityClass = registry.get(definition.kind) ?? {};

      expect(depthBelowEntity(entityClass)).toBeLessThanOrEqual(MAX_DEPTH_BELOW_ENTITY);
    }
  });

  it('adds a new kind with a class, a content entry and one registry line', () => {
    // 1. The class.
    class FakeMob extends Mob {
      public readonly kind = 'fake-mob';
    }
    // 2. The content entry.
    const fakeDefinition: UnitDefinition = {
      ...UNIT_DEFINITIONS.get('training-dummy'),
      id: 'fake-mob',
      kind: 'fake-mob',
    };
    // 3. The registry line, added to what the registry file builds.
    const registry = createDefaultEntityRegistry();
    registry.register('fake-mob', FakeMob);

    const content = new ContentCatalogue([...UNIT_DEFINITIONS.all(), fakeDefinition]);
    const entity = new EntityFactory(registry, content).create('fake-mob', 'fake-mob', PLACEMENT);

    expect(entity).toBeInstanceOf(FakeMob);
    expect(entity.getComponent(Health).current).toBe(fakeDefinition.baseHealth);
    expect(depthBelowEntity(FakeMob)).toBe(MAX_DEPTH_BELOW_ENTITY);
  });
});
