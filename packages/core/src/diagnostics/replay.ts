import type { Command } from '../commands/Command.types';
import type { GameConfig } from '../config/GameConfig.types';
import type { Snapshot } from '../state/Snapshot.types';
import type { Replay, ReplayOutcome, ReplayTargetFactory } from './Replay.types';

/** What to record: the match setup and how long to run it. */
type RecordingPlan = {
  readonly config: GameConfig;
  readonly seed: number;
  readonly ticks: number;
  /** A checkpoint every this many ticks, plus one at the end. */
  readonly checkpointEvery: number;
  /** The commands to enqueue before the step of `tick`, given the state at that moment. */
  readonly commandsFor: (tick: number, snapshot: Snapshot) => readonly Command[];
};

/** Runs a match from `plan` on a fresh target and records it as a `Replay`. */
export const recordReplay = (plan: RecordingPlan, createTarget: ReplayTargetFactory): Replay => {
  const target = createTarget(plan.config, plan.seed);
  const commands: { tick: number; command: Command }[] = [];
  const checkpoints: { tick: number; hash: number }[] = [];
  for (let tick = 0; tick < plan.ticks; tick += 1) {
    if (tick % plan.checkpointEvery === 0) {
      checkpoints.push({ tick, hash: target.hash() });
    }
    for (const command of plan.commandsFor(tick, target.snapshot())) {
      commands.push({ tick, command });
      target.enqueueCommand(command);
    }
    target.step();
  }
  checkpoints.push({ tick: plan.ticks, hash: target.hash() });
  return { seed: plan.seed, config: plan.config, commands, checkpoints };
};

/**
 * Plays `replay` on a fresh target, feeding each command before the step of its tick, and
 * compares the hash at every checkpoint. Stops at the first divergence.
 */
export const runReplay = (replay: Replay, createTarget: ReplayTargetFactory): ReplayOutcome => {
  const target = createTarget(replay.config, replay.seed);
  let next = 0;
  for (const checkpoint of replay.checkpoints) {
    while (target.tick < checkpoint.tick) {
      let entry = replay.commands[next];
      while (entry !== undefined && entry.tick <= target.tick) {
        target.enqueueCommand(entry.command);
        next += 1;
        entry = replay.commands[next];
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
