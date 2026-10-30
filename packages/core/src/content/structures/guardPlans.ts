import type { GuardPlanDefinition } from './structures.types';

const LEASH = 8; // TUNE: balancing.md "leash radius 8 m"
const RESPAWN = 120; // TUNE: game doc "respawn every 2 minutes"
const POST_GAP = 2; // TUNE: no reference value; just outside the footprint
// TUNE: a guard decides every 10 ticks at up to 3.5 m/s (about 1.2 m), plus a margin.
const TOLERANCE = 2;

/**
 * Each structure kind's guards (architecture 07 §6, 18 §7). Counts are balancing.md's
 * `Recommendation:` (SpawnerTower 4 light, BuffTower 6 medium, Stronghold 6 light ranged + 2 heavy
 * melee, minus 2 light per lost SpawnerTower). Ranged attacks wait for projectiles (sprint 2.3),
 * so the Stronghold's light guards fight in melee for now.
 */
export const GUARD_PLANS: Readonly<Record<string, GuardPlanDefinition>> = {
  'spawner-tower': {
    table: [{ mobId: 'light-guard', count: 4 }],
    leashRadius: LEASH,
    respawnSeconds: RESPAWN,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
  },
  'buff-tower': {
    table: [{ mobId: 'medium-guard', count: 6 }],
    leashRadius: LEASH,
    respawnSeconds: RESPAWN,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
  },
  stronghold: {
    table: [
      { mobId: 'light-guard', count: 6, lessPerLostSpawnerTower: 2 },
      { mobId: 'heavy-guard', count: 2 },
    ],
    leashRadius: LEASH,
    respawnSeconds: RESPAWN,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
  },
};
