import { TEAM_COLORS } from './MapView.constants';
import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';
import { LegendSpriteView } from './LegendSpriteView';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';

const entity: EntitySnapshot = {
  id: 'hero',
  kind: 'magus',
  family: 'legend',
  definitionId: 'magus',
  team: 'dark',
  transform: { x: 1, y: 2, radius: 0.75, facing: { x: 0, y: 1 } },
  health: { current: 800, max: 800 },
  aether: null,
  progression: null,
  area: null,
  capture: null,
  gem: null,
  statuses: null,
  projectile: null,
  swing: null,
};
const state = {
  entity,
  position: { x: 1, y: 2 },
  isFocused: true,
  facing: { x: 0, y: 1 },
  tick: 0,
};
const swinging = {
  ...state,
  entity: { ...entity, swing: { atTick: 0, direction: { x: 0, y: 1 }, radius: 2, arcDegrees: 90 } },
};
describe('LegendSpriteView', () => {
  it('draws an atlas frame and keeps the team ring and Legend minimap marker', () => {
    const renderer = new RecordingRenderer(),
      view = new LegendSpriteView(() => ({ atlasId: 'oracle-sprites', frame: 3 }), 6.8);
    view.draw(state, renderer);
    expect(renderer.calls.find((call) => call.op === 'drawSprite')?.args[0]).toEqual({
      atlasId: 'oracle-sprites',
      frame: 3,
    });
    expect(renderer.calls.find((call) => call.op === 'drawWorldGlyph')?.args[2]).toBe(
      TEAM_COLORS.dark,
    );
    renderer.calls.length = 0;
    view.drawMinimap(state, renderer);
    expect(renderer.calls.some((call) => call.op === 'drawGlyph')).toBe(true);
  });
  it('uses the existing Legend fallback when the atlas is unavailable', () => {
    const renderer = new RecordingRenderer();
    vi.spyOn(renderer, 'drawSprite').mockReturnValue(false);
    new LegendSpriteView(() => ({ atlasId: 'missing', frame: 0 }), 6.8).draw(state, renderer);
    expect(renderer.calls.filter((call) => call.op === 'drawWorldGlyph').length).toBeGreaterThan(1);
  });
  it('draws the swing wedge under the sprite (DEC-304)', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(() => ({ atlasId: 'oracle-sprites', frame: 3 }), 6.8).draw(
      swinging,
      renderer,
    );
    expect(renderer.calls.map((call) => call.op).slice(0, 2)).toEqual([
      'fillPolygon',
      'drawSprite',
    ]);
  });
  it('draws the swing wedge once when it falls back to the Legend view', () => {
    const renderer = new RecordingRenderer();
    vi.spyOn(renderer, 'drawSprite').mockReturnValue(false);
    new LegendSpriteView(() => ({ atlasId: 'missing', frame: 0 }), 6.8).draw(swinging, renderer);
    expect(renderer.calls.filter((call) => call.op === 'fillPolygon')).toHaveLength(1);
  });
  it('keeps the fallback when no selected sprite is provided', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(() => null, 6.8).draw(state, renderer);
    expect(renderer.calls.some((call) => call.op === 'drawSprite')).toBe(false);
    expect(renderer.calls.some((call) => call.op === 'drawWorldGlyph')).toBe(true);
  });
});
