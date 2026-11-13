import type { EntityId, InputIntent, PlayableTeam, Snapshot } from '@eternalus/core';

/** Why the server dropped a client message without applying it. */
export type RejectReason = 'malformed' | 'too-large' | 'rate-limited' | 'not-in-match' | 'in-match';

/** Why a Duel ended (ADR 0016 point 1). */
export type MatchEndReason = 'finished' | 'opponent-left';

/**
 * Every message a client sends: plain JSON, discriminated by `type` (ADR 0016 point 3). The
 * server stamps the actor from the connection, so no message names an entity.
 */
export type ClientMessage =
  /** Joins the Duel queue as `name` (1 to `MAX_PLAYER_NAME_LENGTH` letters, digits, spaces, `_`, `-`). */
  | { readonly type: 'queue-join'; readonly name: string }
  | { readonly type: 'queue-leave' }
  /** The player's per-tick input; `seq` rises by one per message and is echoed in `state`. */
  | { readonly type: 'intent'; readonly seq: number; readonly intent: InputIntent };

/** Every message the server sends: plain JSON, discriminated by `type`. */
export type ServerMessage =
  | { readonly type: 'queue-waiting' }
  /**
   * Two players were paired; `legendId` is the receiver's own Legend. `seed` is the match's map
   * seed: the client generates the same map from it (core's generator is deterministic).
   * `opponentName` is the other player's name from their `queue-join`.
   */
  | {
      readonly type: 'match-found';
      readonly matchId: string;
      readonly seed: number;
      readonly team: PlayableTeam;
      readonly legendId: EntityId;
      readonly opponentName: string;
    }
  /** The match after a tick; `ackSeq` is the last `intent.seq` applied for the receiver. */
  | { readonly type: 'state'; readonly snapshot: Snapshot; readonly ackSeq: number }
  | {
      readonly type: 'match-ended';
      readonly reason: MatchEndReason;
      readonly winner: PlayableTeam | null;
    }
  | { readonly type: 'rejected'; readonly reason: RejectReason };
