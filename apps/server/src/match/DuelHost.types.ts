import type { Logger } from '@eternalus/core';
import type { TickScheduler } from '../time/TickScheduler.types';
import type { DuelSimulationFactory } from './DuelSimulation.types';

/** What a `DuelHost` is built from. */
export type DuelHostOptions = {
  readonly factory: DuelSimulationFactory;
  readonly scheduler: TickScheduler;
  /** Milliseconds per tick: `1000 / config.tickRate`. */
  readonly tickIntervalMs: number;
  readonly logger: Logger;
};
