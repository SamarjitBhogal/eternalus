import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { DefaultEntityView } from './DefaultEntityView';
import { DefaultViewRegistry } from './DefaultViewRegistry';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { ViewRegistry } from './ViewRegistry';

const entity = (kind: string, family: string): EntitySnapshot => ({
  id: 'entity-1',
  kind,
  family,
  definitionId: kind,
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5 },
  health: null,
});

describe('DefaultViewRegistry', () => {
  it('draws Legends with the Legend view, mobs with the mob view, and the rest by default', () => {
    const registry = new DefaultViewRegistry();

    expect(registry).toBeInstanceOf(ViewRegistry);
    expect(registry.viewFor(entity('warrior', 'legend'))).toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('sentinel', 'legend'))).toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('light-mob', 'mob'))).toBeInstanceOf(MobView);
    expect(registry.viewFor(entity('light-mob', 'mob'))).not.toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('pillar', 'obstacle'))).toBeInstanceOf(DefaultEntityView);
    expect(registry.viewFor(entity('pillar', 'obstacle'))).not.toBeInstanceOf(MobView);
  });

  it('passes unknown kinds to the reporter it is given', () => {
    const unknown: string[] = [];

    new DefaultViewRegistry((kind) => unknown.push(kind)).viewFor(
      entity('projectile', 'projectile'),
    );

    expect(unknown).toEqual(['projectile']);
  });
});
