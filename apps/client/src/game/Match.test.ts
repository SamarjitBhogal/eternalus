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

/**
 * A rock (kind `obstacle`, which has no view of its own) plus the player's Legend, with speeds already per tick as the simulation sees them.
 */
const CONTENT_WITH_A_ROCK: Content = (() => {
  const movementProfile = { maxSpeed: 0.2, acceleration: 0.05, mass: 1 };
  const unit = { baseHealth: 100, footprintRadius: 0.5, visionRadius: 10, movementProfile };
  const definitions = [
    {
      id: 'warrior',
      kind: 'warrior',
      displayName: 'Warrior',
      baseAether: 100,
      levelCurveId: 'legend',
      levelScaling: { healthPerLevel: 0.08, aetherPerLevel: 10 },
      defaultLoadout: { primaryWeaponId: 'raptor-talons' },
      ...unit,
    },
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
 * A match on seed 1's prepared world. The simulation gets the map only `withHordes` (its lane
 * hordes spawn), and the world's map objects only `withMapObjects`.
 */
const setUp = (content?: Content, withHordes = false, withMapObjects = false) => {
  const config = createDefaultGameConfig();
  const world = prepareMatchWorld(config, SEED);
  const generated = world.map;
  const simulation = new Simulation({
    config,
    seed: SEED,
    logger: new NullLogger(),
    ...(content === undefined ? {} : { content }),
    ...(withMapObjects ? { mapObjects: world.mapObjects } : {}),
    ...(withHordes ? { map: generated } : {}),
  });
  const scheduler = new FakeFrameScheduler();
  const renderer = new RecordingRenderer();
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const input = new ScriptedIntent();
  const logger = new MemoryLogger();
  const match = new Match({
    simulation,
    world,
    tickRate: config.tickRate,
    scheduler,
    renderer,
    camera,
    input,
    player: { legend: 'warrior', team: 'light' },
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

describe('Match', () => {
  it('updates the main scene and minimap when a map object is destroyed', () => {
    const { match, simulation, renderer, map } = setUp(undefined, true, true);
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
    const { match, simulation, input, world } = setUp(undefined, true, true);
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

    match.setPointerClaimed(true);
    match.tick();
    match.tick();
    expect(attacks()).toBe(0);
    match.setPointerClaimed(false);
    match.tick();

    expect(attacks()).toBe(1);
    match.destroy();
  });

  it("attacks the map object under the explorer's click through the camera, once (DEC-150)", () => {
    const { match, simulation, camera, world, map } = setUp(undefined, true, true);
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
    // No player Legend before the first tick: no attack.
    match.clickAt(onHouse.x, onHouse.y);
    expect(attacks()).toEqual([]);

    match.tick();
    match.clickAt(onHouse.x, onHouse.y);

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
    expect(match.hasDeveloperRoofs).toBe(false);
    expect(match.clickAt(640, 360)).toBe(true);
    expect(match.hasDeveloperRoofs).toBe(true);
    expect(match.clickAt(640, 360)).toBe(true);
    expect(match.hasDeveloperRoofs).toBe(false);
    match.destroy();
  });
  it("spawns the player's Warrior at the Light stronghold on the first tick", () => {
    const { match, lightStronghold } = setUp();
    expect(match.playerEntityId).toBeNull();

    match.tick();

    const player = match.snapshot.entities.find((entity) => entity.id === match.playerEntityId);
    expect(player).toMatchObject({ kind: 'warrior', family: 'legend', team: 'light' });
    expect(player?.transform).toMatchObject(lightStronghold?.position ?? {});
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

  it('stops following the player after a minimap click, until the player moves again', () => {
    const { match, camera, input, map } = setUp();
    match.tick();

    const clickedMinimap = match.lookAtMinimapPoint(RING_CENTRE.x, RING_CENTRE.y);
    const lookedAt = camera.visibleArea(map.width, map.height);
    match.render(0);

    expect(clickedMinimap).toBe(true);
    // The ring's centre is the map's centre.
    expect(lookedAt.x + lookedAt.width / 2).toBeCloseTo(map.width / 2);
    expect(lookedAt.y + lookedAt.height / 2).toBeCloseTo(map.height / 2);
    expect(camera.visibleArea(map.width, map.height)).toEqual(lookedAt);
    expect(match.lookAtMinimapPoint(1, 1)).toBe(false);

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
    const { match, simulation, logger } = setUp(undefined, true);
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

    match.lookAtMinimapPoint(RING_CENTRE.x, RING_CENTRE.y);
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
