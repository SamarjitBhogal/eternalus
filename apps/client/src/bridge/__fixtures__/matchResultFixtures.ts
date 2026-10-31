/**
 * Test support: a core `MatchResult` with neutral defaults, so a test names only the fields it is
 * about. Imported only by tests, never by a module `main.tsx` reaches.
 */
import type { MatchResult } from '@eternalus/core';

const NO_SCORE = { score: 0 } as const;

/** A light win by `objective-lost` after 2 minutes (3600 ticks at 30 TPS), no Legends scored. */
export function matchResultFixture(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    winner: 'light',
    condition: 'objective-lost',
    playerTeam: 'light',
    hadHuman: true,
    durationTicks: 3600,
    seed: 7,
    configHash: 1,
    legends: [],
    teams: { light: NO_SCORE, dark: NO_SCORE },
    finalHash: 2,
    ...overrides,
  };
}
