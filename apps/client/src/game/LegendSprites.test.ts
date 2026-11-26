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
const KNIGHT_GROUND_OFFSET = KNIGHT_SHEET?.groundOffset ?? Number.NaN;
const KNIGHT_GRID = { 'knight-sprites': { columns: 6, rows: 10 } };
const BOTH_GRIDS = { ...KNIGHT_GRID, 'oracle-sprites': { columns: 6, rows: 10 } };

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

/** An empty match's first snapshot; `snapshotOf` swaps in the entities a test needs. */
const BASE = new Simulation({
  config: createDefaultGameConfig(),
  seed: 1,
  logger: new NullLogger(),
}).snapshot();
const snapshotOf = (...entities: readonly EntitySnapshot[]): Snapshot => ({ ...BASE, entities });

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

  it('draws the sprite at the shared Legend width with the sheet ground offset', () => {
    const { logger, sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), KNIGHT_GRID);
    const renderer = new RecordingRenderer();
    sprites.view?.draw(
      { entity: HERO, position: { x: 10, y: 20 }, facing: { x: 0, y: 1 }, isFocused: false },
      renderer,
    );

    expect(sprites.view).toBeInstanceOf(LegendSpriteView);
    expect(renderer.calls[0]).toEqual({
      op: 'drawSprite',
      args: [
        { atlasId: 'knight-sprites', frame: 0 },
        { x: 10, y: 20 + LEGEND_VISUAL_DIAMETER * KNIGHT_GROUND_OFFSET },
        LEGEND_VISUAL_DIAMETER,
      ],
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

  it("anchors each Legend's sprite with its own sheet's ground offset", () => {
    const { sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]));
    const anchorY = (entity: EntitySnapshot): unknown => {
      const renderer = new RecordingRenderer();
      sprites.view?.draw(
        { entity, position: { x: 0, y: 0 }, facing: { x: 0, y: 1 }, isFocused: false },
        renderer,
      );
      const call = renderer.calls.find(({ op }) => op === 'drawSprite');
      return call?.op === 'drawSprite' ? call.args[1].y : undefined;
    };

    expect([anchorY(HERO), anchorY(BOT)]).toEqual([
      LEGEND_VISUAL_DIAMETER * KNIGHT_GROUND_OFFSET,
      LEGEND_VISUAL_DIAMETER * (ORACLE_SHEET?.groundOffset ?? Number.NaN),
    ]);
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

    sprites.observe(snapshotOf(HERO, BOT), snapshotOf(HERO, east));

    // Row 4 is the east walk; the player stood still, so it stays on the idle row 0.
    expect([drawnFrame(sprites, HERO), drawnFrame(sprites, east)]).toEqual([
      { atlasId: 'knight-sprites', frame: 0 },
      { atlasId: 'oracle-sprites', frame: 4 * 6 },
    ]);
    sprites.destroy();
  });

  it("plays only the attacker's attack row, through one damage-applied listener for all Legends", () => {
    const { bus, sprites } = spritesWith(
      sheetsOf(['knight', KNIGHT_SHEET], ['oracle', ORACLE_SHEET]),
    );
    sprites.observe(null, snapshotOf(HERO, BOT, { ...BOT, id: 'bot-2' }));

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

  it("stops listening to the simulation's events on destroy", () => {
    const { bus, sprites } = spritesWith(sheetsOf(['knight', KNIGHT_SHEET]), KNIGHT_GRID);
    const whileAlive = bus.listenerCount();

    sprites.destroy();

    expect(whileAlive).toBe(1);
    expect(bus.listenerCount()).toBe(0);
  });
});
