import { isPlayableTeam, type Snapshot } from '@eternalus/core';
import type { MatchEndReason, RejectReason, ServerMessage } from '@eternalus/protocol';

import {
  GUEST_ID_PATTERN,
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_NAME_PATTERN,
} from '../../../bridge/domain.types';
import { MATCH_END_REASONS, REJECT_REASONS } from './ServerMessageDecoder.constants';

type Fields = Readonly<Record<string, unknown>>;

/**
 * Reads one text frame from the server into a `ServerMessage`, or `null` when it is not one. The
 * server is trusted, but a broken frame must never throw into the game loop, so it checks the JSON,
 * the `type` tag and the fields the client reads, and builds the message from them (unknown fields
 * are dropped). A snapshot is checked only for its top-level shape: the server's core made it.
 */
export class ServerMessageDecoder {
  /** Decodes `raw`; `null` for text that is not JSON, has an unknown `type` or lacks a field. */
  public decode(raw: string): ServerMessage | null {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
    return ServerMessageDecoder.isRecord(data) ? ServerMessageDecoder.toMessage(data) : null;
  }

  private static toMessage(data: Fields): ServerMessage | null {
    switch (data.type) {
      case 'welcome':
        return typeof data.guestId === 'string' && GUEST_ID_PATTERN.test(data.guestId)
          ? { type: 'welcome', guestId: data.guestId }
          : null;
      case 'queue-waiting':
        return { type: 'queue-waiting' };
      case 'match-found': {
        const { matchId, seed, team, legendId, opponentName } = data;
        return typeof matchId === 'string' &&
          Number.isSafeInteger(seed) &&
          isPlayableTeam(team) &&
          typeof legendId === 'string' &&
          ServerMessageDecoder.isPlayerName(opponentName)
          ? { type: 'match-found', matchId, seed: seed as number, team, legendId, opponentName }
          : null;
      }
      case 'state': {
        const { snapshot, ackSeq } = data;
        return ServerMessageDecoder.isSnapshot(snapshot) && typeof ackSeq === 'number'
          ? { type: 'state', snapshot, ackSeq }
          : null;
      }
      case 'match-ended': {
        const { reason, winner } = data;
        return ServerMessageDecoder.isEndReason(reason) &&
          (winner === null || isPlayableTeam(winner))
          ? { type: 'match-ended', reason, winner }
          : null;
      }
      case 'rejected':
        return ServerMessageDecoder.isRejectReason(data.reason)
          ? { type: 'rejected', reason: data.reason }
          : null;
      default:
        return null;
    }
  }

  private static isPlayerName(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      value.length <= MAX_PLAYER_NAME_LENGTH &&
      PLAYER_NAME_PATTERN.test(value)
    );
  }

  private static isSnapshot(value: unknown): value is Snapshot {
    return (
      ServerMessageDecoder.isRecord(value) &&
      typeof value.tick === 'number' &&
      Array.isArray(value.entities) &&
      ServerMessageDecoder.isRecord(value.match)
    );
  }

  private static isEndReason(value: unknown): value is MatchEndReason {
    return typeof value === 'string' && MATCH_END_REASONS.has(value);
  }

  private static isRejectReason(value: unknown): value is RejectReason {
    return typeof value === 'string' && REJECT_REASONS.has(value);
  }

  private static isRecord(value: unknown): value is Fields {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
