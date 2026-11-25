import type { Logger } from '@eternalus/core';
import type { MatchEnding } from '@eternalus/protocol';

import type { MessageTransport } from '../engine/net/MessageTransport';
import type { SessionClock } from '../engine/time/SessionClock.types';

/**
 * Where a Duel is: `idle` (no connection), `queued` (waiting for an opponent), `matched` (paired,
 * the first snapshot not yet in), `started` (playing), `reconnecting` (the connection dropped
 * once paired; trying to take the seat back inside the server's window, DEC-349), `ended` (the
 * server ended the match).
 */
export type DuelStatus = 'idle' | 'queued' | 'matched' | 'started' | 'reconnecting' | 'ended';

/** What `DuelSession` tells its owner; each is called at most once per Duel. */
export type DuelSessionHandlers = {
  /** The server paired this player with `opponentName`, for the VERSUS screen. */
  readonly matched: (opponentName: string) => void;
  /** Paired with an opponent and the first snapshot arrived: the match can be built. */
  readonly started: () => void;
  /** The server ended the match, before or after the first snapshot. */
  readonly ended: (ending: MatchEnding) => void;
  /**
   * The opponent's connection dropped (`graceMs`: how long the server holds their seat) or came
   * back (`null`). If the window runs out, `ended` follows with `opponent-left`.
   */
  readonly opponentPresence: (graceMs: number | null) => void;
  /** The connection dropped once paired; the session is reconnecting (DEC-349). */
  readonly reconnecting: () => void;
  /** A reconnect took the seat back: the same Duel goes on. */
  readonly reconnected: () => void;
  /** The connection ended before the match did (while paired: no reconnect inside the window). */
  readonly lost: () => void;
};

/** Where the guest id the server issued is kept between visits (`PersistenceController` in the app). */
export type GuestIdStore = {
  /** The saved id, or `null`; may reject (storage unavailable). */
  readonly load: () => Promise<string | null>;
  /** Saves the id; may reject. */
  readonly save: (guestId: string) => Promise<void>;
};

/** Everything `DuelSession` is built from. */
export type DuelSessionDeps = {
  /** A new, unconnected transport per Duel (`WebSocketTransport` in the app). */
  readonly createTransport: () => MessageTransport;
  readonly guestIds: GuestIdStore;
  /** Times the reconnect attempts and the window. */
  readonly clock: SessionClock;
  readonly logger: Logger;
  readonly handlers: DuelSessionHandlers;
};
