import { describe, expect, it } from 'vitest';

import { Camera } from './Camera';

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
});
