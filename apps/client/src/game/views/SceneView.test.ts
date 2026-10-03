import { describe, expect, it, vi } from 'vitest';

import { Renderer } from '../engine/Renderer';
import type { DrawContext } from '../engine/Renderer.types';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** A pretend canvas. Tests run without a browser, so every drawing tool does nothing. */
const createFakeContext = (): DrawContext => ({
  beginPath: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineJoin: 'miter',
});

describe('SceneView', () => {
  it('draws every layer in list order, bottom first', () => {
    // Records the name of each layer as it gets drawn.
    const drawn: string[] = [];

    // A fake layer that draws nothing; it just writes its name into `drawn`.
    const layer = (name: string): WorldLayer => ({
      draw: (): void => {
        drawn.push(name);
      },
    });

    // Build a scene with three layers and draw it.
    new SceneView([layer('map'), layer('obstacles'), layer('units')]).draw(
      new Renderer(createFakeContext()),
    );
    // Layers must be drawn in list order: map at the bottom, units on top.
    expect(drawn).toEqual(['map', 'obstacles', 'units']);
  });
});
