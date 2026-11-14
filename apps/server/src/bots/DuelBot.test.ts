import type { Snapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { BotLogger } from './BotLogger';
import { BotNavigator } from './BotNavigator';
import { DuelBot } from './DuelBot';
import { FakeBotLinks } from './FakeBotLinks';

/** A navigator whose path always heads to (0, 50). */
const NAVIGATOR = new BotNavigator({
  waypoint: (_s, _g, out) => {
    out.x = 0;
    out.y = 50;
    return true;
  },
});

const entity = (id: string, x: number, y: number, health: number, team: 'light' | 'dark') => ({
  id,
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team,
  transform: { x, y, radius: 1 },
  health: { current: health, max: 100 },
  progression: null,
  area: null,
  capture: null,
});

const state = (tick: number, own: [number, number, number], enemy?: [number, number, number]) =>
  ({
    type: 'state',
    ackSeq: 0,
    snapshot: {
      tick,
      entities: [
        entity('e1', own[0], own[1], own[2], 'light'),
        ...(enemy === undefined ? [] : [entity('e2', enemy[0], enemy[1], enemy[2], 'dark')]),
      ],
    } as unknown as Snapshot,
  }) as const;

const setup = () => {
  const lines: string[] = [];
  const links = new FakeBotLinks();
  const logger = new BotLogger(
    { out: (line) => lines.push(line), err: (line) => lines.push(line) },
    { nowMs: () => 0 },
  );
  const bot = new DuelBot('A', 'ws://x', links, { forSeed: () => NAVIGATOR }, logger);
  bot.connect();
  return { bot, links, lines, handlers: links.lastHandlers(), sent: links.lastSent() };
};

describe('DuelBot', () => {
  it('joins the queue on open and notes waiting', () => {
    const { bot, handlers, sent } = setup();

    handlers.onOpen();
    handlers.onMessage({ type: 'queue-waiting' });

    expect(sent).toEqual([{ type: 'queue-join' }]);
    expect(bot.report.isWaiting).toBe(true);
  });

  it('records the match and sends an intent per state, with rising seq', () => {
    const { bot, handlers, sent } = setup();

    handlers.onMessage({
      type: 'match-found',
      matchId: 'm1',
      seed: 7,
      team: 'light',
      legendId: 'e1',
    });
    handlers.onMessage(state(1, [0, 0, 100], [0, 90, 100]));
    handlers.onMessage(state(2, [0, 5, 100], [0, 90, 100]));

    expect(bot.report).toMatchObject({ matchId: 'm1', seed: 7, states: 2, firstMoveTick: 2 });
    expect(sent.map((message) => message.type === 'intent' && message.seq)).toEqual([0, 1]);
    expect(sent[0]).toMatchObject({ intent: { move: { x: 0, y: 1 }, isAttacking: false } });
  });

  it('attacks in reach, tracks health and counts a kill when the enemy falls', () => {
    const { bot, handlers, sent } = setup();
    handlers.onMessage({
      type: 'match-found',
      matchId: 'm1',
      seed: 7,
      team: 'light',
      legendId: 'e1',
    });

    handlers.onMessage(state(1, [0, 0, 100], [0, 2, 100]));
    handlers.onMessage(state(2, [0, 0, 80], [0, 2, 0]));

    expect(sent[1]).toMatchObject({ intent: { isAttacking: true } });
    expect(bot.report).toMatchObject({
      attackTicks: 2,
      ownHealthFirst: 100,
      ownHealthLow: 80,
      enemyHealthFirst: 100,
      enemyHealthLow: 0,
      hasKilled: true,
    });
  });

  it('idles without an enemy, flags ticks out of order and ignores states before a match', () => {
    const { bot, handlers, sent } = setup();
    handlers.onMessage(state(1, [0, 0, 100]));
    expect(sent).toEqual([]);

    handlers.onMessage({
      type: 'match-found',
      matchId: 'm1',
      seed: 7,
      team: 'light',
      legendId: 'e1',
    });
    handlers.onMessage(state(5, [0, 0, 100]));
    handlers.onMessage(state(5, [0, 0, 100]));

    expect(sent[0]).toMatchObject({ intent: { move: { x: 0, y: 0 }, aim: null } });
    expect(bot.report.ticksOutOfOrder).toBe(1);
  });

  it('logs progress every 300 states', () => {
    const { handlers, lines } = setup();
    handlers.onMessage({
      type: 'match-found',
      matchId: 'm1',
      seed: 7,
      team: 'light',
      legendId: 'e1',
    });

    for (let tick = 1; tick <= 300; tick += 1) {
      handlers.onMessage(state(tick, [0, 0, 100], [0, 90, 100]));
    }

    expect(lines.filter((line) => line.includes('tick 300'))).toHaveLength(1);
  });

  it('records the end, rejections and socket errors; a win counts as a kill', () => {
    const { bot, handlers } = setup();
    handlers.onMessage({
      type: 'match-found',
      matchId: 'm1',
      seed: 7,
      team: 'light',
      legendId: 'e1',
    });

    handlers.onMessage({ type: 'rejected', reason: 'rate-limited' });
    handlers.onMessage({ type: 'match-ended', reason: 'finished', winner: 'light' });
    handlers.onError();
    bot.close();

    expect(bot.report).toMatchObject({
      rejected: ['rate-limited'],
      ended: { reason: 'finished', winner: 'light' },
      hasKilled: true,
      error: 'socket error',
    });
  });

  it('counts a kill and a death when the Legends vanish from the snapshot after being seen', () => {
    const { bot, handlers, lines } = setup();
    handlers.onMessage({
      type: 'match-found',
      matchId: 'm1',
      seed: 7,
      team: 'light',
      legendId: 'e1',
    });
    handlers.onMessage(state(1, [0, 0, 40], [1, 0, 30]));

    // Core removes dead Legends: both traded the last hit on the same tick.
    handlers.onMessage({
      type: 'state',
      ackSeq: 0,
      snapshot: { tick: 2, entities: [] } as unknown as Snapshot,
    });

    expect(bot.report).toMatchObject({
      hasKilled: true,
      hasDied: true,
      enemyHealthLow: 0,
      ownHealthLow: 0,
    });
    expect(lines.some((line) => line.includes('killed the enemy Legend e2'))).toBe(true);
    expect(lines.some((line) => line.includes('own Legend died'))).toBe(true);
  });
});
