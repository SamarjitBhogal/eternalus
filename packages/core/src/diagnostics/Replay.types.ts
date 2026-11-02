import type { Command } from '../commands/Command.types';
import type { SimulationOptions } from '../Simulation.types';
import type { Snapshot } from '../state/Snapshot.types';

/**
 * What a match was built with: the seed, the config and, when the match had them, the generated
 * map, its placed objects and the bot roster. Plain data, so a replay can rebuild the same
 * world without the code that prepared it (architecture 03 §9, 15 §7).
 */
export type ReplaySetup = Pick<
  SimulationOptions,
  'seed' | 'config' | 'map' | 'mapObjects' | 'roster'
>;

/**
 * A recorded match: its setup, everything needed to play it again, and the hashes it must
 * reproduce (architecture 03 §9, 15 §7). Plain data, so it can be committed as a fixture or
 * attached to a bug report.
 */
export type Replay = ReplaySetup & {
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

/** Builds a fresh target (a `Simulation` with its systems) from a replay's setup. */
export type ReplayTargetFactory = (setup: ReplaySetup) => ReplayTarget;

/** How a replay went: `firstDivergence` is `null` when every checkpoint matched. */
export type ReplayOutcome = {
  readonly firstDivergence: {
    readonly tick: number;
    readonly expected: number;
    readonly actual: number;
  } | null;
  readonly finalHash: number;
};
