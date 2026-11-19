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
};
const state = { entity, position: { x: 1, y: 2 }, isFocused: true, facing: { x: 0, y: 1 } };
describe('LegendSpriteView', () => {
  it('scales Berserk with the snapshot body while keeping the feet grounded', () => {
    const renderer = new RecordingRenderer();
    const view = new LegendSpriteView(
      () => ({ atlasId: 'colossus-sprites', frame: 54 }),
      6.8,
      () => [
        {
          atlasId: 'colossus-sprites',
          abilityId: 'berserk',
          row: 9,
          progress: 0.2,
          fade: 1,
          origin: state.position,
          direction: state.facing,
        },
      ],
    );
    view.draw({ ...state, entity: { ...entity, visualScale: 1.3 } }, renderer);
    const sprite = renderer.calls.find((call) => call.op === 'drawSprite');
    expect(sprite?.args[2]).toBeCloseTo(6.8 * 1.3);
    expect(sprite?.args[1]).toEqual({ x: 1, y: 2 + (6.8 * 1.3 * 9) / 128 });
  });
  it('draws an atlas frame and keeps the team ring and Legend minimap marker', () => {
    const renderer = new RecordingRenderer(),
      view = new LegendSpriteView(() => ({ atlasId: 'oracle-sprites', frame: 3 }), 6.8);
    view.draw(state, renderer);
    expect(renderer.calls.find((call) => call.op === 'drawSprite')?.args[0]).toEqual({
      atlasId: 'oracle-sprites',
      frame: 3,
    });
    expect(renderer.calls.find((call) => call.op === 'drawWorldGlyph')?.args[2]).toBe('#bc7cff');
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
  it('anchors repaired combat feet and lifts Meteor Fall without moving the ground impact', () => {
    const renderer = new RecordingRenderer();
    const effect = {
      atlasId: 'colossus-sprites',
      row: 9,
      progress: 0.2,
      fade: 1,
      origin: { x: 1, y: 2 },
      direction: { x: 1, y: 0 },
    };
    const view = new LegendSpriteView(
      () => ({ atlasId: 'colossus-sprites', frame: 55 }),
      6.8,
      () => [effect],
    );
    view.draw(state, renderer);
    const feet = renderer.calls.find((call) => call.op === 'drawSprite')?.args[1];
    expect(feet).toEqual({ x: 1, y: 2 + 6.8 * (9 / 128) - 6.8 * 0.65 });
    expect(
      renderer.calls
        .filter((call) => call.op === 'drawWorldGlyph')
        .every((call) => (call.args[1] as { readonly y: number }).y === 2),
    ).toBe(true);
    effect.progress = 1;
    renderer.calls.length = 0;
    view.draw(state, renderer);
    expect(renderer.calls.find((call) => call.op === 'drawSprite')?.args[1]).toEqual({
      x: 1,
      y: 2 + 6.8 * (9 / 128),
    });
  });
  it('keeps the fallback when no selected sprite is provided', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(() => null, 6.8).draw(state, renderer);
    expect(renderer.calls.some((call) => call.op === 'drawSprite')).toBe(false);
    expect(renderer.calls.some((call) => call.op === 'drawWorldGlyph')).toBe(true);
  });
});
