import { CAPTURE_POINT_COURT } from '../zones/capturePointCourt';
import type { MobDefinition } from './mobs.types';

/**
 * The outer capture point's mini-boss (reference 04 "Mini-bosses at the quarter mark", architecture
 * 18 §7.1): balancing.md's MiniBoss row, held in its zone by `GuardController`. One per outer
 * capture point; when it appears, its leash and that it never respawns are the zone's guard plan
 * (`content/structures/guardPlans.ts`). Its kill pays the killer's whole team, capped
 * (`XP_SOURCES.teamKills`, DEC-237), and locks its zone while it lives (`CaptureSystem`). Its
 * moves, regeneration and permanent team buff come later; until then it fights with one melee hit.
 */
export const CAPTURE_POINT_BOSS = {
  id: 'capture-point-boss',
  kind: 'heavy-mob',
  displayName: 'Capture Point Boss',
  baseHealth: 8200, // TUNE: balancing.md MiniBoss "10 × refHealth ≈ 8,200"
  footprintRadius: 1.2, // TUNE: no reference value; 1.5× the heavy minion so it reads as a boss
  visionRadius: CAPTURE_POINT_COURT.acquisitionRadius, // as far as its aggro reaches: the whole court
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'capture-point-boss',
  // TUNE: balancing.md MiniBoss "≈ 205 per hit, 1.5 s interval"; reach as the heavy minion
  attack: { strategy: 'melee', damage: 205, reach: 1.5, interval: 1.5 },
  xpValue: 0, // the killer earns nothing alone: its 500 XP is team-wide (XP_SOURCES.teamKills)
  movementProfile: {
    maxSpeed: 2.8, // TUNE: no reference value; as the heavy minion
    acceleration: 14, // TUNE: as the heavy minion
    mass: 3.125, // TUNE: as the heavy minion
  },
} as const satisfies MobDefinition;
