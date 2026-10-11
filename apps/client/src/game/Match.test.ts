import {
  createDefaultGameConfig,
  type InputIntent,
  type MapDefinition,
  MapGenerator,
  MemoryLogger,
  NullLogger,
  Simulation,
  type Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { Camera } from './engine/Camera';
import type { Projection } from './engine/input/Projection.types';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH, PROTOTYPE_ESCORT } from './Match.constants';
import type { IntentSource } from './Match.types';
import { FOCUS_RING_COLOR } from './views/entityViews.constants';

const SEED = 1;

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public move: Vec2 = { x: 0, y: 0 };

  public projection: Projection | null = null;

  public read(projection: Projection): InputIntent {
    this.projection = projection;
    return { move: this.move, aim: null, triggered: [] };
  }
}

/** Where a test `Simulation` finds definitions, when a test needs kinds the shipped content lacks. */
type Content = NonNullable<ConstructorParameters<typeof Simulation>[0]['content']>;

/**
 * A rock (kind `obstacle`, which has no view of its own) plus the two units every match spawns,
 * with speeds already per tick as the simulation sees them.
 */
const CONTENT_WITH_A_ROCK: Content = (() => {
  const movement = { maxSpeed: 0.2, acceleration: 0.05, mass: 1 };
  const unit = { baseHealth: 100, footprintRadius: 0.5, visionRadius: 10, movement };
  const definitions = [
    { id: 'warrior', kind: 'warrior', displayName: 'Warrior', baseAether: 100, ...unit },
    // PROTOTYPE(PROTO-01) TEMPORARY: only because the demo escort spawns in every match.
    {
      id: 'light-minion',
      kind: 'light-mob',
      displayName: 'Minion',
      controller: 'follow-leader',
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

const setUp = (map?: MapDefinition, content?: Content) => {
  const config = createDefaultGameConfig();
  const generated = map ?? new MapGenerator().generate(config, SEED);
  const simulation = new Simulation({
    config,
    seed: SEED,
    logger: new NullLogger(),
    ...(content === undefined ? {} : { content }),
  });
  const scheduler = new FakeFrameScheduler();
  const renderer = new RecordingRenderer();
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const input = new ScriptedIntent();
  const logger = new MemoryLogger();
  const unsubscribes = { count: 0 };
  const subscribe = simulation.on.bind(simulation);
  vi.spyOn(simulation, 'on').mockImplementation((type, handler) => {
    const unsubscribe = subscribe(type, handler);
    return () => {
      unsubscribes.count += 1;
      unsubscribe();
    };
  });
  const match = new Match({
    simulation,
    map: generated,
    tickRate: config.tickRate,
    scheduler,
    renderer,
    camera,
    input,
    player: { legend: 'warrior', team: 'light' },
    logger,
  });
  match.resize(1280, 720, 1);
  const lightStronghold = generated.features.find(
    (feature) => feature.kind === 'stronghold' && feature.team === 'light',
  );
  return {
    match,
    simulation,
    scheduler,
    renderer,
    camera,
    input,
    logger,
    unsubscribes,
    map: generated,
    lightStronghold,
  };
};

const playerX = (match: Match): number =>
  match.snapshot.entities.find((entity) => entity.id === match.playerEntityId)?.transform?.x ??
  Number.NaN;

describe('Match', () => {
  it("spawns the player's Warrior at the Light stronghold on the first tick", () => {
    const { match, lightStronghold } = setUp();
    expect(match.playerEntityId).toBeNull();

    match.tick();

    const player = match.snapshot.entities.find((entity) => entity.id === match.playerEntityId);
    expect(player).toMatchObject({ kind: 'warrior', family: 'legend', team: 'light' });
    expect(player?.transform).toMatchObject(lightStronghold?.position ?? {});
  });

  // PROTOTYPE(PROTO-01) TEMPORARY: tests the demo escort; delete with `Match.spawnEscort`.
  it('spawns the prototype escort around the player, and the escort walks after the player', () => {
    const { match, input, lightStronghold } = setUp();
    const home = lightStronghold?.position ?? { x: Number.NaN, y: Number.NaN };
    match.tick();
    const escortX = () =>
      match.snapshot.entities
        .filter((entity) => entity.definitionId === PROTOTYPE_ESCORT.definitionId)
        .map((entity) => entity.transform?.x ?? Number.NaN);

    expect(escortX()).toHaveLength(PROTOTYPE_ESCORT.count);
    for (const entity of match.snapshot.entities.filter((e) => e.family === 'mob')) {
      const distance = Math.hypot(
        (entity.transform?.x ?? 0) - home.x,
        (entity.transform?.y ?? 0) - home.y,
      );
      expect(distance).toBeCloseTo(PROTOTYPE_ESCORT.spawnRadius, 1);
      expect(entity.team).toBe('light');
    }

    input.move = { x: 1, y: 0 };
    for (let tick = 0; tick < 90; tick += 1) {
      match.tick();
    }
    for (const x of escortX()) {
      expect(x).toBeGreaterThan(home.x + PROTOTYPE_ESCORT.spawnRadius);
    }
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

  it('plays the same way twice for the same seed and intents (deterministic)', () => {
    const play = (): number => {
      const { match, input } = setUp();
      for (let tick = 0; tick < 300; tick += 1) {
        input.move = tick < 150 ? { x: 1, y: 0 } : { x: 0, y: 1 };
        match.tick();
      }
      return playerX(match);
    };

    expect(play()).toBe(play());
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

  it('runs whole ticks from the loop: 100 ms of frames is 3 ticks', () => {
    const { match, simulation, scheduler } = setUp();
    match.start();
    scheduler.advance(0);

    scheduler.runFrames(5, 20);

    expect(simulation.tick).toBe(3);
  });

  it('stops following the player after a minimap click, until the player moves again', () => {
    const { match, camera, input, map } = setUp();
    match.tick();
    const minimap = { x: 1280 * 0.8, y: 720 * 0.8 };

    const clickedMinimap = match.lookAtMinimapPoint(minimap.x, minimap.y);
    const lookedAt = camera.visibleArea(map.width, map.height);
    match.render(0);

    expect(clickedMinimap).toBe(true);
    expect(camera.visibleArea(map.width, map.height)).toEqual(lookedAt);
    expect(match.lookAtMinimapPoint(1, 1)).toBe(false);

    input.move = { x: 1, y: 0 };
    match.tick();
    match.render(0);
    expect(camera.visibleArea(map.width, map.height)).not.toEqual(lookedAt);
  });

  it('stops the loop and its subscription on destroy: 0 scheduled frames, 0 listeners', () => {
    const { match, scheduler, simulation, unsubscribes } = setUp();
    match.start();

    match.destroy();
    scheduler.advance(1000);

    expect(scheduler.hasPendingFrame).toBe(false);
    expect(simulation.tick).toBe(0);
    expect(unsubscribes.count).toBe(1);
  });

  it('logs once for each kind it has to draw with the default view', () => {
    const { match, simulation, logger } = setUp(undefined, CONTENT_WITH_A_ROCK);
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

  it('draws mobs with their own view, so the escort and other mobs log no default-view warning', () => {
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

    expect(logger.records.filter(({ severityText }) => severityText === 'WARN')).toEqual([]);
  });

  it('follows again when the player keeps moving after a minimap click', () => {
    const { match, camera, input, map } = setUp();
    match.tick();
    input.move = { x: 1, y: 0 };
    match.tick();

    match.lookAtMinimapPoint(1280 * 0.8, 720 * 0.8);
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

  it('refuses a map without a stronghold for the player team', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), SEED);
    const withoutLight = {
      ...map,
      features: map.features.filter((feature) => feature.team !== 'light'),
    };

    const config = createDefaultGameConfig();
    const simulation = new Simulation({ config, seed: SEED, logger: new NullLogger() });
    const on = vi.spyOn(simulation, 'on');

    expect(
      () =>
        new Match({
          simulation,
          map: withoutLight,
          tickRate: config.tickRate,
          scheduler: new FakeFrameScheduler(),
          renderer: new RecordingRenderer(),
          camera: new Camera({ x: 0, y: 0 }, 10, 10),
          input: new ScriptedIntent(),
          player: { legend: 'warrior', team: 'light' },
          logger: new MemoryLogger(),
        }),
    ).toThrow(`Map "${map.id}" has no light stronghold`);
    expect(on).not.toHaveBeenCalled();
  });
});
