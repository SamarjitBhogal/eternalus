import type { Command } from '../commands/Command.types';
import type { Snapshot } from '../state/Snapshot.types';
import type { ReplayOf, ReplayOutcome, ReplayTargetFactoryOf } from './Replay.types';

/** What to record: the match setup and how long to run it. */
type RecordingPlan = {
  readonly ticks: number;
  /** A checkpoint every this many ticks, plus one at the end. */
  readonly checkpointEvery: number;
  /** The commands to enqueue before the step of `tick`, given the state at that moment. */
  readonly commandsFor: (tick: number, snapshot: Snapshot) => readonly Command[];
};

/**
 * Runs a match built from `setup` on a fresh target, as `plan` says, and records it as a `Replay`:
 * the setup, unchanged, beside the commands and checkpoints.
 */
export const recordReplay = <S extends object>(
  setup: S,
  plan: RecordingPlan,
  createTarget: ReplayTargetFactoryOf<S>,
): ReplayOf<S> => {
  const { ticks, checkpointEvery, commandsFor } = plan;
  const target = createTarget(setup);
  const commands: { tick: number; command: Command }[] = [];
  const checkpoints: { tick: number; hash: number }[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    if (tick % checkpointEvery === 0) {
      checkpoints.push({ tick, hash: target.hash() });
    }
    for (const command of commandsFor(tick, target.snapshot())) {
      commands.push({ tick, command });
      target.enqueueCommand(command);
    }
    target.step();
  }
  checkpoints.push({ tick: ticks, hash: target.hash() });
  return { ...setup, commands, checkpoints };
};

/**
 * Plays `replay` on a fresh target, feeding each command before the step of its tick, and
 * compares the hash at every checkpoint. Stops at the first divergence.
 */
export const runReplay = <S extends object>(
  replay: ReplayOf<S>,
  createTarget: ReplayTargetFactoryOf<S>,
): ReplayOutcome => {
  const { commands, checkpoints } = replay;
  const target = createTarget(replay);
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
