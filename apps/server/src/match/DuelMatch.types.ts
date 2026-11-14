import type { Logger, PlayableTeam } from '@eternalus/core';
import type { TickScheduler } from '../time/TickScheduler.types';
import type { ClientConnection } from '../transport/ClientConnection.types';
import type { DuelMatch } from './DuelMatch';
import type { DuelSimulation } from './DuelSimulation.types';

/** What a `DuelMatch` is built from. */
export type DuelMatchOptions = {
  readonly id: string;
  readonly seats: Readonly<Record<PlayableTeam, ClientConnection>>;
  readonly simulation: DuelSimulation;
  readonly scheduler: TickScheduler;
  readonly tickIntervalMs: number;
  readonly logger: Logger;
  /** Called once when the match is over, after the players were told. */
  readonly onEnded: (match: DuelMatch) => void;
};
