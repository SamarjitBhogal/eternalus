import { describe, expect, it } from 'vitest';

import { Camera } from './Camera';
import { MAX_ZOOM, MIN_ZOOM } from './Camera.constants';

// Every test uses a map the same size as map-1.
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 900;

describe('Camera', () => {
  it('centres its view on the point it is looking at', () => {
    // A camera looking at (500, 450), showing a 400 x 300 window of the map.
    const camera = new Camera({ x: 500, y: 450 }, 400, 300);

    const view = camera.visibleArea(MAP_WIDTH, MAP_HEIGHT);

    // The window's top-left corner is half the window away from the centre:
    // x = 500 - 400 / 2 = 300, y = 450 - 300 / 2 = 300.
    expect(view).toEqual({ x: 300, y: 300, width: 400, height: 300 });
  });

  it('slides the view back inside the map when looking at a corner', () => {
    // Looking at the bottom-left corner: half the window would hang off the map.
    const camera = new Camera({ x: 0, y: MAP_HEIGHT }, 400, 300);

    const view = camera.visibleArea(MAP_WIDTH, MAP_HEIGHT);

    // Instead, the window is pushed back so it touches the left and bottom edges.
    expect(view.x).toBe(0);
    expect(view.y + view.height).toBe(MAP_HEIGHT);
  });

  it('centres the view on the map when the view is taller than the map', () => {
    // Asks for a 1000-tall window, but the map is only 900 tall.
    const camera = new Camera({ x: 800, y: 0 }, 640, 1000);

    const view = camera.visibleArea(MAP_WIDTH, MAP_HEIGHT);

    // The extra 100 is split evenly: 50 above the map and 50 below it.
    expect(view.y).toBe(-50);
  });

  it('moves to look at a new point', () => {
    // Starts looking at the left side of the map...
    const camera = new Camera({ x: 200, y: 450 }, 400, 300);

    // ...then is told to look at (1000, 450) instead.
    camera.lookAt({ x: 1000, y: 450 });
    const view = camera.visibleArea(MAP_WIDTH, MAP_HEIGHT);

    // The view is now centred on the new point: 1000 - 400 / 2 = 800.
    expect(view.x).toBe(800);
  });

  it('round-trips world → screen → world for the view on screen', () => {
    const camera = new Camera({ x: 500, y: 450 }, 400, 300);
    const viewport = {
      worldWidth: MAP_WIDTH,
      worldHeight: MAP_HEIGHT,
      screenWidth: 1280,
      screenHeight: 720,
    };

    for (const point of [
      { x: 300, y: 300 },
      { x: 512.5, y: 451.25 },
      { x: 700, y: 600 },
    ]) {
      const screen = camera.worldToScreen(point, viewport);
      const back = camera.screenToWorld(screen, viewport);
      expect(back.x).toBeCloseTo(point.x);
      expect(back.y).toBeCloseTo(point.y);
    }
    // The view's top-left corner (300, 300) is the screen's top-left corner.
    expect(camera.worldToScreen({ x: 300, y: 300 }, viewport)).toEqual({ x: 0, y: 0 });
  });

  it('culls points outside the view, with optional slack', () => {
    const camera = new Camera({ x: 500, y: 450 }, 400, 300);

    expect(camera.contains({ x: 500, y: 450 }, MAP_WIDTH, MAP_HEIGHT)).toBe(true);
    expect(camera.contains({ x: 299, y: 450 }, MAP_WIDTH, MAP_HEIGHT)).toBe(false);
    expect(camera.contains({ x: 299, y: 450 }, MAP_WIDTH, MAP_HEIGHT, 2)).toBe(true);
    expect(camera.contains({ x: 500, y: 601 }, MAP_WIDTH, MAP_HEIGHT)).toBe(false);
  });

  it('follows a target part of the way each frame, or jumps with smoothing 1', () => {
    const camera = new Camera({ x: 400, y: 400 }, 200, 200);

    camera.track({ x: 500, y: 400 }, 0.25);
    expect(camera.visibleArea(MAP_WIDTH, MAP_HEIGHT).x).toBe(325);

    camera.track({ x: 500, y: 400 }, 1);
    expect(camera.visibleArea(MAP_WIDTH, MAP_HEIGHT).x).toBe(400);

    camera.track({ x: 900, y: 400 }, 5);
    expect(camera.visibleArea(MAP_WIDTH, MAP_HEIGHT).x).toBe(800);
  });

  it('zooms within its limits: in shows less world, out shows more', () => {
    const camera = new Camera({ x: 800, y: 450 }, 400, 300);

    camera.zoomTo(2);
    expect([camera.zoom, camera.visibleWidth, camera.visibleHeight]).toEqual([2, 200, 150]);

    camera.zoomTo(100);
    expect(camera.zoom).toBe(MAX_ZOOM);
    camera.zoomTo(0);
    expect(camera.zoom).toBe(MIN_ZOOM);
  });
});
