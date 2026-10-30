import {
  createDefaultGameConfig,
  type InputIntent,
  MapGenerator,
  NullLogger,
  Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import type { WorldRect } from './engine/render/Renderer.types';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource } from './Match.types';

const SCREEN = { width: 1280, height: 720 };

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public move: Vec2 = { x: 0, y: 0 };

  public read(): InputIntent {
    return { move: this.move, aim: null, triggered: [] };
  }
}

const setUp = () => {
  const config = createDefaultGameConfig();
  const map = new MapGenerator().generate(config, 1);
  const renderer = new RecordingRenderer();
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const input = new ScriptedIntent();
  const match = new Match({
    simulation: new Simulation({ config, seed: 1, logger: new NullLogger() }),
    map,
    tickRate: config.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer,
    camera,
    input,
    player: { legend: 'warrior', team: 'light' },
    logger: new NullLogger(),
  });
  match.resize(SCREEN.width, SCREEN.height, 1);
  match.tick();
  /** Draws a frame and returns the world area it showed. */
  const shown = (): WorldRect => {
    renderer.calls.length = 0;
    match.render(0);
    const call = renderer.calls.find((entry) => entry.op === 'showWorldArea');
    return call?.op === 'showWorldArea' ? call.args[0] : { x: 0, y: 0, width: 0, height: 0 };
  };
  const cathedral = map.features.find((feature) => feature.kind === 'cathedral')?.position;
  /** The screen point (device pixels) of a world point in `view`. */
  const toScreen = (point: Vec2, view: WorldRect): Vec2 => ({
    x: ((point.x - view.x) / view.width) * SCREEN.width,
    y: ((point.y - view.y) / view.height) * SCREEN.height,
  });
  return { match, camera, input, map, renderer, shown, cathedral, toScreen };
};

describe('Match free view', () => {
  it('shows the whole battlefield on overview, and follows the player again once they move', () => {
    const { match, input, map, shown } = setUp();
    const following = shown();

    match.overview();
    const overview = shown();

    expect(overview.width).toBeGreaterThanOrEqual(map.width);
    expect(overview.height).toBeGreaterThanOrEqual(map.height);
    input.move = { x: 1, y: 0 };
    match.tick();
    expect(shown().width).toBeCloseTo(following.width);
  });

  it('starts a drag from the camera view without jumping, then pans it', () => {
    const { match, shown } = setUp();
    const before = shown();

    match.panBy(0, 0);
    const start = shown();
    match.panBy(-SCREEN.width / 2, 0);
    const panned = shown();

    expect(start.x).toBeCloseTo(before.x);
    expect(start.width).toBeCloseTo(before.width);
    expect(panned.x).toBeCloseTo(start.x + start.width / 2);
  });

  it('zooms the following camera, and the free view once exploring', () => {
    const { match, camera, shown } = setUp();

    match.zoomBy(2);
    expect(camera.zoom).toBe(2);

    match.overview();
    const overview = shown();
    match.zoomBy(2);
    expect(shown().width).toBeCloseTo(overview.width / 2);
    expect(camera.zoom).toBe(2);
  });

  it('toggles the cathedral roof in the same world and restores it on overview', () => {
    const { match, input, renderer, shown, cathedral, toScreen } = setUp();
    match.overview();
    const view = shown();

    expect(match.toggleRoofAt(0, 0)).toBe(false);
    const onCathedral = toScreen(cathedral ?? { x: -1, y: -1 }, view);
    expect(match.toggleRoofAt(onCathedral.x, onCathedral.y)).toBe(true);
    expect(match.hasOpenRoofs).toBe(true);
    const inside = shown();
    expect(inside).toEqual(view);
    expect(
      renderer.calls.some((call) => call.op === 'fillPolygon' && call.args[1] === '#938e7c'),
    ).toBe(true);

    // Walking resumes player following while the roof remains open.
    input.move = { x: 1, y: 0 };
    match.tick();
    expect(shown().width).toBeCloseTo(FOLLOW_VIEW_WIDTH);
    expect(match.hasOpenRoofs).toBe(true);

    match.overview();
    expect(match.hasOpenRoofs).toBe(false);
  });
});
