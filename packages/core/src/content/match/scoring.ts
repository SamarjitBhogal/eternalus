import { CAPTURE_POINT_BOSS } from '../mobs/capturePointBoss';
import { CORNER_BOSS } from '../mobs/cornerBoss';
import { GREATER_BOSS } from '../mobs/greaterBoss';
import type { AuthoredScoringOptions } from './scoring.types';

/**
 * The match's scoring values as authored (architecture 12 §5): the owner's point model (DEC-79),
 * FR-007's objective points (DEC-131) and the assist window in seconds. `loadScoring` loads them
 * once into the ticks `Simulation` passes in, and `createDefaultScoringRules` hands each scoring
 * rule its part. Bosses and the sovereign give no personal points: the sovereign has no line, and
 * the bosses, built as heavy mobs until doc 04's `Boss` family, are listed in `bossIds`.
 */
export const SCORING = {
  weights: {
    legendKill: 15, // TUNE: DEC-79
    legendKillAssist: 7, // TUNE: DEC-79
    death: 0, // the owner's request of 2026-10-27 (game-loop plan §4.4): no negative points
    minionKill: { 'light-mob': 1, 'medium-mob': 4, 'heavy-mob': 12 }, // DEC-79
    structureDestroyed: 5, // TUNE: DEC-131 (team-only points for the destroying team, DEC-212)
    captureCheckpoint: 3, // TUNE: DEC-131 (team-only, DEC-214)
    holdPerMinute: 1, // TUNE: DEC-131 (pooled, DEC-214)
  },
  bossIds: [CORNER_BOSS.id, CAPTURE_POINT_BOSS.id, GREATER_BOSS.id], // DEC-79
  /** How long a Legend's hit on an enemy Legend still earns an assist when that Legend dies. */
  assistWindowSeconds: 30, // TUNE: DEC-79 (the owner's ruling of 2026-10-19)
} as const satisfies AuthoredScoringOptions;
