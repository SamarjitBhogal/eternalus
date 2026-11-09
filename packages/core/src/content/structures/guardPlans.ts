import type { GuardPlanDefinition } from './structures.types';

const LEASH = 8; // TUNE: balancing.md "leash radius 8 m"
const RESPAWN = 120; // TUNE: game doc "respawn every 2 minutes"
const POST_GAP = 2; // TUNE: no reference value; just outside the footprint
// TUNE: owner 2026-11-02 (DEC-144): one decision's walk (10 ticks at up to 3.5 m/s) plus the
// farthest a guard stands from a target in reach (radii + reach, up to 0.8 + 1.25 + 1.5 = 3.55 m
// for a heavy guard against a Sentinel); at most 4.5 m for one guard, so about 0.5 m of margin.
// guardPlans.test.ts checks the sum against every guard and target in content.
const TOLERANCE = 5;

const CAMP = {
  leashRadius: 6, // TUNE: balancing.md camp leash
  respawnSeconds: 120, // TUNE: balancing.md "a cleared camp respawns 120 s later"
  postGap: POST_GAP,
  leashTolerance: TOLERANCE,
  activation: 'countdown-end', // requirements doc: camps are inactive until the countdown ends
  respawn: 'group',
} as const;

/**
 * The forest camps' groups (architecture 18 §7.1), keyed by camp definition id. Compositions are
 * balancing.md's `Recommendation:` (light 4 light; medium 2 medium + 2 light; heavy 1 heavy + 2
 * medium). The corner camp holds one corner boss (game doc "Outer (Corner) Camps"; interim,
 * PM-approved for Phase 3).
 */
const CAMP_PLANS: Readonly<Record<string, GuardPlanDefinition>> = {
  'forest-camp-light': { ...CAMP, table: [{ mobId: 'light-camp-mob', count: 4 }] },
  'forest-camp-medium': {
    ...CAMP,
    table: [
      { mobId: 'medium-camp-mob', count: 2 },
      { mobId: 'light-camp-mob', count: 2 },
    ],
  },
  'forest-camp-heavy': {
    ...CAMP,
    table: [
      { mobId: 'heavy-camp-mob', count: 1 },
      { mobId: 'medium-camp-mob', count: 2 },
    ],
  },
  'corner-camp': {
    ...CAMP,
    // TUNE: the client draws the corner camp ring 45 m across (MapView.constants.ts), so its
    // 22.5 m radius less the camp's 1 m footprint: the boss guards exactly the ring.
    leashRadius: 21.5,
    respawnSeconds: 300, // TUNE: game doc "spawns new bosses every 5 minutes"
    // TUNE: the boss is bigger and reaches further than any guard (1.5 + 2 + a Sentinel's 1.25 m)
    leashTolerance: 7,
    activation: 'match-start', // game doc: corner camps hold their bosses "from the start"
    table: [{ mobId: 'corner-boss', count: 1 }],
  },
};

/**
 * Each structure's guards, keyed by structure definition id (architecture 07 §6, 18 §7). Counts are balancing.md's
 * `Recommendation:` (SpawnerTower 4 light, BuffTower 6 medium, Stronghold 6 light ranged + 2 heavy
 * melee, minus 2 light per lost SpawnerTower). Ranged attacks wait for projectiles (sprint 2.3),
 * so the Stronghold's light guards fight in melee for now. Camps follow.
 */
export const GUARD_PLANS: Readonly<Record<string, GuardPlanDefinition>> = {
  'spawner-tower': {
    table: [{ mobId: 'light-guard', count: 4 }],
    leashRadius: LEASH,
    respawnSeconds: RESPAWN,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
    activation: 'match-start',
    respawn: 'each',
  },
  'buff-tower': {
    table: [{ mobId: 'medium-guard', count: 6 }],
    leashRadius: LEASH,
    respawnSeconds: RESPAWN,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
    activation: 'match-start',
    respawn: 'each',
  },
  stronghold: {
    table: [
      { mobId: 'light-guard', count: 6, shrink: { perLost: 'spawner-tower', count: 2 } },
      { mobId: 'heavy-guard', count: 2 },
    ],
    leashRadius: LEASH,
    respawnSeconds: RESPAWN,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
    activation: 'match-start',
    respawn: 'each',
  },
  ...CAMP_PLANS,
};
