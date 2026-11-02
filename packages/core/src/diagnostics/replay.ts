import type { Command } from '../commands/Command.types';
import type { Snapshot } from '../state/Snapshot.types';
import type { Replay, ReplayOutcome, ReplaySetup, ReplayTargetFactory } from './Replay.types';

/** What to record: the match setup and how long to run it. */
type RecordingPlan = ReplaySetup & {
  readonly ticks: number;
  /** A checkpoint every this many ticks, plus one at the end. */
  readonly checkpointEvery: number;
  /** The commands to enqueue before the step of `tick`, given the state at that moment. */
  readonly commandsFor: (tick: number, snapshot: Snapshot) => readonly Command[];
};

/** Runs a match from `plan` on a fresh target and records it as a `Replay`. */
export const recordReplay = (plan: RecordingPlan, createTarget: ReplayTargetFactory): Replay => {
  const { ticks, checkpointEvery, commandsFor, ...setup } = plan;
  const target = createTarget(setup);
  const recorded: { tick: number; command: Command }[] = [];
  const hashes: { tick: number; hash: number }[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    if (tick % checkpointEvery === 0) {
      hashes.push({ tick, hash: target.hash() });
    }
    for (const command of commandsFor(tick, target.snapshot())) {
      recorded.push({ tick, command });
      target.enqueueCommand(command);
    }
    target.step();
  }
  hashes.push({ tick: ticks, hash: target.hash() });
  return { ...setup, commands: recorded, checkpoints: hashes };
};

/**
 * Plays `replay` on a fresh target, feeding each command before the step of its tick, and
 * compares the hash at every checkpoint. Stops at the first divergence.
 */
export const runReplay = (replay: Replay, createTarget: ReplayTargetFactory): ReplayOutcome => {
  const { commands, checkpoints, ...setup } = replay;
  const target = createTarget(setup);
  let next = 0;
  for (const checkpoint of checkpoints) {
    while (target.tick < checkpoint.tick) {
      let entry = commands[next];
      while (entry !== undefined && entry.tick <= target.tick) {
        target.enqueueCommand(entry.command);
        next += 1;
        entry = commands[next];
      }
      target.step();
    }
    const actual = target.hash();
    if (actual !== checkpoint.hash) {
      return {
        firstDivergence: { tick: checkpoint.tick, expected: checkpoint.hash, actual },
        finalHash: actual,
      };
    }
  }
  return { firstDivergence: null, finalHash: target.hash() };
};
