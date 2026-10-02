import { describe, expect, it } from 'vitest';

import { Entity } from './Entity.js';
import { EntityRegistry } from './EntityRegistry.js';

class RegistryEntity extends Entity {
  get kind() {
    return 'registry-entity';
  }

  get family() {
    return 'test-family';
  }

  installComponents() {}
}

describe('EntityRegistry', () => {
  it('registers and looks up entity constructors by kind', () => {
    const registry = new EntityRegistry();
    registry.register('registry-entity', RegistryEntity);

    expect(registry.has('registry-entity')).toBe(true);
    expect(registry.get('registry-entity')).toBe(RegistryEntity);
  });

  it('rejects duplicate registrations and invalid constructors', () => {
    const registry = new EntityRegistry();
    registry.register('registry-entity', RegistryEntity);

    expect(() => registry.register('registry-entity', RegistryEntity)).toThrow(
      'Entity kind "registry-entity" is already registered.',
    );
    expect(() => registry.register('invalid', null)).toThrow(
      'Invalid entity registration for "invalid": constructor must be a class.',
    );
    expect(() => registry.register('also-invalid', class NotAnEntity {})).toThrow(
      'Invalid entity registration for "also-invalid": constructor must extend Entity.',
    );
  });
});
