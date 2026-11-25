import { describe, expect, it } from 'vitest';

import { ServerMessageDecoder } from './ServerMessageDecoder';

const decoder = new ServerMessageDecoder();
const SNAPSHOT = { tick: 3, match: {}, entities: [] };

describe('ServerMessageDecoder', () => {
  it.each([
    [{ type: 'welcome', guestId: '123e4567-e89b-42d3-a456-426614174000' }],
    [{ type: 'queue-waiting' }],
    [
      {
        type: 'match-found',
        matchId: 'm1',
        seed: 3,
        team: 'dark',
        legendId: 'entity-2',
        opponentName: 'Ana',
      },
    ],
    [{ type: 'state', snapshot: SNAPSHOT, ackSeq: 4 }],
    [{ type: 'match-ended', reason: 'opponent-left', winner: 'light' }],
    [{ type: 'match-ended', reason: 'finished', winner: null }],
    [{ type: 'rejected', reason: 'in-match' }],
    [{ type: 'opponent-presence', status: 'disconnected', graceMs: 10_000 }],
    [{ type: 'opponent-presence', status: 'reconnected' }],
  ])('decodes %j', (message) => {
    expect(decoder.decode(JSON.stringify(message))).toEqual(message);
  });

  it.each([
    ['text'],
    ['[]'],
    ['{"type":"unknown"}'],
    ['{"type":"welcome","guestId":"nope"}'],
    ['{"type":"welcome"}'],
    [
      '{"type":"match-found","matchId":1,"seed":1,"team":"dark","legendId":"a","opponentName":"Ana"}',
    ],
    [
      '{"type":"match-found","matchId":"m","seed":1,"team":"neutral","legendId":"a","opponentName":"Ana"}',
    ],
    ['{"type":"match-found","matchId":"m","team":"dark","legendId":"a","opponentName":"Ana"}'],
    [
      '{"type":"match-found","matchId":"m","seed":1.5,"team":"dark","legendId":"a","opponentName":"Ana"}',
    ],
    ['{"type":"match-found","matchId":"m","seed":1,"team":"dark","legendId":"a"}'],
    [
      '{"type":"match-found","matchId":"m","seed":1,"team":"dark","legendId":"a","opponentName":"<b>"}',
    ],
    [
      `{"type":"match-found","matchId":"m","seed":1,"team":"dark","legendId":"a","opponentName":"${'x'.repeat(17)}"}`,
    ],
    ['{"type":"state","snapshot":{},"ackSeq":1}'],
    ['{"type":"match-ended","reason":"quit","winner":null}'],
    ['{"type":"opponent-presence","status":"disconnected"}'],
    ['{"type":"opponent-presence","status":"gone"}'],
    ['{"type":"rejected","reason":"other"}'],
  ])('returns null for %s', (raw) => {
    expect(decoder.decode(raw)).toBeNull();
  });
});
