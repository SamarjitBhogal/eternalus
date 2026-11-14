import type { BotReport } from './BotReport.types';

/** A report of a bot that paired into match `m1` as light, moved and saw states in order. */
export const reportOf = (overrides: Partial<BotReport> = {}): BotReport => ({
  name: 'A',
  isWaiting: false,
  matchId: 'm1',
  seed: 7,
  team: 'light',
  legendId: 'e1',
  states: 10,
  lastTick: 10,
  ticksOutOfOrder: 0,
  firstMoveTick: 2,
  attackTicks: 0,
  enemyHealthFirst: null,
  enemyHealthLow: null,
  ownHealthFirst: null,
  ownHealthLow: null,
  hasKilled: false,
  hasDied: false,
  ended: null,
  rejected: [],
  error: null,
  ...overrides,
});
