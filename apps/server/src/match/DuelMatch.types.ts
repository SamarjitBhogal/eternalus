import type { Logger, PlayableTeam } from '@eternalus/core';
import type { TickScheduler } from '../time/TickScheduler.types';
import type { ClientConnection } from '../transport/ClientConnection.types';
import type { DuelMatch } from './DuelMatch';
import type { DuelSimulation } from './DuelSimulation.types';

/** What a `DuelMatch` is built from. */
export type DuelMatchOptions = {
  readonly id: string;
  readonly seats: Readonly<Record<PlayableTeam, ClientConnection>>;
  /** Each seat's player name, sent to the opponent in `match-found`. */
  readonly names: Readonly<Record<PlayableTeam, string>>;
  readonly simulation: DuelSimulation;
  readonly scheduler: TickScheduler;
  readonly tickIntervalMs: number;
  /** The VERSUS screen's length: the match does not step until it has passed. */
  readonly versusMs: number;
  readonly logger: Logger;
  /** Called once when the match is over, after the players were told; `winner` is `null` for a draw. */
  readonly onEnded: (match: DuelMatch, winner: PlayableTeam | null) => void;
};
