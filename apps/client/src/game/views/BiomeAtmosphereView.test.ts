import type { MapDecoration } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { BiomeAtmosphereView } from './BiomeAtmosphereView';
import type { WorldLayer } from './SceneView.types';

const region = (kind: 'snow' | 'lava'): MapDecoration => ({
  id: 'region',
  color: 'transparent',
  layer: 'ground',
  ambientBiome: kind,
  shape: [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
    { x: 0, y: 200 },
  ],
});
const view = () => ({ x: 60, y: 60, width: 96, height: 54 });
const paint = (effect: BiomeAtmosphereView) => {
  const renderer = new RecordingRenderer();
  effect.draw(renderer);
  return renderer.calls;
};

describe('BiomeAtmosphereView', () => {
  it.each(['snow', 'lava'] as const)(
    'animates local %s weather with deterministic render time, only while the player is inside',
    (kind) => {
      const scenery = [region(kind)],
        before = structuredClone(scenery);
      const effect = new BiomeAtmosphereView(scenery, view);
      effect.show({ x: 100, y: 100 }, 1, true);
      const first = paint(effect);
      expect(first.length).toBeGreaterThan(50);
      expect(paint(effect)).toEqual(first);
      effect.show({ x: 100, y: 100 }, 2, true);
      expect(paint(effect)).not.toEqual(first);
      effect.show({ x: 400, y: 400 }, 2, true);
      expect(paint(effect)).toEqual([]);
      effect.show({ x: 100, y: 100 }, 2, false);
      expect(paint(effect)).toEqual([]);
      effect.show(null, 2, true);
      expect(paint(effect)).toEqual([]);
      expect(scenery).toEqual(before);
    },
  );

  it('fades precipitation at the border and keeps all atmospheric overlays off the minimap', () => {
    const effect = new BiomeAtmosphereView([region('snow')], view);
    effect.show({ x: 100, y: 100 }, 0, true);
    const centre = paint(effect).at(-1);
    effect.show({ x: 198, y: 100 }, 0, true);
    const edge = paint(effect).at(-1);
    if (centre?.op !== 'fillPolygon' || edge?.op !== 'fillPolygon')
      throw new Error('Missing precipitation');
    const alpha = (value: string): number => Number(value.slice(value.lastIndexOf(',') + 1, -1));
    expect(alpha(edge.args[1])).toBeLessThan(alpha(centre.args[1]));
    expect(alpha(edge.args[1])).toBeGreaterThan(0);
    const minimap = new RecordingRenderer();
    const layer: WorldLayer = effect;
    layer.drawMinimap(minimap);
    expect(minimap.calls).toEqual([]);
  });

  it('animates only tagged molten surfaces and culls offscreen flows', () => {
    const flow: MapDecoration = {
      id: 'flow',
      shape: region('lava').shape,
      color: 'orange',
      layer: 'detail',
      sceneryAnimation: 'lava-flow',
    };
    const effect = new BiomeAtmosphereView([flow], view);
    effect.show(null, 0, false);
    const first = paint(effect);
    effect.show(null, 1, false);
    const next = paint(effect);
    expect(first).toHaveLength(1);
    expect(next).not.toEqual(first);
    expect(
      new BiomeAtmosphereView([flow], () => ({ x: 500, y: 500, width: 96, height: 54 })),
    ).toBeDefined();
    expect(
      paint(new BiomeAtmosphereView([flow], () => ({ x: 500, y: 500, width: 96, height: 54 }))),
    ).toEqual([]);
    expect(paint(new BiomeAtmosphereView([], view))).toEqual([]);
  });
});
