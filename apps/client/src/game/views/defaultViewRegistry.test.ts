import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { CapturePointView } from './CapturePointView';
import { DefaultEntityView } from './DefaultEntityView';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { StructureView } from './StructureView';
import { ViewRegistry } from './ViewRegistry';
import { StaffBoltView } from './StaffBoltView';

const entity = (kind: string, family: string): EntitySnapshot => ({
  id: 'entity-1',
  kind,
  family,
  definitionId: kind,
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5 },
  health: null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
});

describe('createDefaultViewRegistry', () => {
  it('installs a selected sprite view once for all Legend classes without duplicate registration', () => {
    const selected = new LegendView();
    const registry = createDefaultViewRegistry(undefined, selected);
    for (const kind of ['warrior', 'sentinel', 'magus'])
      expect(registry.viewFor(entity(kind, 'legend'))).toBe(selected);
  });
  it('draws Legends, mobs and structures with their own views, and the rest by default', () => {
    const registry = createDefaultViewRegistry();

    expect(registry).toBeInstanceOf(ViewRegistry);
    expect(registry.viewFor(entity('warrior', 'legend'))).toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('sentinel', 'legend'))).toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('light-mob', 'mob'))).toBeInstanceOf(MobView);
    expect(registry.viewFor(entity('light-mob', 'mob'))).not.toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('gate', 'structure'))).toBeInstanceOf(StructureView);
    expect(registry.viewFor(entity('pillar', 'obstacle'))).toBeInstanceOf(DefaultEntityView);
    expect(registry.viewFor(entity('pillar', 'obstacle'))).not.toBeInstanceOf(MobView);
    expect(registry.viewFor(entity('capture-point', 'zone'))).toBeInstanceOf(CapturePointView);
    expect(registry.viewFor(entity('projectile', 'projectile'))).toBeInstanceOf(StaffBoltView);
  });

  it('passes unknown kinds to the reporter it is given', () => {
    const unknown: string[] = [];

    createDefaultViewRegistry((kind) => unknown.push(kind)).viewFor(
      entity('unregistered-kind', 'unregistered-family'),
    );

    expect(unknown).toEqual(['unregistered-kind']);
  });
});
