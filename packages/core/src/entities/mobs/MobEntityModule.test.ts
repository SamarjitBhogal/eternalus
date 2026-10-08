import { describe, expect, it } from 'vitest';

import { EntityRegistry } from '../EntityRegistry';
import { LightMob } from './LightMob';
import { MobEntityModule } from './MobEntityModule';

describe('MobEntityModule', () => {
  it('registers the light mob', () => {
    const registry = new EntityRegistry();

    new MobEntityModule().register(registry);

    expect(registry.get('light-mob')).toBe(LightMob);
  });
});
