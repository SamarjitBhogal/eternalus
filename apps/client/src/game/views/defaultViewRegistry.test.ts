import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { AirborneView } from './AirborneView';
import { CapturePointView } from './CapturePointView';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { CathedralGemView } from './CathedralGemView';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityView } from './EntityView.types';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { StructureView } from './StructureView';
import { ViewRegistry } from './ViewRegistry';

const entity = (kind: string, family: string): EntitySnapshot => ({
  id: 'entity-1',
  kind,
  family,
  definitionId: kind,
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5, facing: { x: 1, y: 0 } },
  health: null,
  elevation: null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
});

describe('createDefaultViewRegistry', () => {
  it('draws Legends, mobs and structures with their own views, and the rest by default', () => {
    const registry = createDefaultViewRegistry();

    expect(registry).toBeInstanceOf(ViewRegistry);
    expect(registry.viewFor(entity('warrior', 'legend'))).toBeInstanceOf(AirborneView);
    expect(registry.viewFor(entity('sentinel', 'legend'))).toBeInstanceOf(AirborneView);
    expect(registry.viewFor(entity('light-mob', 'mob'))).toBeInstanceOf(MobView);
    expect(registry.viewFor(entity('light-mob', 'mob'))).not.toBeInstanceOf(LegendView);
    expect(registry.viewFor(entity('gate', 'structure'))).toBeInstanceOf(StructureView);
    expect(registry.viewFor(entity('pillar', 'obstacle'))).toBeInstanceOf(DefaultEntityView);
    expect(registry.viewFor(entity('pillar', 'obstacle'))).not.toBeInstanceOf(MobView);
    expect(registry.viewFor(entity('capture-point', 'zone'))).toBeInstanceOf(CapturePointView);
    expect(registry.viewFor(entity('cathedral-gem', 'structure'))).toBeInstanceOf(CathedralGemView);
  });

  it('raises a jumping Legend over a ground shadow, through the given Legend view (DEC-390)', () => {
    const legend: EntityView = {
      draw: () => undefined,
      drawMinimap: () => undefined,
      visualRadiusOf: () => 3,
    };
    const jumping = { ...entity('warrior', 'legend'), elevation: { height: 1.5 } };
    const renderer = new RecordingRenderer();

    const view = createDefaultViewRegistry(undefined, legend).viewFor(jumping);
    const state = {
      entity: jumping,
      position: { x: 0, y: 0 },
      facing: { x: 1, y: 0 },
      height: 1.5,
      isFocused: false,
      frameTick: 0,
    };

    view.draw(state, renderer);

    expect(renderer.calls.map((call) => call.op)).toEqual(['drawWorldGlyph']);
    expect(view.visualTopOf?.(state)).toBe(3 + 1.5);
  });

  it('passes unknown kinds to the reporter it is given', () => {
    const unknown: string[] = [];

    createDefaultViewRegistry((kind) => unknown.push(kind)).viewFor(
      entity('projectile', 'projectile'),
    );

    expect(unknown).toEqual(['projectile']);
  });
});
