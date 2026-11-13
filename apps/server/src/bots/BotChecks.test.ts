import { describe, expect, it } from 'vitest';
import { BotChecks } from './BotChecks';
import { reportOf } from './BotReport.fixture';

const PAIR = [reportOf(), reportOf({ name: 'B', team: 'dark', legendId: 'e2' })];

describe('BotChecks', () => {
  const checks = new BotChecks();

  it('passes a clean pair with an odd player still waiting', () => {
    const waiting = reportOf({ name: 'C', matchId: null, isWaiting: true, states: 0 });

    expect(checks.failures([...PAIR, waiting])).toEqual([]);
    expect(checks.matchCount([...PAIR, waiting])).toBe(1);
  });

  it('fails an odd player that got paired or never waited', () => {
    const lone = reportOf({ name: 'C', matchId: null, isWaiting: false, states: 0 });

    expect(checks.failures([...PAIR, lone])).toContain('C should still be waiting');
  });

  it('fails a pair on one team with different seeds and the same Legend', () => {
    const failures = checks.failures([reportOf(), reportOf({ name: 'B', seed: 8 })]);

    expect(failures).toEqual(['m1: both on light', 'm1: seeds differ', 'm1: same Legend']);
  });

  it('fails a match with one player, and a missing pairing', () => {
    const failures = checks.failures([reportOf(), reportOf({ name: 'B', matchId: null })]);

    expect(failures).toContain('1 players paired, expected 2');
    expect(failures).toContain('m1 has 1 players (A)');
  });

  it('fails a bot with no state, disordered ticks, no movement or a socket error', () => {
    const failures = checks.failures([
      reportOf({ states: 0, firstMoveTick: null, error: 'socket error' }),
      reportOf({ name: 'B', team: 'dark', legendId: 'e2', ticksOutOfOrder: 3 }),
    ]);

    expect(failures).toEqual([
      'A: no state after match-found',
      'A: never moved',
      'B: 3 states out of tick order',
      'A: socket error',
    ]);
  });

  it('does not call a bot that moved never when its match already ended', () => {
    const ended = { reason: 'finished', winner: 'dark' } as const;

    expect(
      checks.failures([
        reportOf({ firstMoveTick: null, ended }),
        reportOf({ name: 'B', team: 'dark', legendId: 'e2', ended }),
      ]),
    ).toEqual([]);
  });
});
