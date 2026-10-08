import { describe, expect, it } from 'vitest';

import { EntityRegistry } from './EntityRegistry';
import { Projectile } from './Projectile';
import { ProjectileEntityModule } from './ProjectileEntityModule';

describe('ProjectileEntityModule', () => {
  it('registers the Projectile class', () => {
    const registry = new EntityRegistry();

    new ProjectileEntityModule().register(registry);

    expect(registry.get('projectile')).toBe(Projectile);
  });
});
