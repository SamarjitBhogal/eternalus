import type { AbilitySlot, InputIntent, Vec2 } from '@eternalus/core';
import {
  ABILITY_SLOTS,
  MAX_CLIENT_MESSAGE_LENGTH,
  MAX_INTENT_SEQ,
} from './ClientMessageParser.constants';
import type { ParseResult } from './ClientMessageParser.types';
import type { ClientMessage } from './messages.types';

/**
 * The server's trust boundary for one client message (ADR 0016 point 7): checks size, JSON shape,
 * enums and finite numbers, and never throws, so one bad message cannot end a shared match.
 * Unknown fields are dropped: the returned message holds only the fields of its type.
 */
export class ClientMessageParser {
  /** Parses `raw` text from the socket. */
  public parse(raw: string): ParseResult {
    if (raw.length > MAX_CLIENT_MESSAGE_LENGTH) return { ok: false, reason: 'too-large' };
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'malformed' };
    }
    const message = this.toMessage(data);
    return message === undefined ? { ok: false, reason: 'malformed' } : { ok: true, message };
  }

  private toMessage(data: unknown): ClientMessage | undefined {
    if (!ClientMessageParser.isRecord(data)) return undefined;
    switch (data.type) {
      case 'queue-join':
        return { type: 'queue-join' };
      case 'queue-leave':
        return { type: 'queue-leave' };
      case 'intent':
        return this.toIntentMessage(data);
      default:
        return undefined;
    }
  }

  private toIntentMessage(data: Readonly<Record<string, unknown>>): ClientMessage | undefined {
    const { seq } = data;
    if (typeof seq !== 'number' || !Number.isInteger(seq) || seq < 0 || seq > MAX_INTENT_SEQ) {
      return undefined;
    }
    const intent = this.toIntent(data.intent);
    return intent === undefined ? undefined : { type: 'intent', seq, intent };
  }

  private toIntent(data: unknown): InputIntent | undefined {
    if (!ClientMessageParser.isRecord(data)) return undefined;
    const move = ClientMessageParser.toVec2(data.move);
    const aim = data.aim === null ? null : ClientMessageParser.toVec2(data.aim);
    const triggered = ClientMessageParser.toSlots(data.triggered);
    const { isAttacking } = data;
    if (move === undefined || aim === undefined || triggered === undefined) return undefined;
    if (isAttacking !== undefined && typeof isAttacking !== 'boolean') return undefined;
    // The movement axes are a normalised vector (Command.types `InputIntent`).
    if (Math.abs(move.x) > 1 || Math.abs(move.y) > 1) return undefined;
    return {
      move,
      aim,
      triggered,
      ...(isAttacking === undefined ? {} : { isAttacking }),
    };
  }

  private static toVec2(data: unknown): Vec2 | undefined {
    if (!ClientMessageParser.isRecord(data)) return undefined;
    const { x, y } = data;
    if (typeof x !== 'number' || typeof y !== 'number') return undefined;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    return { x, y };
  }

  private static toSlots(data: unknown): readonly AbilitySlot[] | undefined {
    if (!Array.isArray(data) || data.length > ABILITY_SLOTS.size) return undefined;
    const slots: AbilitySlot[] = [];
    for (const slot of data) {
      if (!ClientMessageParser.isAbilitySlot(slot)) return undefined;
      slots.push(slot);
    }
    return slots;
  }

  private static isAbilitySlot(value: unknown): value is AbilitySlot {
    return typeof value === 'string' && (ABILITY_SLOTS as ReadonlySet<string>).has(value);
  }

  private static isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
