import { describe, expect, it } from 'vitest';

import { ServerMessageDecoder } from './ServerMessageDecoder';

const decoder = new ServerMessageDecoder();
const SNAPSHOT = { tick: 3, match: {}, entities: [] };

describe('ServerMessageDecoder', () => {
  it.each([
    [{ type: 'queue-waiting' }],
    [{ type: 'match-found', matchId: 'm1', seed: 3, team: 'dark', legendId: 'entity-2' }],
    [{ type: 'state', snapshot: SNAPSHOT, ackSeq: 4 }],
    [{ type: 'match-ended', reason: 'opponent-left', winner: 'light' }],
    [{ type: 'match-ended', reason: 'finished', winner: null }],
    [{ type: 'rejected', reason: 'in-match' }],
  ])('decodes %j', (message) => {
    expect(decoder.decode(JSON.stringify(message))).toEqual(message);
  });

  it.each([
    ['text'],
    ['[]'],
    ['{"type":"unknown"}'],
    ['{"type":"match-found","matchId":1,"seed":1,"team":"dark","legendId":"a"}'],
    ['{"type":"match-found","matchId":"m","seed":1,"team":"neutral","legendId":"a"}'],
    ['{"type":"match-found","matchId":"m","team":"dark","legendId":"a"}'],
    ['{"type":"match-found","matchId":"m","seed":1.5,"team":"dark","legendId":"a"}'],
    ['{"type":"state","snapshot":{},"ackSeq":1}'],
    ['{"type":"match-ended","reason":"quit","winner":null}'],
    ['{"type":"rejected","reason":"other"}'],
  ])('returns null for %s', (raw) => {
    expect(decoder.decode(raw)).toBeNull();
  });
});
