import {
  createDefaultGameConfig,
  type InputIntent,
  NullLogger,
  Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import type { WorldRect } from './engine/render/Renderer.types';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource, PlayerChoice } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';
import { seatedConfig } from './seatedConfig';

const PLAYER: PlayerChoice = { legend: 'warrior', team: 'light' };
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
  const world = prepareMatchWorld(config, 1);
  const { map } = world;
  const renderer = new RecordingRenderer();
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const input = new ScriptedIntent();
  const match = new Match({
    simulation: new Simulation({
      config: seatedConfig(config, world.map, PLAYER),
      seed: 1,
      logger: new NullLogger(),
    }),
    world,
    tickRate: config.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer,
    camera,
    input,
    player: PLAYER,
    logger: new NullLogger(),
    onCrash: () => undefined,
    bridge: {
      bus: new TypedEventBus<BridgeEventMap>(),
      publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
      captureKinds: [],
    },
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

  it('enters the cathedral on a click on it, draws the interior and leaves on overview', () => {
    const { match, input, renderer, shown, cathedral, toScreen } = setUp();
    match.overview();
    const view = shown();

    expect(match.enterAt(0, 0)).toBe(false);
    const onCathedral = toScreen(cathedral ?? { x: -1, y: -1 }, view);
    expect(match.enterAt(onCathedral.x, onCathedral.y)).toBe(true);
    expect(match.isInterior).toBe(true);
    const inside = shown();
    expect(inside.height).toBeLessThanOrEqual(2200);
    expect(
      renderer.calls.some((call) => call.op === 'fillPolygon' && call.args[1] === '#938e7c'),
    ).toBe(true);

    // Walking does not drop the player out of the cathedral view.
    input.move = { x: 1, y: 0 };
    match.tick();
    expect(shown()).toEqual(inside);

    match.overview();
    expect(match.isInterior).toBe(false);
  });

  it('leaves the cathedral for the following camera (normal play, I-55)', () => {
    const { match, shown, cathedral, toScreen } = setUp();
    const following = shown();
    match.overview();
    const onCathedral = toScreen(cathedral ?? { x: -1, y: -1 }, shown());
    expect(match.enterAt(onCathedral.x, onCathedral.y)).toBe(true);

    match.leaveInterior();

    expect(match.isInterior).toBe(false);
    expect(shown()).toEqual(following);
  });
});
