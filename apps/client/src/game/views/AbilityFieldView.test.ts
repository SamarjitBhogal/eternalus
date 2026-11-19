import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { AbilityFieldView } from './AbilityFieldView';
import { AbilityBarrierView } from './AbilityBarrierView';
import { BladeView } from './BladeView';

const entity: EntitySnapshot = {
  id: 'field',
  kind: 'ability-field',
  family: 'zone',
  definitionId: 'sanctuary-field',
  team: 'light',
  transform: { x: 0, y: 0, radius: 1, facing: { x: 1, y: 0 } },
  health: null,
  progression: null,
  aether: null,
  capture: null,
  area: [
    [
      { x: 0, y: 1 },
      { x: 10, y: 1 },
      { x: 10, y: -1 },
      { x: 0, y: -1 },
    ],
  ],
};
const state = { entity, position: { x: 0, y: 0 }, facing: { x: 1, y: 0 }, isFocused: false };

describe('persistent ability presentation', () => {
  it('draws snapshot geometry and advances field particles with injected time', () => {
    let seconds = 0;
    const renderer = new RecordingRenderer();
    const view = new AbilityFieldView(() => seconds);
    view.draw(state, renderer);
    expect(renderer.calls.find((call) => call.op === 'fillPolygon')?.args[0]).toEqual(
      entity.area?.[0],
    );
    const first = [...renderer.calls];
    renderer.calls.length = 0;
    seconds = 1;
    view.draw(state, renderer);
    expect(renderer.calls).not.toEqual(first);
    renderer.calls.length = 0;
    view.drawMinimap();
    expect(renderer.calls).toEqual([]);
  });
  it('draws a ray core inside its actual footprint and ignores unknown field definitions', () => {
    const renderer = new RecordingRenderer();
    const view = new AbilityFieldView(() => 1);
    view.draw(
      { ...state, entity: { ...entity, definitionId: 'death-ray-field', team: 'dark' } },
      renderer,
    );
    expect(
      renderer.calls.filter((call) => call.op === 'strokePath').map((call) => call.args[0]),
    ).toContainEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    renderer.calls.length = 0;
    view.draw({ ...state, entity: { ...entity, definitionId: 'unknown' } }, renderer);
    expect(renderer.calls).toEqual([]);
  });
  it('draws exact wall outlines and retains the ordinary obstacle fallback', () => {
    const renderer = new RecordingRenderer();
    const view = new AbilityBarrierView();
    view.draw(state, renderer);
    expect(renderer.calls.find((call) => call.op === 'fillPolygon')?.args[0]).toEqual(
      entity.area?.[0],
    );
    renderer.calls.length = 0;
    view.draw({ ...state, entity: { ...entity, area: null } }, renderer);
    expect(renderer.calls.some((call) => call.op === 'drawWorldGlyph')).toBe(true);
  });
  it('draws a readable blade with a trail behind its actual facing, without a minimap dot', () => {
    const renderer = new RecordingRenderer();
    const view = new BladeView();
    view.draw(state, renderer);
    const points = renderer.calls.find((call) => call.op === 'fillPolygon')?.args[0];
    expect(points?.[1]?.x).toBeLessThan(state.position.x);
    expect(renderer.calls.some((call) => call.op === 'drawWorldGlyph')).toBe(true);
    renderer.calls.length = 0;
    view.drawMinimap();
    expect(renderer.calls).toEqual([]);
  });
});
