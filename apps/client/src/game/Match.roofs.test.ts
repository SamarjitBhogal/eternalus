import {
  createDefaultGameConfig,
  type InputIntent,
  isPointInPolygon,
  NullLogger,
  type Polygon,
  Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import type { WorldRect } from './engine/render/Renderer.types';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const SCREEN = { width: 1280, height: 720 };
/** The most ticks the walk-out test waits for the Legend to leave its Stronghold (60 s). */
const MAX_WALK_TICKS = 1800;

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public move: Vec2 = { x: 0, y: 0 };

  public read(): InputIntent {
    return { move: this.move, aim: null, triggered: [] };
  }
}

/**
 * A match on seed 1's world whose player is a Light Warrior; it spawns at the Light Stronghold,
 * inside the Stronghold's building. No map in the simulation, so nothing blocks the walk out.
 */
const setUp = () => {
  const config = createDefaultGameConfig();
  const world = prepareMatchWorld(config, 1);
  const simulation = new Simulation({ config, seed: 1, logger: new NullLogger() });
  const renderer = new RecordingRenderer();
  const input = new ScriptedIntent();
  const match = new Match({
    simulation,
    world,
    tickRate: config.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer,
    camera: new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT),
    input,
    player: { legend: 'warrior', team: 'light' },
    logger: new NullLogger(),
    onCrash: () => undefined,
    bridge: {
      bus: new TypedEventBus<BridgeEventMap>(),
      publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
      captureKinds: [],
    },
  });
  match.resize(SCREEN.width, SCREEN.height, 1);
  /** The roof pieces of `buildingId` the last frame drew, out of all of them. */
  const roofsDrawn = (buildingId: string): { drawn: number; of: number } => {
    renderer.calls.length = 0;
    match.render(0);
    const fills = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' ? [call.args[0]] : [],
    );
    const roof = world.presentation.scenery.filter(
      (piece) => piece.buildingId === buildingId && piece.visibility === 'roof',
    );
    return { drawn: roof.filter((piece) => fills.includes(piece.shape)).length, of: roof.length };
  };
  const footprintOf = (buildingId: string): readonly Polygon[] =>
    world.presentation.buildings.find(({ id }) => id === buildingId)?.footprint ?? [];
  const playerPosition = (): Vec2 | null =>
    match.snapshot.entities.find(({ id }) => id === match.playerEntityId)?.transform ?? null;
  /** The screen point (device pixels) of a world point in the view the last frame showed. */
  const toScreen = (point: Vec2): Vec2 => {
    renderer.calls.length = 0;
    match.render(0);
    const call = renderer.calls.find((entry) => entry.op === 'showWorldArea');
    const view: WorldRect =
      call?.op === 'showWorldArea' ? call.args[0] : { x: 0, y: 0, width: 1, height: 1 };
    return {
      x: ((point.x - view.x) / view.width) * SCREEN.width,
      y: ((point.y - view.y) / view.height) * SCREEN.height,
    };
  };
  const cathedral = world.map.features.find(({ kind }) => kind === 'cathedral')?.position;
  return { match, simulation, input, roofsDrawn, footprintOf, playerPosition, toScreen, cathedral };
};

describe("Match roofs: the player's building opens (DEC-143)", () => {
  it('cuts away the roof of the building the Legend stands in, and only that one', () => {
    const { match, roofsDrawn } = setUp();
    const before = roofsDrawn('light-stronghold');
    expect(before.of).toBeGreaterThan(0);
    expect(before.drawn).toBe(before.of);

    match.tick();

    expect(roofsDrawn('light-stronghold').drawn).toBe(0);
    const cathedral = roofsDrawn('cathedral-lane-1');
    expect(cathedral.drawn).toBe(cathedral.of);
    expect(match.hasDeveloperRoofs).toBe(false);
  });

  it('puts the roof back when the Legend walks out of the building', () => {
    const { match, input, roofsDrawn, footprintOf, playerPosition } = setUp();
    match.tick();
    expect(roofsDrawn('light-stronghold').drawn).toBe(0);
    const footprint = footprintOf('light-stronghold');
    const isInside = (): boolean => {
      const at = playerPosition();
      return at !== null && footprint.some((shape) => isPointInPolygon(at, shape));
    };
    expect(isInside()).toBe(true);

    input.move = { x: 1, y: 0 };
    for (let tick = 0; tick < MAX_WALK_TICKS && isInside(); tick += 1) match.tick();

    expect(isInside()).toBe(false);
    const roof = roofsDrawn('light-stronghold');
    expect(roof.drawn).toBe(roof.of);
  });

  it('puts the roof back when the Legend dies (it leaves the snapshot)', () => {
    const { match, simulation, roofsDrawn } = setUp();
    match.tick();
    expect(roofsDrawn('light-stronghold').drawn).toBe(0);
    const entityId = match.playerEntityId;
    if (entityId === null) throw new Error('the player did not spawn');

    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId });
    match.tick();

    const roof = roofsDrawn('light-stronghold');
    expect(roof.drawn).toBe(roof.of);
  });

  it('puts the roof back when the Legend is at 0 health but still in the snapshot', () => {
    const { match, simulation, roofsDrawn, footprintOf, playerPosition } = setUp();
    match.tick();
    expect(roofsDrawn('light-stronghold').drawn).toBe(0);
    const entityId = match.playerEntityId;
    if (entityId === null) throw new Error('the player did not spawn');
    // Respawn (FR-051) keeps a dead Legend in the store; stand in with its health at 0 (DEC-149).
    const snapshot = simulation.snapshot.bind(simulation);
    vi.spyOn(simulation, 'snapshot').mockImplementation(() => {
      const real = snapshot();
      return {
        ...real,
        entities: real.entities.map((entity) =>
          entity.id === entityId && entity.health !== null
            ? { ...entity, health: { ...entity.health, current: 0 } }
            : entity,
        ),
      };
    });

    match.tick();

    expect(match.snapshot.entities.find(({ id }) => id === entityId)?.health?.current).toBe(0);
    const at = playerPosition();
    const footprint = footprintOf('light-stronghold');
    expect(at !== null && footprint.some((shape) => isPointInPolygon(at, shape))).toBe(true);
    const roof = roofsDrawn('light-stronghold');
    expect(roof.drawn).toBe(roof.of);
  });

  it("combines with the developer's roofs: the overview restores those, not the Legend's", () => {
    const { match, roofsDrawn, toScreen, cathedral: centre } = setUp();
    match.tick();
    match.overview();
    const onCathedral = toScreen(centre ?? { x: -1, y: -1 });
    expect(match.toggleRoofAt(onCathedral.x, onCathedral.y)).toBe(true);
    expect(match.hasDeveloperRoofs).toBe(true);
    expect(roofsDrawn('cathedral-lane-1').drawn).toBe(0);

    match.overview();

    expect(match.hasDeveloperRoofs).toBe(false);
    const cathedral = roofsDrawn('cathedral-lane-1');
    expect(cathedral.drawn).toBe(cathedral.of);
    expect(roofsDrawn('light-stronghold').drawn).toBe(0);
  });
});
