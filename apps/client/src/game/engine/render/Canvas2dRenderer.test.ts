import { describe, expect, it, type Mock, vi } from 'vitest';

import { Canvas2dRenderer } from './Canvas2dRenderer';
import type { DrawContext } from './Canvas2dRenderer.types';

/** The canvas drawing tools the tests watch. */
type DrawMethod =
  | 'beginPath'
  | 'closePath'
  | 'drawImage'
  | 'ellipse'
  | 'fill'
  | 'fillRect'
  | 'lineTo'
  | 'moveTo'
  | 'rect'
  | 'stroke'
  | 'strokeRect';

/** A pretend canvas plus a spy for each drawing tool. */
type FakeContext = {
  readonly context: DrawContext;
  readonly spies: Readonly<Record<DrawMethod, Mock>>;
};

/**
 * A pretend canvas. Tests run without a browser, so each drawing tool is a spy that
 * records every call. `spies` lets tests check what was drawn and where.
 */
const createFakeContext = (): FakeContext => {
  const spies = {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    rect: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
  };
  const context: DrawContext = {
    ...spies,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
  };
  return { context, spies };
};

/**
 * A 1000 x 500 screen showing a 100 x 100 world. The world is square and the screen is wide,
 * so the scale is 5 (500 / 100) and there is a 250 px gap on the left ((1000 - 500) / 2).
 * Most tests below use these numbers.
 */
const createFittedRenderer = (context: DrawContext): Canvas2dRenderer => {
  const renderer = new Canvas2dRenderer(context);
  renderer.resize(1000, 500);
  renderer.fitWorld(100, 100);
  return renderer;
};

describe('Canvas2dRenderer', () => {
  it('reuses static layers and rebuilds them on revision or resize, including glyphs', () => {
    const destination = createFakeContext();
    const cached = createFakeContext();
    vi.stubGlobal(
      'OffscreenCanvas',
      vi.fn(function () {
        return { getContext: () => cached.context };
      }),
    );
    try {
      const renderer = createFittedRenderer(destination.context);
      const key = {};
      const draw = vi.fn(() => {
        renderer.drawGlyph({ shape: 'square', size: 4 }, { x: 50, y: 50 }, '#abc');
      });
      renderer.drawCachedLayer(key, 0, draw);
      renderer.drawCachedLayer(key, 0, draw);
      expect(draw).toHaveBeenCalledOnce();
      expect(cached.spies.rect).toHaveBeenCalledOnce();
      expect(destination.spies.rect).not.toHaveBeenCalled();
      expect(destination.spies.drawImage).toHaveBeenCalledTimes(2);
      renderer.drawCachedLayer(key, 1, draw);
      renderer.resize(800, 400);
      renderer.drawCachedLayer(key, 1, draw);
      expect(draw).toHaveBeenCalledTimes(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('batches visible same-colour polygons into one fill and skips off-screen geometry', () => {
    const { context, spies } = createFakeContext();
    const renderer = new Canvas2dRenderer(context);
    renderer.resize(100, 100);
    renderer.showWorldArea({ x: 0, y: 0, width: 10, height: 10 });
    renderer.fillPolygons(
      [
        [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 1, y: 2 },
        ],
        [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ],
        [
          { x: 20, y: 20 },
          { x: 22, y: 20 },
          { x: 20, y: 22 },
        ],
      ],
      '#555',
    );
    expect(spies.beginPath).toHaveBeenCalledTimes(1);
    expect(spies.closePath).toHaveBeenCalledTimes(2);
    expect(spies.fill).toHaveBeenCalledTimes(1);
    expect(context.fillStyle).toBe('#555');
  });
  it('culls off-screen polygons but keeps intersecting surfaces and reprojects cached bounds', () => {
    const { context, spies } = createFakeContext();
    const renderer = new Canvas2dRenderer(context);
    renderer.resize(100, 100);
    renderer.showWorldArea({ x: 0, y: 0, width: 10, height: 10 });
    const shape = [
      { x: 20, y: 20 },
      { x: 22, y: 20 },
      { x: 20, y: 22 },
    ];
    renderer.fillPolygon(shape, '#333');
    expect(spies.fill).not.toHaveBeenCalled();
    renderer.showWorldArea({ x: 19, y: 19, width: 10, height: 10 });
    renderer.fillPolygon(shape, '#333');
    expect(spies.fill).toHaveBeenCalledTimes(1);
    renderer.fillPolygon(
      [
        { x: 18, y: 20 },
        { x: 21, y: 20 },
        { x: 21, y: 22 },
      ],
      '#444',
    );
    expect(spies.fill).toHaveBeenCalledTimes(2);
  });
  it('scales and centres the world to fit the screen', () => {
    const renderer = createFittedRenderer(createFakeContext().context);

    // Top-left of the world lands after the 250 px gap.
    expect(renderer.toScreen({ x: 0, y: 0 })).toEqual({ x: 250, y: 0 });
    // Bottom-right: 250 + 100 x 5 = 750 across, 100 x 5 = 500 down.
    expect(renderer.toScreen({ x: 100, y: 100 })).toEqual({ x: 750, y: 500 });
  });

  it('clears the whole screen with one colour', () => {
    const { context, spies } = createFakeContext();
    createFittedRenderer(context).clear('#000000');

    // The whole 1000 x 500 screen is painted in the given colour.
    expect(context.fillStyle).toBe('#000000');
    expect(spies.fillRect).toHaveBeenCalledWith(0, 0, 1000, 500);
  });

  it('fills a polygon through its screen points', () => {
    const { context, spies } = createFakeContext();
    createFittedRenderer(context).fillPolygon(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      '#ff0000',
    );

    // Each world point becomes a screen point: 250 + x * 5, y * 5.
    expect(spies.moveTo).toHaveBeenCalledWith(250, 0);
    expect(spies.lineTo).toHaveBeenCalledWith(300, 0);
    expect(spies.lineTo).toHaveBeenCalledWith(300, 50);
    // A filled shape is closed back to its start, then filled once.
    expect(spies.closePath).toHaveBeenCalledOnce();
    expect(spies.fill).toHaveBeenCalledOnce();
    expect(context.fillStyle).toBe('#ff0000');
  });

  it('strokes a path with a screen-pixel width', () => {
    const { context, spies } = createFakeContext();
    createFittedRenderer(context).strokePath(
      [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ],
      '#00ff00',
      3,
    );

    // A line (like a lane) is drawn but NOT closed into a loop.
    expect(spies.stroke).toHaveBeenCalledOnce();
    expect(spies.closePath).not.toHaveBeenCalled();
    // Line width stays 3 pixels no matter how zoomed in the world is.
    expect(context.lineWidth).toBe(3);
    expect(context.strokeStyle).toBe('#00ff00');
  });

  it('draws nothing for an empty shape or path', () => {
    const { context, spies } = createFakeContext();
    const renderer = createFittedRenderer(context);
    renderer.fillPolygon([], '#ff0000');
    renderer.strokePath([], '#ff0000', 1);

    // No points means no drawing at all, and no crash.
    expect(spies.beginPath).not.toHaveBeenCalled();
  });

  it('fills a square glyph sized in world units, centred on a world position', () => {
    const { context, spies } = createFakeContext();
    createFittedRenderer(context).drawWorldGlyph(
      { shape: 'square', size: 10 },
      { x: 50, y: 50 },
      '#0000ff',
    );

    // A 10-unit square centred at (50, 50) has its top-left at (45, 45) in the world,
    // which is (250 + 45 x 5, 45 x 5) = (475, 225) on screen, and 10 x 5 = 50 px wide.
    expect(spies.rect).toHaveBeenCalledWith(475, 225, 50, 50);
    expect(spies.fill).toHaveBeenCalledOnce();
    expect(context.fillStyle).toBe('#0000ff');
  });

  it('sizes minimap glyphs in CSS pixels, scaled by the pixel ratio, not the zoom', () => {
    const { context, spies } = createFakeContext();
    const renderer = createFittedRenderer(context);
    renderer.resize(1000, 500, 2);
    renderer.drawGlyph({ shape: 'dot', size: 4 }, { x: 50, y: 50 }, '#00ff00');

    // A 4 px dot at pixel ratio 2 has a radius of 4 device pixels, whatever the zoom (5x).
    expect(spies.ellipse).toHaveBeenCalledWith(500, 250, 4, 4, 0, 0, 2 * Math.PI);
    expect(spies.fill).toHaveBeenCalledOnce();
  });

  it('outlines ring glyphs instead of filling them', () => {
    const { context, spies } = createFakeContext();
    createFittedRenderer(context).drawGlyph({ shape: 'ring', size: 6 }, { x: 0, y: 0 }, '#ff0000');

    expect(spies.stroke).toHaveBeenCalledOnce();
    expect(spies.fill).not.toHaveBeenCalled();
    expect(context.strokeStyle).toBe('#ff0000');
  });

  it('traces diamond glyphs through their four tips', () => {
    const { context, spies } = createFakeContext();
    createFittedRenderer(context).drawGlyph(
      { shape: 'diamond', size: 10 },
      { x: 0, y: 0 },
      '#ff0000',
    );

    // Centre (0, 0) is (250, 0) on screen; the tips are 5 px away.
    expect(spies.moveTo).toHaveBeenCalledWith(250, -5);
    expect(spies.lineTo).toHaveBeenCalledWith(255, 0);
    expect(spies.lineTo).toHaveBeenCalledWith(250, 5);
    expect(spies.lineTo).toHaveBeenCalledWith(245, 0);
    expect(spies.closePath).toHaveBeenCalledOnce();
  });

  it('fits the world inside one area of the screen', () => {
    const renderer = createFittedRenderer(createFakeContext().context);
    // Squeeze the world into a 200 x 100 box at (800, 300), like the mini map.
    renderer.fitWorldInArea(100, 100, { x: 800, y: 300, width: 200, height: 100 });

    // The square world fits the box's height (scale 1) and is centred in its width,
    // so there is a 50 px gap on each side: it spans 850 to 950 across.
    expect(renderer.toScreen({ x: 0, y: 0 })).toEqual({ x: 850, y: 300 });
    expect(renderer.toScreen({ x: 100, y: 100 })).toEqual({ x: 950, y: 400 });
  });

  it('fills and outlines rectangles given in screen pixels', () => {
    const { context, spies } = createFakeContext();
    const renderer = createFittedRenderer(context);
    const area = { x: 10, y: 20, width: 30, height: 40 };
    // Used for the mini map's dark panel and its border.
    renderer.fillScreenRect(area, '#111111');
    renderer.strokeScreenRect(area, '#222222', 2);

    // Screen rectangles are drawn exactly as given; no zoom is applied.
    expect(spies.fillRect).toHaveBeenCalledWith(10, 20, 30, 40);
    expect(spies.strokeRect).toHaveBeenCalledWith(10, 20, 30, 40);
    expect(context.strokeStyle).toBe('#222222');
    expect(context.lineWidth).toBe(2);
  });

  it('shows one part of the world across the whole screen', () => {
    const renderer = createFittedRenderer(createFakeContext().context);
    // Zoom in on a 200 x 100 part of the world, like the camera does.
    renderer.showWorldArea({ x: 20, y: 10, width: 200, height: 100 });

    // That part's top-left fills the screen's top-left, and its bottom-right
    // fills the screen's bottom-right.
    expect(renderer.toScreen({ x: 20, y: 10 })).toEqual({ x: 0, y: 0 });
    expect(renderer.toScreen({ x: 220, y: 110 })).toEqual({ x: 1000, y: 500 });
  });

  // NEW: checks the "tall, not wide" camera view.
  it('can show more height than width by scaling each direction separately', () => {
    const { context, spies } = createFakeContext();
    const renderer = createFittedRenderer(context);
    // Show a square 100 x 100 part of the world on the wide 1000 x 500 screen.
    renderer.showWorldArea({ x: 0, y: 0, width: 100, height: 100 });
    renderer.drawWorldGlyph({ shape: 'square', size: 10 }, { x: 50, y: 50 }, '#0000ff');

    // Left-right is stretched 10x (1000 / 100) but up-down only 5x (500 / 100),
    // so the whole area still fills the screen...
    expect(renderer.toScreen({ x: 100, y: 100 })).toEqual({ x: 1000, y: 500 });
    // ...and a square is drawn twice as wide as it is tall (100 x 50 px).
    expect(spies.rect).toHaveBeenCalledWith(450, 225, 100, 50);
  });

  it('returns null when the canvas has no 2D context', () => {
    // A pretend canvas that can't draw, like a very old browser.
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;

    // The renderer says "can't draw" instead of crashing.
    expect(Canvas2dRenderer.fromCanvas(canvas)).toBeNull();
  });
});
