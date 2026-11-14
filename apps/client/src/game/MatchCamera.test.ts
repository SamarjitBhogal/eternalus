import { createDefaultGameConfig, MapGenerator } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { Camera } from './engine/Camera';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import { MatchCamera } from './MatchCamera';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);

/** A match camera on a 1280 × 720 canvas whose following camera looks at `(500, 300)`. */
const setUp = (pixelRatio = 1) => {
  const camera = new Camera({ x: 500, y: 300 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const view = new MatchCamera(camera, MAP);
  view.resize(1280, 720, pixelRatio);
  return { camera, view };
};

describe('MatchCamera', () => {
  it('starts the following camera farther out at a 96 by 54 world view', () => {
    expect(setUp().view.visibleArea()).toMatchObject({ width: 96, height: 54 });
  });
  it('exposes weather only while following the player, restoring it after free views', () => {
    const { view } = setUp();
    expect(view.isPlayerFollowing).toBe(true);
    view.lookAt({ x: 900, y: 400 });
    expect(view.isPlayerFollowing).toBe(false);
    view.playerMoved();
    expect(view.isPlayerFollowing).toBe(true);
    view.overview();
    expect(view.isPlayerFollowing).toBe(false);
    view.leaveExplorer();
    expect(view.isPlayerFollowing).toBe(true);
  });
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

  it('leaves the explorer for the following camera at its base zoom', () => {
    const { camera, view } = setUp();
    const following = view.visibleArea();
    view.zoomBy(2);
    view.overview();

    view.leaveExplorer();

    expect(camera.zoom).toBe(1);
    expect(view.visibleArea()).toEqual(following);
    view.follow({ x: 900, y: 400 });
    expect(view.visibleArea()).not.toEqual(following);
  });

  it('zooms the free view in on a minimap jump while exploring', () => {
    const { view } = setUp();
    view.overview();
    const overview = view.visibleArea();

    view.lookAt({ x: MAP.width / 2, y: MAP.height / 2 });

    expect(view.visibleArea().width).toBeCloseTo(overview.width / EXPLORER_SETTINGS.minimapZoom);
  });

  it('projects canvas points through the free view while exploring', () => {
    const { view } = setUp();
    view.overview();
    const area = view.visibleArea();

    const corner = view.screenToWorld({ x: 1280, y: 720 });

    expect(corner.x).toBeCloseTo(area.x + area.width);
    expect(corner.y).toBeCloseTo(area.y + area.height);
  });

  it('finds the world point under a device-pixel point in the view on screen', () => {
    const { view } = setUp(2);
    view.overview();
    const area = view.visibleArea();

    const centre = view.worldAt(640, 360);

    expect(centre.x).toBeCloseTo(area.x + area.width / 2);
    expect(centre.y).toBeCloseTo(area.y + area.height / 2);
  });
});
