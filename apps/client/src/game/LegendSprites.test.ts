import {
  createDefaultGameConfig,
  type EntitySnapshot,
  type GameEventMap,
  MemoryLogger,
  NullLogger,
  Simulation,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { TypedEventBus } from '../bridge/TypedEventBus';
import { shapesOf } from './__fixtures__/sheetShapes';
import { spriteTopOf } from './engine/render/spriteMeasures';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';
import { LegendSprites } from './LegendSprites';
import { LEGEND_VISUAL_DIAMETER } from './views/entityViews.constants';
import { LegendSpriteView } from './views/LegendSpriteView';
import { LegendView } from './views/LegendView';

const TICK_RATE = 30;
const KNIGHT_SHEET = LEGEND_SPRITE_SHEETS.knight;
const ORACLE_SHEET = LEGEND_SPRITE_SHEETS.oracle;
const KNIGHT_GRID = shapesOf('knight-sprites');
const BOTH_GRIDS = shapesOf('knight-sprites', 'oracle-sprites');

/** The sheets by sub-class id, as `matchLegendSheets` gives them. */
const sheetsOf = (
  ...sheets: readonly (readonly [string, LegendSpriteSheet | undefined])[]
): ReadonlyMap<string, LegendSpriteSheet> =>
  new Map(sheets.flatMap(([specId, sheet]) => (sheet === undefined ? [] : [[specId, sheet]])));

/** A Legend whose snapshot names no sub-class, alive, facing south. */
const PLAIN: EntitySnapshot = {
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

/** The player's Knight, alive, facing south: it plays the idle row (row 0). */
const HERO: EntitySnapshot = { ...PLAIN, specId: 'knight' };

/** A dark bot's Oracle, alive, facing south. */
const BOT: EntitySnapshot = {
  ...HERO,
  id: 'bot',
  kind: 'magus',
  definitionId: 'magus',
  specId: 'oracle',
  team: 'dark',
  transform: { x: 30, y: 20, radius: 0.75, facing: { x: 0, y: 1 } },
};

/** An empty match's first snapshot; `snapshotAt` swaps in the tick and the entities a test needs. */
const BASE = new Simulation({
  config: createDefaultGameConfig(),
  seed: 1,
  logger: new NullLogger(),
}).snapshot();
const snapshotAt = (tick: number, ...entities: readonly EntitySnapshot[]): Snapshot => ({
  ...BASE,
  tick,
  entities,
});

/** A simulation whose events come from `bus`, so a test can count its listeners. */
function busSimulation(): {
  readonly bus: TypedEventBus<GameEventMap>;
  readonly simulation: Pick<Simulation, 'on' | 'tick'>;
} {
  const bus = new TypedEventBus<GameEventMap>();
  return { bus, simulation: { tick: 0, on: bus.on.bind(bus) } };
}

/** The frame the sprites' view draws for `entity`, read from the `drawSprite` call. */
function drawnFrame(sprites: LegendSprites, entity: EntitySnapshot = HERO): unknown {
  const renderer = new RecordingRenderer();
  sprites.view?.draw(
    { entity, position: { x: 10, y: 20 }, facing: { x: 0, y: 1 }, isFocused: false },
    renderer,
  );
  return renderer.calls.find((call) => call.op === 'drawSprite')?.args[0];
}

/** Sprites over `sheets`, with a renderer that holds the atlases of `grids`. */
function spritesWith(
  sheets: ReadonlyMap<string, LegendSpriteSheet>,
  grids: ConstructorParameters<typeof RecordingRenderer>[0] = BOTH_GRIDS,
) {
  const { bus, simulation } = busSimulation();
  const logger = new MemoryLogger();
  const sprites = new LegendSprites({
    legendSheets: sheets,
    tickRate: TICK_RATE,
    simulation,
    renderer: new RecordingRenderer(grids),
    logger,
  });
  return { bus, logger, sprites };
}

describe('LegendSprites', () => {
  it('has no view and subscribes to nothing without sprite sheets (an online Duel)', () => {
    const { bus, simulation } = busSimulation();
    const logger = new MemoryLogger();

    const sprites = new LegendSprites({
      tickRate: TICK_RATE,
      simulation,
      renderer: new RecordingRenderer(KNIGHT_GRID),
      logger,
    });

    expect(sprites.view).toBeUndefined();
    expect(bus.listenerCount()).toBe(0);
    expect(logger.records).toEqual([]);
    sprites.destroy();
  });

  it('keeps the disc and logs one WARN when the atlas of the only sheet did not load', () => {
    const { bus, logger, sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), {});

    expect(sprites.view).toBeUndefined();
    expect(bus.listenerCount()).toBe(0);
    expect(
      logger.records.map(({ severityText, scope, attributes }) => [
        severityText,
        scope,
        attributes,
      ]),
    ).toEqual([['WARN', 'client.views', { atlasId: 'knight-sprites' }]]);
  });

  it('draws the sprite with its feet on the position, at the shared Legend width', () => {
    const { logger, sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), KNIGHT_GRID);
    const renderer = new RecordingRenderer();
    sprites.view?.draw(
      { entity: HERO, position: { x: 10, y: 20 }, facing: { x: 0, y: 1 }, isFocused: false },
      renderer,
    );

    expect(sprites.view).toBeInstanceOf(LegendSpriteView);
    expect(renderer.calls[0]).toEqual({
      op: 'drawSprite',
      args: [{ atlasId: 'knight-sprites', frame: 0 }, { x: 10, y: 20 }, LEGEND_VISUAL_DIAMETER],
    });
    expect(logger.records).toEqual([]);
  });

  it('draws the frames of the tick that the render step sets', () => {
    const { sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), KNIGHT_GRID);

    // The idle row has 6 frames over 1.2 s: tick 9 (0.3 s) is frame 1, tick 15 (0.5 s) frame 2.
    sprites.setFrameTick(0);
    const atStart = drawnFrame(sprites);
    sprites.setFrameTick(9);
    const atNine = drawnFrame(sprites);
    sprites.setFrameTick(15);
    const atFifteen = drawnFrame(sprites);

    expect([atStart, atNine, atFifteen]).toEqual([
      { atlasId: 'knight-sprites', frame: 0 },
      { atlasId: 'knight-sprites', frame: 1 },
      { atlasId: 'knight-sprites', frame: 2 },
    ]);
    sprites.destroy();
  });

  it("draws a bot Legend from its own sub-class's sheet", () => {
    const { sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]));

    expect([drawnFrame(sprites, HERO), drawnFrame(sprites, BOT)]).toEqual([
      { atlasId: 'knight-sprites', frame: 0 },
      { atlasId: 'oracle-sprites', frame: 0 },
    ]);
    sprites.destroy();
  });

  it("puts each Legend's bar on its own sheet's sprite top, from the sheet's data", () => {
    const { sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]));
    const top = (atlasId: string): number | undefined => {
      const shape = BOTH_GRIDS[atlasId];
      return shape === undefined ? undefined : spriteTopOf(shape, LEGEND_VISUAL_DIAMETER);
    };

    expect([sprites.view?.visualTopOf?.(HERO), sprites.view?.visualTopOf?.(BOT)]).toEqual([
      top('knight-sprites'),
      top('oracle-sprites'),
    ]);
    expect(top('knight-sprites')).not.toBeCloseTo(top('oracle-sprites') ?? 0);
    sprites.destroy();
  });

  it("draws the disc for a Legend whose sheet did not load, while the player's draws a sprite", () => {
    const { logger, sprites } = spritesWith(
      sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]),
      KNIGHT_GRID,
    );
    const state = { entity: BOT, position: { x: 30, y: 20 }, facing: { x: 0, y: 1 } };
    const bot = new RecordingRenderer();
    const disc = new RecordingRenderer();
    sprites.view?.draw({ ...state, isFocused: false }, bot);
    new LegendView().draw({ ...state, isFocused: false }, disc);

    expect(drawnFrame(sprites, HERO)).toEqual({ atlasId: 'knight-sprites', frame: 0 });
    expect(bot.calls).toEqual(disc.calls);
    expect(logger.records.map(({ attributes }) => attributes)).toEqual([
      { atlasId: 'oracle-sprites' },
    ]);
    sprites.destroy();
  });

  it('draws the disc for a Legend without a sub-class or with one that has no sheet', () => {
    const { logger, sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), KNIGHT_GRID);
    expect(drawnFrame(sprites, PLAIN)).toBeUndefined();
    expect(drawnFrame(sprites, { ...HERO, specId: 'no-such-legend' })).toBeUndefined();
    expect(logger.records).toEqual([]);
    sprites.destroy();
  });

  it('walks each Legend on its own from the snapshots it observes', () => {
    const { sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]));
    // The bot steps east while it still faces south, so only its step can pick the east row.
    const east = { ...BOT, transform: { x: 31, y: 20, radius: 0.75, facing: { x: 0, y: 1 } } };

    sprites.observe(snapshotAt(1, HERO, BOT));
    sprites.observe(snapshotAt(2, HERO, east));

    // Row 4 is the east walk; the player stood still, so it stays on the idle row 0.
    expect([drawnFrame(sprites, HERO), drawnFrame(sprites, east)]).toEqual([
      { atlasId: 'knight-sprites', frame: 0 },
      { atlasId: 'oracle-sprites', frame: 4 * 6 },
    ]);
    sprites.destroy();
  });

  it('does not walk a Legend that was out of the last snapshot (a respawn)', () => {
    const { sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]));
    // The bot is back one step east of where it was last seen: a respawn, not a step.
    const back = { ...BOT, transform: { x: 31, y: 20, radius: 0.75, facing: { x: 0, y: 1 } } };

    sprites.observe(snapshotAt(1, HERO, BOT));
    sprites.observe(snapshotAt(2, HERO));
    sprites.observe(snapshotAt(3, HERO, back));

    // Row 0 is the idle row; a walk east would be row 4.
    expect(drawnFrame(sprites, back)).toEqual({ atlasId: 'oracle-sprites', frame: 0 });
    sprites.destroy();
  });

  it("plays only the attacker's attack row, through one damage-applied listener for all Legends", () => {
    const { bus, sprites } = spritesWith(
      sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]),
    );
    sprites.observe(snapshotAt(1, HERO, BOT, { ...BOT, id: 'bot-2' }));

    bus.emit('damage-applied', {
      targetId: 'hero',
      amount: 1,
      absorbed: 0,
      source: { attackerId: BOT.id, kind: 'weapon', definitionId: 'magus-staff' },
    });

    // Row 5 is the attack row.
    expect(bus.listenerCount()).toBe(1);
    expect([drawnFrame(sprites, BOT), drawnFrame(sprites, HERO)]).toEqual([
      { atlasId: 'oracle-sprites', frame: 5 * 6 },
      { atlasId: 'knight-sprites', frame: 0 },
    ]);
    sprites.destroy();
  });

  it('leaves a bot on its idle row after a status hit from it: only a weapon hit plays the attack', () => {
    const { bus, sprites } = spritesWith(sheetsOf(['oracle', ORACLE_SHEET]));
    sprites.observe(snapshotAt(1, HERO, BOT));

    bus.emit('damage-applied', {
      targetId: 'hero',
      amount: 1,
      absorbed: 0,
      source: { attackerId: BOT.id, kind: 'status', definitionId: 'burn' },
    });

    expect(drawnFrame(sprites, BOT)).toEqual({ atlasId: 'oracle-sprites', frame: 0 });
    sprites.destroy();
  });

  it("stops listening to the simulation's events on destroy", () => {
    const { bus, sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), KNIGHT_GRID);
    const whileAlive = bus.listenerCount();

    sprites.destroy();

    expect(whileAlive).toBe(1);
    expect(bus.listenerCount()).toBe(0);
  });
});
