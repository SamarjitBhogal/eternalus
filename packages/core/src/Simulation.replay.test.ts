import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { GameConfig } from './config/GameConfig.types';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import { REPLAY_CHECKPOINT_EVERY } from './diagnostics/Replay.constants';
import type { Replay } from './diagnostics/Replay.types';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
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
const createMatch = (config: GameConfig, seed: number): Simulation =>
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
    { config: CONFIG, seed: SEED, ticks, checkpointEvery, commandsFor: playerCommands },
    () => live,
  );

describe('Simulation replay export and recent context', () => {
  it('exports the replay the harness records, and it replays with no divergence', () => {
    const live = createMatch(CONFIG, SEED);
    const recorded = play(live, 3 * REPLAY_CHECKPOINT_EVERY);

    const exported = live.exportReplay();

    expect(exported.checkpoints.map(({ tick }) => tick)).toEqual(
      [0, 1, 2, 3].map((interval) => interval * REPLAY_CHECKPOINT_EVERY),
    );
    expect(exported).toEqual(recorded);
    expect(runReplay(exported, createMatch)).toEqual({
      firstDivergence: null,
      finalHash: live.hash(),
    });
  });

  it('keeps bot commands out of the log while recentContext() shows them', () => {
    const live = createMatch(CONFIG, SEED);
    play(live, REPLAY_CHECKPOINT_EVERY);
    const warriorId = warriorOf(live.snapshot());
    const isBotCommand = ({ command }: { readonly command: { readonly type: string } }): boolean =>
      'actorId' in command && command.actorId !== warriorId;

    expect(live.recentContext().recentCommands.filter(isBotCommand).length).toBeGreaterThan(0);
    expect(live.exportReplay().commands.filter(isBotCommand)).toEqual([]);
  });

  it('replays the same after a JSON round trip', () => {
    const live = createMatch(CONFIG, SEED);
    play(live, 2 * REPLAY_CHECKPOINT_EVERY + 10);
    const exported = live.exportReplay();

    const parsed = JSON.parse(JSON.stringify(exported)) as Replay;

    expect(runReplay(parsed, createMatch)).toEqual({
      firstDivergence: null,
      finalHash: exported.checkpoints.at(-1)?.hash,
    });
  });

  it('exports a match younger than one interval with its tick-0 checkpoint, which replays', () => {
    const live = createMatch(CONFIG, SEED);
    const atStart = live.hash();
    play(live, REPLAY_CHECKPOINT_EVERY - 1);

    const exported = live.exportReplay();

    expect(exported.checkpoints).toEqual([{ tick: 0, hash: atStart }]);
    expect(runReplay(exported, createMatch)).toEqual({ firstDivergence: null, finalHash: atStart });
  });

  it('leaves every hash unchanged when exportReplay() and recentContext() run every tick', () => {
    const watched = createMatch(CONFIG, SEED);
    watched.on('tick-completed', () => {
      watched.exportReplay();
      watched.recentContext();
    });
    const ticks = 2 * REPLAY_CHECKPOINT_EVERY;

    expect(play(watched, ticks, 1).checkpoints).toEqual(
      play(createMatch(CONFIG, SEED), ticks, 1).checkpoints,
    );
  });
});
