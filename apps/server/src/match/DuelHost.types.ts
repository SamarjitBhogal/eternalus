import type { Logger } from '@eternalus/core';
import type { TickScheduler } from '../time/TickScheduler.types';
import type { PlayerRatings } from '../rating/PlayerRatings';
import type { DuelSimulationFactory } from './DuelSimulation.types';

/** What a `DuelHost` is built from. */
export type DuelHostOptions = {
  readonly factory: DuelSimulationFactory;
  readonly scheduler: TickScheduler;
  /** Milliseconds per tick: `1000 / config.tickRate`. */
  readonly tickIntervalMs: number;
  /** How long the players see the VERSUS screen before the match steps, in milliseconds. */
  readonly versusMs: number;
  readonly logger: Logger;
  /** Updated with each finished match. */
  readonly ratings: PlayerRatings;
};
