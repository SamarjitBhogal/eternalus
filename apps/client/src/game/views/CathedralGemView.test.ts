import type { EntitySnapshot, GemSnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { CathedralGemView } from './CathedralGemView';
import { GEM_COLORS, GEM_GLOW } from './CathedralGemView.constants';
import type { EntityView } from './EntityView.types';

const AT = { x: 100, y: 50 };
const DARK: GemSnapshot = { holder: 'neutral', glowTicksLeft: 0, glowHits: 0, ticksSinceHit: null };

const gemEntity = (gem: GemSnapshot | null): EntitySnapshot => ({
  id: 'entity-3',
  kind: 'cathedral-gem',
  family: 'structure',
  definitionId: 'cathedral',
  team: 'neutral',
  transform: { x: AT.x, y: AT.y, radius: 5, facing: { x: 1, y: 0 } },
  health: { current: 1, max: 1 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem,
});

const draw = (gem: GemSnapshot | null, tick = 0) => {
  const renderer = new RecordingRenderer();
  new CathedralGemView().draw(
    { entity: gemEntity(gem), position: AT, facing: { x: 1, y: 0 }, isFocused: false, tick },
    renderer,
  );
  return renderer.calls;
};

describe('CathedralGemView (DEC-291, DEC-292)', () => {
  it('draws a 10 × 16 diamond at the gem, in its holder’s colour', () => {
    for (const holder of ['light', 'dark', 'neutral'] as const) {
      expect(draw({ ...DARK, holder }).find(({ op }) => op === 'fillPolygon')).toEqual({
        op: 'fillPolygon',
        args: [
          [
            { x: 100, y: 42 },
            { x: 105, y: 50 },
            { x: 100, y: 58 },
            { x: 95, y: 50 },
          ],
          GEM_COLORS[holder],
        ],
      });
    }
  });

  it('draws a neutral gem when the snapshot has no gem state', () => {
    expect(draw(null).find(({ op }) => op === 'fillPolygon')?.args[1]).toBe(GEM_COLORS.neutral);
  });

  it('pulses just after a hit, and glows brighter and wider with more hits while lit', () => {
    const once = draw({ ...DARK, glowTicksLeft: 20, glowHits: 1, ticksSinceHit: 0 });
    const often = draw({ ...DARK, glowTicksLeft: 20, glowHits: 3, ticksSinceHit: 20 });

    expect(once).toContainEqual({
      op: 'drawWorldGlyph',
      args: [{ shape: 'dot', size: 15 }, AT, GEM_GLOW.colors[0]],
    });
    expect(once).toContainEqual({
      op: 'drawWorldGlyph',
      args: [{ shape: 'ring', size: 10 }, AT, GEM_GLOW.pulseColor],
    });
    // Past the pulse, only the glow is left, larger and in a stronger colour.
    expect(often).toContainEqual({
      op: 'drawWorldGlyph',
      args: [{ shape: 'dot', size: 22.5 }, AT, GEM_GLOW.colors[2]],
    });
    expect(
      often.some((call) => call.op === 'drawWorldGlyph' && call.args[0].shape === 'ring'),
    ).toBe(false);
  });

  it('keeps animating the idle facets and motes without a hit pulse or mini map marker', () => {
    const renderer = new RecordingRenderer();
    const view: EntityView = new CathedralGemView();
    view.drawMinimap(
      { entity: gemEntity(DARK), position: AT, facing: { x: 1, y: 0 }, isFocused: false },
      renderer,
    );

    const first = draw({ ...DARK, ticksSinceHit: 40 });
    const next = draw({ ...DARK, ticksSinceHit: 40 }, 23);
    expect(first.filter(({ op }) => op === 'fillPolygon')).toHaveLength(4);
    expect(
      first.some((call) => call.op === 'drawWorldGlyph' && call.args[0].shape === 'ring'),
    ).toBe(false);
    expect(next.filter(({ op }) => op === 'fillPolygon')).not.toEqual(
      first.filter(({ op }) => op === 'fillPolygon'),
    );
    expect(next.filter(({ op }) => op === 'drawWorldGlyph')).not.toEqual(
      first.filter(({ op }) => op === 'drawWorldGlyph'),
    );
    expect(renderer.calls).toEqual([]);
  });
});
