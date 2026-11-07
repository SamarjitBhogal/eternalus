import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import { REPLAY_CHECKPOINT_EVERY } from './diagnostics/Replay.constants';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import type { Replay, ReplaySetup } from './Simulation.types';
import type { Snapshot } from './state/Snapshot.types';
import type { Vec2 } from './utils/geometry.types';

const SEED = 7;
const CONFIG = createDefaultGameConfig();
const ESCORT = 4;
const TURN_EVERY = 40;
const SQUARE: readonly Vec2[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

/**
 * The default pipeline, bots included, with every invariant checked every tick, on the map the
 * seed generates, with one bot Legend (a Dark Sentinel laner) whose controller issues commands.
 */
const createMatch = ({ config, seed }: ReplaySetup): Simulation =>
  new Simulation({
    config,
    seed,
    logger: new NullLogger(),
    debug: TEST_DEBUG_CONFIG,
    map: new MapGenerator().generate(config, seed),
    roster: [{ team: 'dark', definitionId: 'sentinel', role: 'laner', difficulty: 'normal' }],
  });

const spawn = (kind: string, definitionId: string, at: Vec2): Command => ({
  type: 'dev-spawn',
  kind,
  definitionId,
  team: 'light',
  at,
  count: 1,
});

const warriorOf = (snapshot: Snapshot): string | undefined =>
  snapshot.entities.find((entity) => entity.kind === 'warrior')?.id;

/**
 * The player: a Warrior and its minion escort at tick 0, then the Warrior walks a square, turning
 * every `TURN_EVERY` ticks. The bot Legend issues its own commands meanwhile.
 */
const playerCommands = (tick: number, snapshot: Snapshot): readonly Command[] => {
  if (tick === 0) {
    return [
      spawn('warrior', 'warrior', { x: 50, y: 50 }),
      ...Array.from({ length: ESCORT }, (_, index) =>
        spawn('light-mob', 'light-minion', { x: 48 + index, y: 48 }),
      ),
    ];
  }
  const actorId = warriorOf(snapshot);
  const direction = SQUARE[Math.floor(tick / TURN_EVERY) % SQUARE.length];
  return tick % TURN_EVERY === 1 && actorId !== undefined && direction !== undefined
    ? [{ type: 'move', actorId, direction }]
    : [];
};

/** Plays the player's side on `live` for `ticks` ticks; the replay harness records it as an oracle. */
const play = (live: Simulation, ticks: number, checkpointEvery = REPLAY_CHECKPOINT_EVERY): Replay =>
  recordReplay(
    { config: CONFIG, seed: SEED },
    { ticks, checkpointEvery, commandsFor: playerCommands },
    () => live,
  );

describe('Simulation replay export and recent context', () => {
  it('carries the map and roster the match was built with, and replays without a factory that rebuilds them', () => {
    const live = createMatch({ config: CONFIG, seed: SEED });
    play(live, REPLAY_CHECKPOINT_EVERY);
    const exported = JSON.parse(JSON.stringify(live.exportReplay())) as Replay;

    expect(exported.map).toBeDefined();
    expect(exported.roster).toEqual([
      { team: 'dark', definitionId: 'sentinel', role: 'laner', difficulty: 'normal' },
    ]);
    expect(
      runReplay(
        exported,
        (setup) => new Simulation({ ...setup, logger: new NullLogger(), debug: TEST_DEBUG_CONFIG }),
      ),
    ).toEqual({ firstDivergence: null, finalHash: live.hash() });
  });

  it('exports the replay the harness records, and it replays with no divergence', () => {
    const live = createMatch({ config: CONFIG, seed: SEED });
    const recorded = play(live, 3 * REPLAY_CHECKPOINT_EVERY);

    const exported = live.exportReplay();

    expect(exported.checkpoints.map(({ tick }) => tick)).toEqual(
      [0, 1, 2, 3].map((interval) => interval * REPLAY_CHECKPOINT_EVERY),
    );
    // The live match also has a map and a roster, which the recorded plan does not name.
    expect(exported).toEqual({
      ...recorded,
      map: new MapGenerator().generate(CONFIG, SEED),
      roster: [{ team: 'dark', definitionId: 'sentinel', role: 'laner', difficulty: 'normal' }],
    });
    expect(runReplay(exported, createMatch)).toEqual({
      firstDivergence: null,
      finalHash: live.hash(),
    });
  });

  it('logs a command enqueued during a step at the tick it applies, so it replays the same (DEC-156)', () => {
    const live = createMatch({ config: CONFIG, seed: SEED });
    let hasMoved = false;
    live.on('entity-spawned', ({ entityId, kind }) => {
      if (hasMoved || kind !== 'warrior') return;
      hasMoved = true;
      live.enqueueCommand({ type: 'move', actorId: entityId, direction: { x: 1, y: 0 } });
    });
    live.enqueueCommand(spawn('warrior', 'warrior', { x: 50, y: 50 }));
    for (let tick = 0; tick < REPLAY_CHECKPOINT_EVERY; tick += 1) live.step();

    const exported = live.exportReplay();

    // The spawn applies in the step of tick 0; the move, enqueued inside that step, in tick 1's.
    expect(exported.commands.map(({ tick, command }) => [tick, command.type])).toEqual([
      [0, 'dev-spawn'],
      [1, 'move'],
    ]);
    expect(runReplay(exported, createMatch)).toEqual({
      firstDivergence: null,
      finalHash: live.hash(),
    });
  });

  it('applies a command enqueued during a step after the bot commands of that step, the order a replay feeds them (DEC-156)', () => {
    const probe = createMatch({ config: CONFIG, seed: SEED });
    for (let tick = 0; tick < REPLAY_CHECKPOINT_EVERY; tick += 1) probe.step();
    // The tick of the first bot command in recentContext()'s window; the bots queued it in the
    // step before.
    const botTick = probe
      .recentContext()
      .recentCommands.find(({ command }) => 'actorId' in command)?.tick;
    if (botTick === undefined || botTick < 1) throw new Error('no bot command to order against');
    const live = createMatch({ config: CONFIG, seed: SEED });
    live.on('entity-spawned', ({ entityId, kind }) => {
      if (kind === 'warrior') {
        live.enqueueCommand({ type: 'move', actorId: entityId, direction: { x: 1, y: 0 } });
      }
    });
    for (let tick = 0; tick < botTick - 1; tick += 1) live.step();
    live.enqueueCommand(spawn('warrior', 'warrior', { x: 50, y: 50 }));
    live.step();
    live.step();

    const warriorId = warriorOf(live.snapshot());
    const actors = live
      .recentContext()
      .recentCommands.filter(({ tick }) => tick === botTick)
      .map(({ command }) => ('actorId' in command ? command.actorId : null));

    // Bot commands first, the warrior's move last.
    expect(warriorId).toBeDefined();
    expect(actors.length).toBeGreaterThan(1);
    expect(actors.filter((actorId) => actorId === warriorId)).toHaveLength(1);
    expect(actors[actors.length - 1]).toBe(warriorId);
  });

  it('keeps bot commands out of the log while recentContext() shows them', () => {
    const live = createMatch({ config: CONFIG, seed: SEED });
    play(live, REPLAY_CHECKPOINT_EVERY);
    const warriorId = warriorOf(live.snapshot());
    const isBotCommand = ({ command }: { readonly command: { readonly type: string } }): boolean =>
      'actorId' in command && command.actorId !== warriorId;

    expect(live.recentContext().recentCommands.filter(isBotCommand).length).toBeGreaterThan(0);
    expect(live.exportReplay().commands.filter(isBotCommand)).toEqual([]);
  });

  it('replays the same after a JSON round trip', () => {
    const live = createMatch({ config: CONFIG, seed: SEED });
    play(live, 2 * REPLAY_CHECKPOINT_EVERY + 10);
    const exported = live.exportReplay();

    const parsed = JSON.parse(JSON.stringify(exported)) as Replay;

    expect(runReplay(parsed, createMatch)).toEqual({
      firstDivergence: null,
      finalHash: exported.checkpoints.at(-1)?.hash,
    });
  });

  it('exports a match younger than one interval with its tick-0 checkpoint, which replays', () => {
    const live = createMatch({ config: CONFIG, seed: SEED });
    const atStart = live.hash();
    play(live, REPLAY_CHECKPOINT_EVERY - 1);

    const exported = live.exportReplay();

    expect(exported.checkpoints).toEqual([{ tick: 0, hash: atStart }]);
    expect(runReplay(exported, createMatch)).toEqual({ firstDivergence: null, finalHash: atStart });
  });

  it('leaves every hash unchanged when exportReplay() and recentContext() run every tick', () => {
    const watched = createMatch({ config: CONFIG, seed: SEED });
    watched.on('tick-completed', () => {
      watched.exportReplay();
      watched.recentContext();
    });
    const ticks = 2 * REPLAY_CHECKPOINT_EVERY;

    expect(play(watched, ticks, 1).checkpoints).toEqual(
      play(createMatch({ config: CONFIG, seed: SEED }), ticks, 1).checkpoints,
    );
  });
});
