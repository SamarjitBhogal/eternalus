import { describe, expect, it } from 'vitest';
import { ClientMessageParser } from './ClientMessageParser';
import { MAX_CLIENT_MESSAGE_LENGTH, MAX_PLAYER_NAME_LENGTH } from './ClientMessageParser.constants';

const parser = new ClientMessageParser();
const intent = { move: { x: 1, y: 0 }, aim: { x: 5, y: 6 }, triggered: ['ability-1'] };

describe('ClientMessageParser', () => {
  it('parses the queue messages', () => {
    expect(parser.parse('{"type":"queue-join","name":"Ana"}')).toEqual({
      ok: true,
      message: { type: 'queue-join', name: 'Ana' },
    });
    expect(parser.parse('{"type":"queue-leave"}')).toEqual({
      ok: true,
      message: { type: 'queue-leave' },
    });
  });

  it('keeps a well-formed guest id on a join and drops a malformed one', () => {
    const guestId = '123e4567-e89b-42d3-a456-426614174000';
    expect(parser.parse(JSON.stringify({ type: 'queue-join', name: 'Ana', guestId }))).toEqual({
      ok: true,
      message: { type: 'queue-join', name: 'Ana', guestId },
    });
    for (const bad of ['', 'abc', guestId.toUpperCase(), `${guestId}0`, 7, null]) {
      expect(
        parser.parse(JSON.stringify({ type: 'queue-join', name: 'Ana', guestId: bad })),
      ).toEqual({
        ok: true,
        message: { type: 'queue-join', name: 'Ana' },
      });
    }
  });

  it('parses a forfeit', () => {
    expect(parser.parse('{"type":"forfeit"}')).toEqual({ ok: true, message: { type: 'forfeit' } });
  });

  it.each(['Ana', 'Ana Maria', 'Ñandú_2-b', 'x'.repeat(MAX_PLAYER_NAME_LENGTH)])(
    'accepts the name %j',
    (name) => {
      expect(parser.parse(JSON.stringify({ type: 'queue-join', name }))).toEqual({
        ok: true,
        message: { type: 'queue-join', name },
      });
    },
  );

  it.each([
    ['missing', undefined],
    ['not a string', 7],
    ['empty', ''],
    ['too long', 'x'.repeat(MAX_PLAYER_NAME_LENGTH + 1)],
    ['padded with a space', ' Ana'],
    ['holding markup', '<b>Ana</b>'],
    ['holding a control character', 'An\na'],
  ])('rejects a join whose name is %s', (_why, name) => {
    expect(parser.parse(JSON.stringify({ type: 'queue-join', name }))).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('parses an intent and drops unknown fields', () => {
    const raw = JSON.stringify({ type: 'intent', seq: 3, intent, actorId: 99, extra: true });
    expect(parser.parse(raw)).toEqual({ ok: true, message: { type: 'intent', seq: 3, intent } });
  });

  it('keeps isAttacking and a null aim', () => {
    const raw = JSON.stringify({
      type: 'intent',
      seq: 0,
      intent: { ...intent, aim: null, isAttacking: true },
    });
    expect(parser.parse(raw)).toEqual({
      ok: true,
      message: { type: 'intent', seq: 0, intent: { ...intent, aim: null, isAttacking: true } },
    });
  });

  it('refuses a message over the size limit before parsing it', () => {
    expect(parser.parse(' '.repeat(MAX_CLIENT_MESSAGE_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it.each([
    ['not JSON', '{'],
    ['not an object', '[1]'],
    ['null', 'null'],
    ['an unknown type', '{"type":"dev-spawn"}'],
    ['a fractional seq', JSON.stringify({ type: 'intent', seq: 1.5, intent })],
    ['a negative seq', JSON.stringify({ type: 'intent', seq: -1, intent })],
    ['a missing intent', '{"type":"intent","seq":1}'],
    [
      'a move out of range',
      JSON.stringify({ type: 'intent', seq: 1, intent: { ...intent, move: { x: 2, y: 0 } } }),
    ],
    [
      'a non-numeric aim',
      JSON.stringify({ type: 'intent', seq: 1, intent: { ...intent, aim: { x: '1', y: 0 } } }),
    ],
    [
      'an unknown slot',
      JSON.stringify({ type: 'intent', seq: 1, intent: { ...intent, triggered: ['nuke'] } }),
    ],
    [
      'too many slots',
      JSON.stringify({
        type: 'intent',
        seq: 1,
        intent: { ...intent, triggered: Array(8).fill('ability-1') },
      }),
    ],
    [
      'triggered not an array',
      JSON.stringify({ type: 'intent', seq: 1, intent: { ...intent, triggered: 'ability-1' } }),
    ],
    [
      'a non-boolean isAttacking',
      JSON.stringify({ type: 'intent', seq: 1, intent: { ...intent, isAttacking: 1 } }),
    ],
  ])('refuses %s as malformed', (_label, raw) => {
    expect(parser.parse(raw)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('refuses a non-finite number', () => {
    // JSON cannot spell Infinity; 1e999 parses to it.
    const raw =
      '{"type":"intent","seq":1,"intent":{"move":{"x":0,"y":0},"aim":{"x":1e999,"y":0},"triggered":[]}}';
    expect(parser.parse(raw)).toEqual({ ok: false, reason: 'malformed' });
  });
});
