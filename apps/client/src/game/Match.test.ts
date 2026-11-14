import {
  createDefaultGameConfig,
  type InputIntent,
  MapPresentationBuilder,
  MemoryLogger,
  NullLogger,
  Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { MINI_MAP_DESIGN_FRAME, MINI_MAP_RING } from '../bridge/minimapRing';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { type PlayerChoice, withPlayer } from './__fixtures__/withPlayer';
import { Camera } from './engine/Camera';
import type { Projection } from './engine/input/Projection.types';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';
import { FOCUS_RING_COLOR } from './views/entityViews.constants';

const SEED = 1;
const PLAYER: PlayerChoice = { legend: 'warrior', team: 'light' };

/**
 * The centre of the HUD minimap ring on the tests' 1280 × 720 canvas (device pixels), from the
 * ring `bridge/minimapRing.ts` exports: a click there lands on the map only if `Match` injects
 * that ring into its `MiniMapView`.
 */
const RING_CENTRE = (() => {
  const scale = Math.min(1280 / MINI_MAP_DESIGN_FRAME.width, 720 / MINI_MAP_DESIGN_FRAME.height);
  return {
    x: 1280 - (MINI_MAP_RING.right + MINI_MAP_RING.width / 2) * scale,
    y: (MINI_MAP_RING.top + MINI_MAP_RING.height / 2) * scale,
  };
})();

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public move: Vec2 = { x: 0, y: 0 };

  public isAttacking = false;

  public aim: Vec2 | null = null;

  public projection: Projection | null = null;

  public read(projection: Projection): InputIntent {
    this.projection = projection;
    return { move: this.move, isAttacking: this.isAttacking, aim: this.aim, triggered: [] };
  }
}

/** Where a test `Simulation` finds definitions, when a test needs kinds the shipped content lacks. */
type Content = NonNullable<ConstructorParameters<typeof Simulation>[0]['content']>;

/** A rock (kind `obstacle`, which has no view of its own), alone: no human slot plays on it. */
const CONTENT_WITH_A_ROCK: Content = (() => {
  const definitions = [
    {
      id: 'rock',
      kind: 'obstacle',
      displayName: 'Rock',
      obstacleType: 'rock',
      footprintRadius: 1,
      health: null,
      isBurnable: false,
      weight: 1,
    },
  ];
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  return {
    has: (id: string) => byId.has(id),
    get: (id: string) => {
      const definition = byId.get(id);
      if (definition === undefined) {
        throw new Error(`No test definition "${id}".`);
      }
      return definition;
    },
  };
})();

/**
 * A match on seed 1's prepared world, with `PLAYER` the roster's human slot on the world's map
 * (core spawns the human slot at its Stronghold, and the map's hordes and guards spawn too); the
 * simulation gets the world's map objects only `withMapObjects`. With `content`, which lacks the
 * mobs the map's structures spawn, it plays in sim mode instead: no map, so no roster (a roster
 * needs the map).
 */
const setUp = (content?: Content, withMapObjects = false, playerSpecId?: string) => {
  // No countdown: core's countdown holds all movement, and these tests walk from the start.
  const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
  const world = prepareMatchWorld(config, SEED);
  const generated = world.map;
  const simulation = new Simulation({
    seed: SEED,
    logger: new NullLogger(),
    ...(content === undefined
      ? { ...withPlayer(config, PLAYER), map: generated }
      : { config, content }),
    ...(withMapObjects ? { mapObjects: world.mapObjects } : {}),
  });
  // A prepared match may have advanced its opening director tick before views are attached.
  if (playerSpecId !== undefined) simulation.step();
  const scheduler = new FakeFrameScheduler();
  const renderer = new RecordingRenderer();
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const input = new ScriptedIntent();
  const logger = new MemoryLogger();
  const match = new Match({
    ...(playerSpecId === undefined ? {} : { playerSpecId }),
    simulation,
    world,
    tickRate: config.tickRate,
    scheduler,
    renderer,
    camera,
    input,
    logger,
    onCrash: () => undefined,
    // A bus nobody listens to, at the shipped cadence.
    bridge: {
      bus: new TypedEventBus<BridgeEventMap>(),
      publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
      captureKinds: [],
    },
  });
  match.resize(1280, 720, 1);
  const lightStronghold = generated.features.find(
    (feature) => feature.kind === 'stronghold' && feature.team === 'light',
  );
  return {
    match,
    simulation,
    renderer,
    camera,
    input,
    logger,
    world,
    map: generated,
    lightStronghold,
  };
};

const playerX = (match: Match): number =>
  match.snapshot.entities.find((entity) => entity.id === match.playerEntityId)?.transform?.x ??
  Number.NaN;

const playerY = (match: Match): number =>
  match.snapshot.entities.find((entity) => entity.id === match.playerEntityId)?.transform?.y ??
  Number.NaN;

/**
 * The last minimap projection drawn (the `showWorldArea` call with a screen area): the world
 * point at the minimap's middle, and how many world units one screen pixel spans there.
 */
const lastMinimap = (renderer: RecordingRenderer) => {
  const call = renderer.calls.findLast((c) => c.op === 'showWorldArea' && c.args[1] !== undefined);
  const [view, area] = call?.op === 'showWorldArea' ? call.args : [undefined, undefined];
  if (view === undefined || area === undefined) throw new Error('No minimap drawn');
  return {
    centre: { x: view.x + view.width / 2, y: view.y + view.height / 2 },
    worldPerPixel: view.width / area.width,
  };
};

describe('Match', () => {
  it('anchors an immediate first-tick cast at the spawn rather than the world origin', () => {
    const { match, simulation, renderer } = setUp(undefined, false, 'knight');
    const origin = { x: playerX(match), y: playerY(match) };
    expect(origin.x).toBeGreaterThan(0);
    const actorId = match.playerEntityId;
    if (actorId === null) throw new Error('No test player');
    simulation.enqueueCommand({
      type: 'cast-ability',
      actorId,
      slot: 'ability-2',
      aim: { point: origin, targetId: null },
    });
    match.tick();
    match.render(0);
    const trail = renderer.calls.filter(
      (call) => call.op === 'drawWorldGlyph' && call.args[2] === '#ff681c52',
    );
    expect(trail.length).toBeGreaterThan(0);
    expect(trail[0]?.args[1]).toEqual(origin);
    match.destroy();
  });
  it('updates the main scene and minimap when a map object is destroyed', () => {
    const { match, simulation, renderer, map } = setUp(undefined, true);
    const house = new MapPresentationBuilder()
      .build(map)
      .scenery.find((piece) => piece.object?.kind === 'house' && piece.object.isFootprint);
    if (house?.object === undefined) throw new Error('Missing house');
    match.tick();
    match.render(0);
    const fills = () =>
      renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args[0]] : []));
    expect(fills()).toContainEqual(house.shape);
    const target = match.snapshot.mapObjects?.find((object) => object.id === house.object?.id);
    if (target?.entityId == null) throw new Error('Missing map object');
    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: target.entityId });
    match.tick();
    renderer.calls.length = 0;
    match.render(0);
    expect(fills()).not.toContainEqual(house.shape);
    match.destroy();
  });
  it('queues no attack while the canvas gestures own the press (a minimap click or the explorer)', () => {
    const { match, simulation, input, world } = setUp(undefined, true);
    const house = world.mapObjects.find((object) => object.kind === 'house');
    const corner = house?.footprints[0]?.[0];
    const opposite = house?.footprints[0]?.[2];
    if (corner === undefined || opposite === undefined) throw new Error('Missing house');
    match.tick();
    const enqueue = vi.spyOn(simulation, 'enqueueCommand');
    const attacks = () =>
      enqueue.mock.calls.filter(([command]) => command.type === 'attack-target').length;
    input.isAttacking = true;
    input.aim = { x: (corner.x + opposite.x) / 2, y: (corner.y + opposite.y) / 2 };

    match.controls.setPointerClaimed(true);
    match.tick();
    match.tick();
    expect(attacks()).toBe(0);
    match.controls.setPointerClaimed(false);
    match.tick();

    expect(attacks()).toBe(1);
    match.destroy();
  });

  it("attacks the map object under the explorer's click through the camera, once (DEC-150)", () => {
    const { match, simulation, camera, world, map } = setUp(undefined, true);
    const house = world.mapObjects.find((object) => object.kind === 'house');
    const corner = house?.footprints[0]?.[0];
    const opposite = house?.footprints[0]?.[2];
    if (corner === undefined || opposite === undefined) throw new Error('Missing house');
    const centre = { x: (corner.x + opposite.x) / 2, y: (corner.y + opposite.y) / 2 };
    camera.lookAt(centre);
    const view = camera.visibleArea(map.width, map.height);
    const onHouse = {
      x: ((centre.x - view.x) / view.width) * 1280,
      y: ((centre.y - view.y) / view.height) * 720,
    };
    const enqueue = vi.spyOn(simulation, 'enqueueCommand');
    const attacks = () =>
      enqueue.mock.calls.filter(([command]) => command.type === 'attack-target');
    match.tick();
    match.controls.clickAt(onHouse.x, onHouse.y);

    const targetId = match.snapshot.mapObjects?.find(({ id }) => id === house?.id)?.entityId;
    expect(targetId).toEqual(expect.any(String));
    expect(attacks()).toEqual([
      [{ type: 'attack-target', actorId: match.playerEntityId, targetId }],
    ]);
    match.destroy();
  });

  it('reports closed roofs after the same building is toggled twice', () => {
    const { match } = setUp();
    // The following camera initially centres on the light stronghold.
    expect(match.controls.hasDeveloperRoofs).toBe(false);
    expect(match.controls.clickAt(640, 360)).toBe(true);
    expect(match.controls.hasDeveloperRoofs).toBe(true);
    expect(match.controls.clickAt(640, 360)).toBe(true);
    expect(match.controls.hasDeveloperRoofs).toBe(false);
    match.destroy();
  });
  it("has the player's Warrior at the Light stronghold from construction, before any tick", () => {
    const { match, lightStronghold } = setUp();
    expect(match.playerEntityId).not.toBeNull();

    const player = match.snapshot.entities.find((entity) => entity.id === match.playerEntityId);
    expect(player).toMatchObject({ kind: 'warrior', family: 'legend', team: 'light' });
    expect(player?.transform).toMatchObject(lightStronghold?.position ?? {});
  });

  it("points the camera at the human slot's Legend from construction, before any tick or frame", () => {
    const { match, camera, map } = setUp();
    const player = match.snapshot.entities.find((entity) => entity.id === match.playerEntityId);
    if (player?.transform == null) throw new Error('Missing player');
    const expected = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
    expected.lookAt(player.transform);

    expect(camera.visibleArea(map.width, map.height)).toEqual(
      expected.visibleArea(map.width, map.height),
    );
  });

  it('points the camera at the middle of the map when there is no player Legend', () => {
    const { match, camera, map } = setUp(CONTENT_WITH_A_ROCK);
    const view = camera.visibleArea(map.width, map.height);

    expect(match.playerEntityId).toBeNull();
    expect(view.x + view.width / 2).toBeCloseTo(map.width / 2);
    expect(view.y + view.height / 2).toBeCloseTo(map.height / 2);
  });

  it('walks east while the intent says east, and coasts to a stop when it is released', () => {
    const { match, input, lightStronghold } = setUp();
    const startX = lightStronghold?.position.x ?? Number.NaN;
    match.tick();

    input.move = { x: 1, y: 0 };
    for (let tick = 0; tick < 60; tick += 1) {
      match.tick();
    }
    const walked = playerX(match);
    expect(walked).toBeGreaterThan(startX);

    input.move = { x: 0, y: 0 };
    match.tick();
    expect(playerX(match)).toBeGreaterThan(walked);
    for (let tick = 0; tick < 30; tick += 1) {
      match.tick();
    }
    const rested = playerX(match);
    match.tick();
    expect(playerX(match)).toBe(rested);
  });

  it('draws the scene with the camera on the player and the player ringed', () => {
    const { match, renderer, camera, map, lightStronghold } = setUp();
    match.tick();

    match.render(0);

    const ops = renderer.calls.map((call) => call.op);
    expect(ops).toContain('clear');
    expect(ops).toContain('showWorldArea');
    expect(
      renderer.calls.some(
        (call) => call.op === 'drawWorldGlyph' && call.args[2] === FOCUS_RING_COLOR,
      ),
    ).toBe(true);
    expect(
      camera.contains(lightStronghold?.position ?? { x: -1, y: -1 }, map.width, map.height),
    ).toBe(true);
  });

  it('centres the minimap on the player and keeps it there as the player moves (DEC-182)', () => {
    const { match, renderer, input } = setUp();
    match.tick();
    const start = { x: playerX(match), y: playerY(match) };
    match.render(0);
    const before = lastMinimap(renderer).centre;
    input.move = { x: 1, y: 0 };
    for (let tick = 0; tick < 10; tick += 1) match.tick();
    match.render(0);
    const after = lastMinimap(renderer).centre;

    expect(before.x).toBeCloseTo(start.x);
    expect(before.y).toBeCloseTo(start.y);
    expect(after.x).toBeCloseTo(playerX(match));
    expect(after.y).toBeCloseTo(playerY(match));
    expect(after.x).toBeGreaterThan(before.x);
  });

  it('centres the minimap on the camera once the player is gone, and maps clicks around it', () => {
    const { match, renderer, simulation, camera, map } = setUp();
    match.tick();
    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: match.playerEntityId ?? '' });
    match.tick();
    expect(playerX(match)).toBeNaN();
    match.render(0);
    const view = camera.visibleArea(map.width, map.height);
    const { centre, worldPerPixel } = lastMinimap(renderer);
    const lookAt = vi.spyOn(camera, 'lookAt');

    // 40 px east of the ring's centre (DEC-182: no living Legend, so the camera's focus).
    const clicked = match.controls.lookAtMinimapPoint(RING_CENTRE.x + 40, RING_CENTRE.y);

    expect(centre.x).toBeCloseTo(view.x + view.width / 2);
    expect(centre.y).toBeCloseTo(view.y + view.height / 2);
    expect(clicked).toBe(true);
    expect(lookAt.mock.calls[0]?.[0].x).toBeCloseTo(centre.x + 40 * worldPerPixel);
    expect(lookAt.mock.calls[0]?.[0].y).toBeCloseTo(centre.y);
  });

  it('stops following the player after a minimap click, until the player moves again', () => {
    const { match, renderer, camera, input, map } = setUp();
    match.tick();
    match.render(0);
    const { centre, worldPerPixel } = lastMinimap(renderer);

    // 40 px east of the ring's centre: a point east of the player (DEC-182).
    const clickedMinimap = match.controls.lookAtMinimapPoint(RING_CENTRE.x + 40, RING_CENTRE.y);
    const lookedAt = camera.visibleArea(map.width, map.height);
    match.render(0);

    expect(clickedMinimap).toBe(true);
    // The view is on the clicked point, not the player, and the next frame keeps it there.
    expect(lookedAt.x + lookedAt.width / 2).toBeCloseTo(centre.x + 40 * worldPerPixel);
    expect(lookedAt.x + lookedAt.width / 2).toBeGreaterThan(playerX(match) + lookedAt.width);
    expect(camera.visibleArea(map.width, map.height)).toEqual(lookedAt);
    expect(match.controls.lookAtMinimapPoint(1, 1)).toBe(false);

    input.move = { x: 1, y: 0 };
    match.tick();
    match.render(0);
    expect(camera.visibleArea(map.width, map.height)).not.toEqual(lookedAt);
  });

  it('logs once for each kind it has to draw with the default view', () => {
    const { match, simulation, logger } = setUp(CONTENT_WITH_A_ROCK);
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'obstacle',
      definitionId: 'rock',
      team: 'neutral',
      at: { x: 100, y: 100 },
      count: 2,
    });
    match.tick();

    match.render(0);
    match.render(0);

    expect(
      logger.records.map(({ severityText, scope, body }) => [severityText, scope, body]),
    ).toEqual([['WARN', 'client.views', 'No view for kind "obstacle"; drawing the default view.']]);
  });

  it('draws the lane hordes and other mobs with their own view, logging no default-view warning', () => {
    const { match, simulation, logger } = setUp();
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 100, y: 100 },
      count: 2,
    });
    match.tick();

    match.render(0);
    match.render(0);

    const minions = match.snapshot.entities.filter(
      (entity) => entity.definitionId === 'light-minion',
    );
    expect(minions.length).toBeGreaterThan(0);
    expect(logger.records.filter(({ severityText }) => severityText === 'WARN')).toEqual([]);
  });

  it('follows again when the player keeps moving after a minimap click', () => {
    const { match, camera, input, map } = setUp();
    match.tick();
    input.move = { x: 1, y: 0 };
    match.tick();

    match.controls.lookAtMinimapPoint(RING_CENTRE.x, RING_CENTRE.y);
    const lookedAt = camera.visibleArea(map.width, map.height);
    match.tick();
    match.render(0);

    expect(camera.visibleArea(map.width, map.height)).not.toEqual(lookedAt);
  });

  it('projects the pointer through the camera: the canvas centre is the camera centre', () => {
    const { match, input, camera, map } = setUp();
    match.resize(1280, 720, 2);
    match.tick();
    match.tick();
    const view = camera.visibleArea(map.width, map.height);

    // 640 × 360 CSS pixels on a 2× display is the middle of the 1280 × 720 device-pixel canvas.
    const aim = input.projection?.screenToWorld({ x: 320, y: 180 });

    expect(aim?.x).toBeCloseTo(view.x + view.width / 2);
    expect(aim?.y).toBeCloseTo(view.y + view.height / 2);
  });
});
