import type { GuardPlanDefinition } from './structures.types';

const LEASH = 8; // TUNE: balancing.md "leash radius 8 m"
const RESPAWN = 120; // TUNE: game doc "respawn every 2 minutes"
const POST_GAP = 2; // TUNE: no reference value; just outside the footprint
// TUNE: owner 2026-11-02 (DEC-144): per guard, one decision's walk (10 ticks at its own top
// speed) plus the farthest it stands from a target in reach (its radius + the largest target's
// radius + its reach). The tightest is the capture point boss against a Sentinel: walk
// 10 × 2.8 / 30 ≈ 0.93 m plus stance 1.2 + 1.25 + 1.5 = 3.95 m, so 4.88 m and about 0.1 m of
// margin: a larger or faster guard needs a larger tolerance.
// guardPlans.test.ts checks the sum against every guard and target in content.
const TOLERANCE = 5;

const CAMP = {
  leashRadius: 6, // TUNE: balancing.md camp leash
  postGap: POST_GAP,
  leashTolerance: TOLERANCE,
  // requirements doc: camps are inactive until the countdown ends
  activation: { at: 'countdown-end', delaySeconds: 0 },
  // TUNE: balancing.md "a cleared camp respawns 120 s later"
  respawn: { kind: 'group', seconds: 120 },
} as const;

/**
 * The forest camps' groups (architecture 18 §7.1), keyed by camp definition id. Compositions are
 * balancing.md's `Recommendation:` (light 4 light; medium 2 medium + 2 light; heavy 1 heavy + 2
 * medium).
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
};

/**
 * Each structure's guards, keyed by structure definition id (architecture 07 §6, 18 §7). Counts are balancing.md's
 * `Recommendation:` (SpawnerTower 4 light, BuffTower 6 medium, Stronghold 6 light ranged + 2 heavy
 * melee, minus 2 light per lost SpawnerTower). Ranged attacks wait for projectiles (sprint 2.3),
 * so the Stronghold's light guards fight in melee for now. Camps and the outer capture points'
 * mini-boss follow.
 */
export const GUARD_PLANS: Readonly<Record<string, GuardPlanDefinition>> = {
  'spawner-tower': {
    table: [{ mobId: 'light-guard', count: 4 }],
    leashRadius: LEASH,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
    activation: { at: 'match-start' },
    respawn: { kind: 'each', seconds: RESPAWN },
  },
  'buff-tower': {
    table: [{ mobId: 'medium-guard', count: 6 }],
    leashRadius: LEASH,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
    activation: { at: 'match-start' },
    respawn: { kind: 'each', seconds: RESPAWN },
  },
  stronghold: {
    table: [
      { mobId: 'light-guard', count: 6, shrink: { perLost: 'spawner-tower', count: 2 } },
      { mobId: 'heavy-guard', count: 2 },
    ],
    leashRadius: LEASH,
    postGap: POST_GAP,
    leashTolerance: TOLERANCE,
    activation: { at: 'match-start' },
    respawn: { kind: 'each', seconds: RESPAWN },
  },
  ...CAMP_PLANS,
  // The outer capture points' mini-boss (18 §7.1); the Cathedral's zone has no plan.
  'capture-point': {
    table: [{ mobId: 'capture-point-boss', count: 1 }],
    leashRadius: 35, // TUNE: the fort court's inscribed circle (buildingGeometry.ts fort)
    postGap: 25, // TUNE: no reference value; out in the court, clear of the keep
    leashTolerance: TOLERANCE,
    // TUNE: reference 04 "Mini-bosses at the quarter mark": the default timeline's quarter-mark
    // entry (0.25 × plannedMatchSeconds 1800, from match start: 450 s) less the 10 s countdown,
    // since this delay counts from the countdown's end. guardPlans.test.ts derives it from the
    // config; content may not import config/, so the number is written here.
    activation: { at: 'countdown-end', delaySeconds: 440 },
    respawn: { kind: 'never' }, // reference 04: one mini-boss per match
  },
};
