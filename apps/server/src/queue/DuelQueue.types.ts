import type { ClientConnection } from '../transport/ClientConnection.types';
import type { PlayerRatings } from '../rating/PlayerRatings';
import type { Clock } from '../time/Clock.types';
import type { TickScheduler } from '../time/TickScheduler.types';

/** A queued player: their connection, guest id (the key of their rating) and the name they joined with. */
export type DuelPlayer = {
  readonly connection: ClientConnection;
  readonly name: string;
  readonly guestId: string;
};

/** What the queue hands a pair to: the match host. */
export interface MatchStarter {
  /** Starts a Duel; the first player to queue plays `light`, the second `dark`. */
  start(light: DuelPlayer, dark: DuelPlayer): void;
}

/** A queued player with the rating they joined with and when they joined. */
export type Waiter = {
  readonly player: DuelPlayer;
  readonly rating: number;
  readonly joinedAtMs: number;
};

/** What a `DuelQueue` is built from. */
export type DuelQueueOptions = {
  readonly starter: MatchStarter;
  readonly ratings: PlayerRatings;
  readonly clock: Clock;
  /** Runs the periodic sweep that widens the allowed gaps. */
  readonly scheduler: TickScheduler;
};
