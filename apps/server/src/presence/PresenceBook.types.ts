import type { DuelHost } from '../match/DuelHost';
import type { DuelQueue } from '../queue/DuelQueue';
import type { TickScheduler } from '../time/TickScheduler.types';

/** Where a guest is: connected and idle, waiting in the queue, or playing a Duel. */
export type PresenceState = 'online' | 'queued' | 'in-match';

/** How many guests are in each state; `held` guests are disconnected, inside the reconnect window. */
export type PresenceCounts = {
  readonly online: number;
  readonly queued: number;
  readonly inMatch: number;
  readonly held: number;
};

/** What a `PresenceBook` is built from. */
export type PresenceBookOptions = {
  readonly queue: DuelQueue;
  readonly host: DuelHost;
  /** Times the reconnect window (a one-shot task on a repeating scheduler). */
  readonly scheduler: TickScheduler;
  readonly reconnectWindowMs: number;
  /** Beyond this many held guests a disconnect drops at once, so held sockets stay bounded. */
  readonly maxHeldGuests: number;
  /** Makes a new, unguessable guest id (`randomUUID` in production). */
  readonly newGuestId: () => string;
};
