import { describe, expect, it } from 'vitest';

import { EntityRegistry } from '../EntityRegistry';
import { LegendEntityModule } from './LegendEntityModule';
import { Magus } from './Magus';
import { Sentinel } from './Sentinel';
import { Warrior } from './Warrior';

describe('LegendEntityModule', () => {
  it('registers the three Legend classes under their kinds', () => {
    const registry = new EntityRegistry();

    new LegendEntityModule().register(registry);

    expect(registry.get('warrior')).toBe(Warrior);
    expect(registry.get('sentinel')).toBe(Sentinel);
    expect(registry.get('magus')).toBe(Magus);
  });
});
