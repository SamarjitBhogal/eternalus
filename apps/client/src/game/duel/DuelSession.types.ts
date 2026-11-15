import type { Logger } from '@eternalus/core';
import type { MatchEnding } from '@eternalus/protocol';

import type { MessageTransport } from '../engine/net/MessageTransport';

/**
 * Where a Duel is: `idle` (no connection), `queued` (waiting for an opponent), `matched` (paired,
 * the first snapshot not yet in), `started` (playing), `ended` (the server ended the match).
 */
export type DuelStatus = 'idle' | 'queued' | 'matched' | 'started' | 'ended';

/** What `DuelSession` tells its owner; each is called at most once per Duel. */
export type DuelSessionHandlers = {
  /** Paired with an opponent and the first snapshot arrived: the match can be built. */
  readonly started: () => void;
  /** The server ended the match, before or after the first snapshot. */
  readonly ended: (ending: MatchEnding) => void;
  /** The connection ended before the match did. */
  readonly lost: () => void;
};

/** Everything `DuelSession` is built from. */
export type DuelSessionDeps = {
  /** A new, unconnected transport per Duel (`WebSocketTransport` in the app). */
  readonly createTransport: () => MessageTransport;
  readonly logger: Logger;
  readonly handlers: DuelSessionHandlers;
};
