import {
  createDefaultGameConfig,
  type EntitySnapshot,
  type GameEventMap,
  MemoryLogger,
  NullLogger,
  Simulation,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { TypedEventBus } from '../bridge/TypedEventBus';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import type { MatchSimulation } from './Match.types';
import { PlayerLegendSprite } from './PlayerLegendSprite';

const TICK_RATE = 30;
const KNIGHT_SHEET = LEGEND_SPRITE_SHEETS.knight;
const KNIGHT_GRID = { 'knight-sprites': { columns: 6, rows: 10 } };

/** The player's Knight, alive, facing south: it plays the idle row (row 0). */
const HERO: EntitySnapshot = {
  id: 'hero',
  kind: 'knight',
  family: 'legend',
  definitionId: 'knight',
  team: 'light',
  transform: { x: 10, y: 20, radius: 0.75, facing: { x: 0, y: 1 } },
  health: { current: 800, max: 800 },
  aether: null,
  progression: null,
  area: null,
  capture: null,
  gem: null,
};

/** A simulation whose events come from `bus`, so a test can count its listeners. */
function busSimulation(): {
  readonly bus: TypedEventBus<GameEventMap>;
  readonly simulation: MatchSimulation;
} {
  const bus = new TypedEventBus<GameEventMap>();
  const snapshot = new Simulation({
    config: createDefaultGameConfig(),
    seed: 1,
    logger: new NullLogger(),
  }).snapshot();
  const simulation: MatchSimulation = {
    tick: 0,
    on: bus.on.bind(bus),
    step: () => undefined,
    snapshot: () => snapshot,
    enqueueCommand: () => undefined,
  };
  return { bus, simulation };
}

/** The frame the sprite's view draws for `HERO`, read from the `drawSprite` call. */
function drawnFrame(sprite: PlayerLegendSprite): unknown {
  const renderer = new RecordingRenderer();
  sprite.view?.draw(
    { entity: HERO, position: { x: 10, y: 20 }, facing: { x: 0, y: 1 }, isFocused: false },
    renderer,
  );
  return renderer.calls.find((call) => call.op === 'drawSprite')?.args[0];
}

describe('PlayerLegendSprite', () => {
  it('has no view and subscribes to nothing when the player has no sprite sheet', () => {
    const { bus, simulation } = busSimulation();
    const logger = new MemoryLogger();

    const sprite = new PlayerLegendSprite(
      { tickRate: TICK_RATE, simulation, renderer: new RecordingRenderer(KNIGHT_GRID), logger },
      HERO.id,
    );

    expect(sprite.view).toBeUndefined();
    expect(bus.listenerCount()).toBe(0);
    expect(logger.records).toEqual([]);
    sprite.destroy();
  });

  it('draws the frames of the tick that the render step sets', () => {
    const { simulation } = busSimulation();
    const sprite = new PlayerLegendSprite(
      {
        ...(KNIGHT_SHEET === undefined ? {} : { playerSheet: KNIGHT_SHEET }),
        tickRate: TICK_RATE,
        simulation,
        renderer: new RecordingRenderer(KNIGHT_GRID),
        logger: new MemoryLogger(),
      },
      HERO.id,
    );

    // The idle row has 6 frames over 1.2 s: tick 9 (0.3 s) is frame 1, tick 15 (0.5 s) frame 2.
    sprite.setFrameTick(0);
    const atStart = drawnFrame(sprite);
    sprite.setFrameTick(9);
    const atNine = drawnFrame(sprite);
    sprite.setFrameTick(15);
    const atFifteen = drawnFrame(sprite);

    expect([atStart, atNine, atFifteen]).toEqual([
      { atlasId: 'knight-sprites', frame: 0 },
      { atlasId: 'knight-sprites', frame: 1 },
      { atlasId: 'knight-sprites', frame: 2 },
    ]);
    sprite.destroy();
  });

  it("stops listening to the simulation's events on destroy", () => {
    const { bus, simulation } = busSimulation();
    const sprite = new PlayerLegendSprite(
      {
        ...(KNIGHT_SHEET === undefined ? {} : { playerSheet: KNIGHT_SHEET }),
        tickRate: TICK_RATE,
        simulation,
        renderer: new RecordingRenderer(KNIGHT_GRID),
        logger: new MemoryLogger(),
      },
      HERO.id,
    );
    const whileAlive = bus.listenerCount();

    sprite.destroy();

    expect(whileAlive).toBe(1);
    expect(bus.listenerCount()).toBe(0);
  });
});
