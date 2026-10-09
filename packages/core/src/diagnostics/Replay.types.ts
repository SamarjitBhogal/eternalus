import type { Command } from '../commands/Command.types';
import type { GameConfig } from '../config/GameConfig.types';
import type { Snapshot } from '../state/Snapshot.types';

/**
 * A recorded match: everything needed to play it again and the hashes it must reproduce
 * (architecture 03 §9, 15 §7). Plain data, so it can be committed as a fixture or attached to a
 * bug report.
 */
export type Replay = {
  readonly seed: number;
  readonly config: GameConfig;
  /** Every command in enqueue order; `tick` is the tick it was enqueued before (applied in). */
  readonly commands: readonly { readonly tick: number; readonly command: Command }[];
  /** `hash()` after `tick` completed ticks, in ascending tick order. */
  readonly checkpoints: readonly { readonly tick: number; readonly hash: number }[];
};

/** What a replay drives: the slice of `Simulation` it needs. */
export interface ReplayTarget {
  /** Number of ticks completed. */
  readonly tick: number;
  /** Queues a command for the next step. */
  enqueueCommand(command: Command): void;
  /** Advances one tick. */
  step(): void;
  /** The current state hash. */
  hash(): number;
  /** The current snapshot. */
  snapshot(): Snapshot;
}

/** Builds a fresh target (a `Simulation` with its systems) for a config and seed. */
export type ReplayTargetFactory = (config: GameConfig, seed: number) => ReplayTarget;

/** How a replay went: `firstDivergence` is `null` when every checkpoint matched. */
export type ReplayOutcome = {
  readonly firstDivergence: {
    readonly tick: number;
    readonly expected: number;
    readonly actual: number;
  } | null;
  readonly finalHash: number;
};
