import { describe, expect, it, vi } from 'vitest';

import type { Renderer } from '../engine/render/Renderer';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** Layers here never draw, so the renderer is never called; any object will do. */
const RENDERER = {} as Renderer;

describe('SceneView', () => {
  it('draws every layer in list order, bottom first', () => {
    // Records the name of each layer as it gets drawn.
    const drawn: string[] = [];

    // A fake layer that draws nothing; it just writes its name into `drawn`.
    const layer = (name: string): WorldLayer => ({
      draw: (): void => {
        drawn.push(name);
      },
      drawMinimap: (): void => {
        drawn.push(`${name} (minimap)`);
      },
    });

    // Build a scene with three layers and draw it, then draw its mini map.
    const scene = new SceneView([layer('map'), layer('obstacles'), layer('units')]);
    scene.draw(RENDERER);
    scene.drawMinimap(RENDERER);
    // Layers must be drawn in list order: map at the bottom, units on top, in both views.
    expect(drawn).toEqual([
      'map',
      'obstacles',
      'units',
      'map (minimap)',
      'obstacles (minimap)',
      'units (minimap)',
    ]);
  });

  it('passes the renderer to every layer', () => {
    const draw = vi.fn();
    new SceneView([{ draw, drawMinimap: vi.fn() }]).draw(RENDERER);

    expect(draw).toHaveBeenCalledWith(RENDERER);
  });
});
