import { describe, expect, it } from 'vitest';
import { reportOf } from './BotReport.fixture';
import { BotSummary } from './BotSummary';

describe('BotSummary', () => {
  const summary = new BotSummary();

  it('sees damage only when the enemy health fell below its first value', () => {
    expect(summary.isDamageDealt([reportOf()])).toBe(false);
    expect(summary.isDamageDealt([reportOf({ enemyHealthFirst: 100, enemyHealthLow: 100 })])).toBe(
      false,
    );
    expect(summary.isDamageDealt([reportOf({ enemyHealthFirst: 100, enemyHealthLow: 60 })])).toBe(
      true,
    );
  });

  it('prints a header and one row per bot with health and kill columns', () => {
    const lines = summary.lines([
      reportOf({ enemyHealthFirst: 100, enemyHealthLow: 0, hasKilled: true, rejected: ['x', 'x'] }),
      reportOf({ name: 'C', matchId: null, isWaiting: true, team: null }),
    ]);

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('100/0');
    expect(lines[1]).toContain('yes');
    expect(lines[1]?.endsWith(' x')).toBe(true);
    expect(lines[2]).toContain('waiting');
  });
});
