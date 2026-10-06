import { describe, expect, it } from 'vitest';

import { Entity } from './Entity';
import { EntityRegistry } from './EntityRegistry';

class Marker {
  public readonly tag = 'marker';
}

class RegistryEntity extends Entity {
  public readonly kind = 'registry-entity';

  public readonly family = 'test-family';

  protected installComponents(): void {
    this.addComponent(new Marker());
  }
}

describe('EntityRegistry', () => {
  it('registers and looks up entity constructors by kind', () => {
    const registry = new EntityRegistry();
    registry.register('registry-entity', RegistryEntity);

    expect(registry.has('registry-entity')).toBe(true);
    expect(registry.get('registry-entity')).toBe(RegistryEntity);
    expect(registry.has('other')).toBe(false);
    expect(registry.get('other')).toBeUndefined();
  });

  it('rejects empty kinds, duplicate registrations and invalid constructors', () => {
    const registry = new EntityRegistry();
    registry.register('registry-entity', RegistryEntity);

    expect(() => {
      registry.register('', RegistryEntity);
    }).toThrow('Entity kind must be a non-empty string.');
    expect(() => {
      registry.register('registry-entity', RegistryEntity);
    }).toThrow('Entity kind "registry-entity" is already registered.');
    expect(() => {
      // @ts-expect-error -- exercises the runtime guard for callers that bypass the type
      registry.register('invalid', null);
    }).toThrow('Invalid entity registration for "invalid": constructor must be a class.');
    class NotAnEntity {
      public readonly id = 'not-an-entity';
    }
    expect(() => {
      // @ts-expect-error -- exercises the runtime guard for callers that bypass the type
      registry.register('also-invalid', NotAnEntity);
    }).toThrow('Invalid entity registration for "also-invalid": constructor must extend Entity.');
  });
});
