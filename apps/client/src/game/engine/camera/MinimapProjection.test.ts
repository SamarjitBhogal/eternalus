import { describe, expect, it, vi } from 'vitest';

import { Canvas2dRenderer } from '../render/Canvas2dRenderer';
import type { DrawContext } from '../render/Canvas2dRenderer.types';
import { RecordingRenderer } from '../render/RecordingRenderer';
import { MinimapProjection } from './MinimapProjection';

/** The world around (300, 500), 200 units each side, on a 100 × 100 px square at (900, 50). */
const CENTRE = { x: 300, y: 500 };
const AREA = { x: 900, y: 50, width: 100, height: 100 };
const projection = (): MinimapProjection => new MinimapProjection(CENTRE, 200, AREA);

/** A pretend canvas: the projection only needs the renderer's maths. */
const createFakeContext = (): DrawContext => ({
  beginPath: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  rect: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineJoin: 'miter',
});

describe('MinimapProjection', () => {
  it('shows the square of world around the centre across the screen area', () => {
    const renderer = new RecordingRenderer();

    projection().apply(renderer);

    expect(renderer.calls).toEqual([
      { op: 'showWorldArea', args: [{ x: 100, y: 300, width: 400, height: 400 }, AREA] },
    ]);
  });

  it('turns screen points back into the world points drawn under them', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    renderer.resize(1920, 1080);
    const minimap = projection();
    minimap.apply(renderer);

    // The middle of the area is the centre; its right edge is `radius` units east.
    expect(minimap.worldAt(950, 100)).toEqual(CENTRE);
    expect(minimap.worldAt(1000, 100)).toEqual({ x: 500, y: 500 });
    // Any point the renderer draws comes back from its screen position.
    const point = { x: 230, y: 610 };
    const onScreen = renderer.toScreen(point);
    expect(minimap.worldAt(onScreen.x, onScreen.y).x).toBeCloseTo(point.x);
    expect(minimap.worldAt(onScreen.x, onScreen.y).y).toBeCloseTo(point.y);
  });
});
