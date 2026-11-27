import {
  CORNER_CAMP_RING,
  createDefaultGameConfig,
  type InputIntent,
  MapPresentationBuilder,
  MemoryLogger,
  NullLogger,
  type RosterSlot,
  Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { MINI_MAP_DESIGN_FRAME, MINI_MAP_RING } from '../bridge/minimapRing';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { shapesOf } from './__fixtures__/sheetShapes';
import { sheetsFor } from './__fixtures__/sheetsFor';
import { SHIPPED_SPRITE_WIDTHS } from './__fixtures__/spriteWidths';
import { type PlayerChoice, withPlayer } from './__fixtures__/withPlayer';
import { Camera } from './engine/Camera';
import type { Projection } from './engine/input/Projection.types';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';
import { CUTSCENE } from './CathedralCutscene.constants';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import type { IntentSource } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';
import { FOCUS_RING_COLOR } from './views/entityViews.constants';

const SEED = 1;
const PLAYER: PlayerChoice = { legend: 'warrior', team: 'light' };
/** The player as a Knight (a warrior sub-class), so its snapshot names the Knight's sheet. */
const KNIGHT_PLAYER: PlayerChoice = { ...PLAYER, specId: 'knight' };
const KNIGHT_GRID = shapesOf('knight-sprites');
/** The dark Rover bot, an Oracle (a magus sub-class). */
const ORACLE_BOT: RosterSlot = {
  pilot: 'bot',
  team: 'dark',
  definitionId: 'magus',
  role: 'rover',
  difficulty: 'rover',
  specId: 'oracle',
};

/** What a sprite test adds to a match: the sheets, the loaded atlases, the player and the bots. */
type SpriteSetUp = {
  readonly legendSheets?: ReadonlyMap<string, LegendSpriteSheet>;
  readonly atlases?: ConstructorParameters<typeof RecordingRenderer>[0];
  readonly player?: PlayerChoice;
  readonly bots?: readonly RosterSlot[];
};

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
const setUp = (
  content?: Content,
  withMapObjects = false,
  sprites: SpriteSetUp = {},
  plannedMatchSeconds?: number,
  isDeveloperMenuEnabled = false,
) => {
  const { legendSheets, atlases = {}, player = PLAYER, bots = [] } = sprites;
  // No countdown: core's countdown holds all movement, and these tests walk from the start.
  const config = createDefaultGameConfig({
    match: {
      countdownSeconds: 0,
      ...(plannedMatchSeconds === undefined ? {} : { plannedMatchSeconds }),
    },
  });
  const world = prepareMatchWorld(config, SEED);
  const generated = world.map;
  const simulation = new Simulation({
    seed: SEED,
    logger: new NullLogger(),
    ...(content === undefined
      ? { ...withPlayer(config, player, bots), map: generated }
      : { config, content }),
    ...(withMapObjects ? { mapObjects: world.mapObjects } : {}),
  });
  const scheduler = new FakeFrameScheduler();
  const renderer = new RecordingRenderer(atlases);
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const input = new ScriptedIntent();
  const logger = new MemoryLogger();
  const bus = new TypedEventBus<BridgeEventMap>();
  const match = new Match({
    legendSheets,
    legendSpriteWidths: SHIPPED_SPRITE_WIDTHS,
    simulation,
    world,
    tickRate: config.tickRate,
    scheduler,
    renderer,
    camera,
    input,
    logger,
    observer: { crashed: () => undefined, ended: () => undefined },
    isDeveloperMenuEnabled,
    // A bus nobody listens to, at the shipped cadence.
    bridge: {
      bus,
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
    bus,
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

  it("follows the developer menu's Follow Legend with no human, and the human first (13 §4)", () => {
    const { match, bus, simulation, camera, map } = setUp(undefined, false, {}, undefined, true);
    const human = match.playerEntityId ?? '';
    // A dark bot Legend at the dark Stronghold, far from the light human.
    simulation.enqueueCommand({ type: 'dev-spawn-legend', team: 'dark', definitionId: 'warrior' });
    match.tick();
    const bot = match.snapshot.entities.find(
      ({ family, team }) => family === 'legend' && team === 'dark',
    );
    const shows = (id: string): boolean => {
      const at = match.snapshot.entities.find((entity) => entity.id === id)?.transform;
      return at !== undefined && at !== null && camera.contains(at, map.width, map.height);
    };
    const frames = (count: number): void => {
      for (let frame = 0; frame < count; frame += 1) {
        match.tick();
        match.render(0);
      }
    };
    expect(bot).toBeDefined();
    bus.emit('ui-intent', { kind: 'dev-follow', legendId: bot?.id ?? '' });
    frames(60);
    // A human is seated: the camera stays on the human's Legend.
    expect(match.developerMenu.followedLegendId).toBeNull();
    expect(shows(human)).toBe(true);
    expect(shows(bot?.id ?? '')).toBe(false);

    simulation.enqueueCommand({
      type: 'dev-set-controller',
      entityId: human,
      controllerId: 'rover',
    });
    frames(120);
    expect(match.playerEntityId).toBeNull();
    expect(match.developerMenu.followedLegendId).toBe(bot?.id);
    expect(shows(bot?.id ?? '')).toBe(true);
    match.destroy();
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

  it("draws every corner camp's ring at core's ring diameter (Match injects it into MapView)", () => {
    const { match, renderer, map } = setUp();

    match.render(0);

    const camps = map.features.filter(({ kind }) => kind === 'corner-camp');
    const rings = renderer.calls.flatMap((call) =>
      call.op === 'drawWorldGlyph' && camps.some(({ position }) => position === call.args[1])
        ? [call.args[0]]
        : [],
    );
    expect(camps.length).toBeGreaterThan(0);
    expect(rings).toEqual(camps.map(() => ({ shape: 'ring', size: 2 * CORNER_CAMP_RING.radius })));
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
    // Core refuses to remove the human's Legend outside sim mode (13 §4), so the snapshot drops it.
    const playerId = match.playerEntityId;
    const snapshot = simulation.snapshot.bind(simulation);
    vi.spyOn(simulation, 'snapshot').mockImplementation(() => {
      const real = snapshot();
      return { ...real, entities: real.entities.filter(({ id }) => id !== playerId) };
    });
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

  it('renders the selected Knight through the live match view registry', () => {
    const { match, renderer, logger } = setUp(undefined, false, {
      legendSheets: sheetsFor('knight'),
      atlases: KNIGHT_GRID,
      player: KNIGHT_PLAYER,
    });
    match.render(0);
    expect(
      renderer.calls.filter((call) => call.op === 'drawSprite').map((call) => call.args[0]),
    ).toContainEqual({ atlasId: 'knight-sprites', frame: 0 });
    expect(logger.records.filter(({ severityText }) => severityText === 'WARN')).toEqual([]);
    match.destroy();
  });

  it("draws a walk frame of the render's tick once the player's Legend has moved", () => {
    const { match, renderer, input } = setUp(undefined, false, {
      legendSheets: sheetsFor('knight'),
      atlases: KNIGHT_GRID,
      player: KNIGHT_PLAYER,
    });
    input.move = { x: 1, y: 0 };
    for (let tick = 0; tick < 10; tick += 1) match.tick();
    renderer.calls.length = 0;

    // Tick 10 plus half a tick is 0.35 s: the 0.84 s walk row has 6 frames, so frame 2 of it.
    match.render(0.5);

    const drawn = renderer.calls.findLast((call) => call.op === 'drawSprite')?.args[0];
    const frame = drawn?.frame ?? Number.NaN;
    expect(drawn?.atlasId).toBe('knight-sprites');
    // Rows 1 to 4 are the walk rows; row 0 is idle, and frame 0 is where an unset clock stays.
    expect(Math.floor(frame / 6)).toBeGreaterThanOrEqual(1);
    expect(Math.floor(frame / 6)).toBeLessThanOrEqual(4);
    expect(frame % 6).toBe(2);
    match.destroy();
  });

  it('draws the selected Knight as a disc, with one WARN, when the renderer has no atlas', () => {
    const { match, renderer, logger } = setUp(undefined, false, {
      legendSheets: sheetsFor('knight'),
      player: KNIGHT_PLAYER,
    });
    match.render(0);

    expect(renderer.calls.some((call) => call.op === 'drawSprite')).toBe(false);
    expect(
      logger.records.map(({ severityText, scope, attributes }) => [
        severityText,
        scope,
        attributes,
      ]),
    ).toEqual([['WARN', 'client.views', { atlasId: 'knight-sprites' }]]);
    match.destroy();
  });

  it("draws a bot Legend from its own sub-class's sheet, as the player's from its own", () => {
    const { match, renderer, logger } = setUp(undefined, false, {
      legendSheets: sheetsFor('knight', 'oracle'),
      atlases: shapesOf('knight-sprites', 'oracle-sprites'),
      player: KNIGHT_PLAYER,
      bots: [ORACLE_BOT],
    });
    match.render(0);

    const atlases = renderer.calls.flatMap((call) =>
      call.op === 'drawSprite' ? [call.args[0].atlasId] : [],
    );
    expect(atlases.sort()).toEqual(['knight-sprites', 'oracle-sprites']);
    expect(logger.records.filter(({ severityText }) => severityText === 'WARN')).toEqual([]);
    match.destroy();
  });

  it("draws a bot Legend whose sheet did not load as a disc, while the player's gets its sprite", () => {
    const { match, renderer, logger } = setUp(undefined, false, {
      legendSheets: sheetsFor('knight', 'oracle'),
      atlases: KNIGHT_GRID,
      player: KNIGHT_PLAYER,
      bots: [ORACLE_BOT],
    });
    match.render(0);

    const atlases = renderer.calls.flatMap((call) =>
      call.op === 'drawSprite' ? [call.args[0].atlasId] : [],
    );
    expect(atlases).toEqual(['knight-sprites']);
    expect(
      logger.records.map(({ severityText, attributes }) => [severityText, attributes]),
    ).toEqual([['WARN', { atlasId: 'oracle-sprites' }]]);
    expect(match.snapshot.entities.filter(({ specId }) => specId === 'oracle')).toHaveLength(1);
    match.destroy();
  });

  it('keeps a player far from the Cathedral on their own Legend through the eruption (DEC-371 E1)', () => {
    // A 20 s plan: the gem erupts at 10 s. The player starts at their Stronghold, far from the
    // Cathedral, so the cut-scene never takes the camera (`CathedralCutscene` tests the near case).
    const { match, camera, map } = setUp(undefined, false, {}, 20);
    const { tickRate } = createDefaultGameConfig();
    const gem = match.snapshot.entities.find(({ kind }) => kind === 'cathedral-gem')?.transform;
    if (gem == null) throw new Error('No gem');
    expect(Math.hypot(playerX(match) - gem.x, playerY(match) - gem.y)).toBeGreaterThan(
      CUTSCENE.nearRadius,
    );
    const offPlayer = () => {
      const view = camera.visibleArea(map.width, map.height);
      const centre = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
      return Math.hypot(centre.x - playerX(match), centre.y - playerY(match));
    };
    let farthest = 0;
    for (let tick = 0; tick < (10 + CUTSCENE.holdSeconds) * tickRate; tick += 1) {
      match.tick();
      match.render(1);
      if (tick > tickRate) farthest = Math.max(farthest, offPlayer());
    }

    expect(farthest).toBeLessThan(FOLLOW_VIEW_WIDTH / 10);
  });
});
