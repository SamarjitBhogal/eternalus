import type { EntityId, InputIntent, Snapshot } from '@eternalus/core';

/**
 * A started online Duel as the match sees it: the Legend the server gave this player, the latest
 * snapshot the server sent and a way to send this tick's intent. `DuelSession` implements it.
 */
export interface DuelLink {
  /** This player's Legend, from the server's `match-found`. */
  readonly legendId: EntityId;
  /** The newest snapshot received; the same one again until the next arrives. */
  latestSnapshot(): Snapshot;
  /** Sends `intent` with the next sequence number; dropped once the Duel is over. */
  sendIntent(intent: InputIntent): void;
}
