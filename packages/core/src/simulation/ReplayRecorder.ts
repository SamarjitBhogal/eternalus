import type { Command } from '../commands/Command.types';
import { REPLAY_CHECKPOINT_EVERY } from '../diagnostics/Replay.constants';
import type { Replay, ReplaySetup, SimulationOptions } from '../Simulation.types';

/**
 * Records what a `Simulation` needs to export a `Replay` (architecture 03 §6, ADR 0025 §4): the
 * setup it was built with, every external command with the tick it applied in (DEC-156), and a
 * checkpoint hash at tick 0 and every `REPLAY_CHECKPOINT_EVERY` ticks. None of it is hashed.
 */
export class ReplayRecorder {
  /**
   * What the match was built with, copied into every exported replay. A crash report's replay
   * keeps the generated map and map objects inline (DEC-152); revisit at the Phase 5 replay store.
   */
  private readonly setup: ReplaySetup;
  private readonly commands: Replay['commands'][number][] = [];
  /** Ascending by tick. */
  private readonly checkpoints: Replay['checkpoints'][number][] = [];

  /**
   * Keeps the replayable part of `options`: the seed, the validated config and, only when the
   * match has them, the map, the map objects, a non-empty roster and the Duel rules.
   */
  public constructor(
    options: Pick<SimulationOptions, 'seed' | 'map' | 'mapObjects' | 'roster' | 'duel'> &
      Pick<ReplaySetup, 'config'>,
  ) {
    const { seed, config, map, mapObjects, roster = [], duel } = options;
    this.setup = {
      seed,
      config,
      ...(map === undefined ? {} : { map }),
      ...(mapObjects === undefined ? {} : { mapObjects }),
      ...(roster.length === 0 ? {} : { roster }),
      ...(duel === undefined ? {} : { duel }),
    };
  }

  /** Logs an external command with the tick it applies in. */
  public recordCommand(tick: number, command: Command): void {
    this.commands.push({ tick, command });
  }

  /**
   * Records `hash()` when `tick` is a checkpoint tick (0 and every `REPLAY_CHECKPOINT_EVERY`
   * ticks); `hash` is only called then, since hashing walks the whole state.
   */
  public recordCheckpointIfDue(tick: number, hash: () => number): void {
    if (tick % REPLAY_CHECKPOINT_EVERY === 0) {
      this.checkpoints.push({ tick, hash: hash() });
    }
  }

  /** The setup, a copy of the command log and the checkpoints so far, as plain data. */
  public export(): Replay {
    return { ...this.setup, commands: [...this.commands], checkpoints: [...this.checkpoints] };
  }
}
