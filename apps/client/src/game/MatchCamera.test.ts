import { CathedralInteriorBuilder, createDefaultGameConfig, MapGenerator } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { Camera } from './engine/Camera';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import { MatchCamera } from './MatchCamera';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);
const INTERIOR = new CathedralInteriorBuilder().build(MAP);
const ENTRY = INTERIOR?.entry ?? { center: { x: -1, y: -1 }, halfWidth: 0, halfHeight: 0 };

/** A match camera on a 1280 × 720 canvas whose following camera looks at `(500, 300)`. */
const setUp = (pixelRatio = 1) => {
  const camera = new Camera({ x: 500, y: 300 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const view = new MatchCamera(camera, MAP, INTERIOR);
  view.resize(1280, 720, pixelRatio);
  return { camera, view };
};

describe('MatchCamera', () => {
  it('shows what the following camera shows, and eases it towards the player', () => {
    const { camera, view } = setUp();
    expect(view.visibleArea()).toEqual(camera.visibleArea(MAP.width, MAP.height));
    expect([view.screenWidth, view.screenHeight]).toEqual([1280, 720]);

    view.follow({ x: 520, y: 300 });
    view.follow(null);

    expect(view.visibleArea().x).toBeGreaterThan(500 - FOLLOW_VIEW_WIDTH / 2);
  });

  it('projects canvas CSS pixels through the following camera at the pixel ratio', () => {
    const { view } = setUp(2);
    const area = view.visibleArea();

    // 640 × 360 CSS pixels on a 2× display is the canvas's far corner.
    const corner = view.screenToWorld({ x: 640, y: 360 });

    expect(corner.x).toBeCloseTo(area.x + area.width);
    expect(corner.y).toBeCloseTo(area.y + area.height);
  });

  it('stops following after a minimap jump, until the player moves', () => {
    const { view } = setUp();
    view.lookAt({ x: 900, y: 400 });
    const jumped = view.visibleArea();

    view.follow({ x: 100, y: 100 });
    expect(view.visibleArea()).toEqual(jumped);
    view.playerMoved();
    view.follow({ x: 100, y: 100 });
    expect(view.visibleArea()).not.toEqual(jumped);
  });

  it('zooms the free view in on a minimap jump while exploring', () => {
    const { view } = setUp();
    view.overview();
    const overview = view.visibleArea();

    view.lookAt({ x: MAP.width / 2, y: MAP.height / 2 });

    expect(view.visibleArea().width).toBeCloseTo(overview.width / EXPLORER_SETTINGS.minimapZoom);
  });

  it('stays inside the cathedral while the player moves, until it leaves for the camera', () => {
    const { camera, view } = setUp();
    view.overview();
    const overview = view.visibleArea();
    const onEntry = {
      x: ((ENTRY.center.x - overview.x) / overview.width) * 1280,
      y: ((ENTRY.center.y - overview.y) / overview.height) * 720,
    };

    expect(view.enterAt(onEntry.x, onEntry.y)).toBe(true);
    const inside = view.visibleArea();
    view.playerMoved();
    expect(view.isInterior).toBe(true);
    expect(view.visibleArea()).toEqual(inside);
    view.leaveInterior();
    expect(view.isInterior).toBe(false);
    expect(view.visibleArea()).toEqual(camera.visibleArea(MAP.width, MAP.height));
  });
});
