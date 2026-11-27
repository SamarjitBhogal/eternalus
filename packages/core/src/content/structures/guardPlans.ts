import { CATHEDRAL_BOSS, CATHEDRAL_BOSS_ARENA } from '../mobs/cathedralBoss';
import { CAPTURE_POINT_COURT } from '../zones/capturePointCourt';
import { CORNER_CAMP_RING } from './cornerCampRing';
import { GUARD_LEASH } from './guardLeash';
import type { AuthoredGuardPlan, CheckpointDefenderPlanDefinition } from './structures.types';

const RESPAWN = 120; // TUNE: game doc "respawn every 2 minutes"
// TUNE: owner 2026-11-02 (DEC-144): per guard, one decision's walk (10 ticks at its own top
// speed) plus the farthest it stands from a target in reach (its radius + the largest target's
// radius + its reach). The tightest is the capture point boss against a Sentinel: walk
// 10 × 2.8 / 30 ≈ 0.93 m plus stance 1.2 + 1.25 + 1.5 = 3.95 m, so 4.88 m. DEC-181 (H2): widened
// from 5 m to 5.5 m, since at the 300-unit cap a brain can wait up to 6 ticks more for its turn
// (`AI_CADENCE.maxDecisionsPerTick`): for the boss 16 × 2.8 / 30 ≈ 1.49 m of walk, so 5.44 m and
// about 0.06 m of margin; a larger or faster guard needs a larger tolerance.
// guardPlans.test.ts checks both sums against every guard and target in content.
const TOLERANCE = 5.5;

const CAMP = {
  leashRadius: GUARD_LEASH.camp,
  postGap: GUARD_LEASH.postGap,
  leashTolerance: TOLERANCE,
  // requirements doc: camps are inactive until the countdown ends
  activation: { at: 'countdown-end', delaySeconds: 0 },
  // TUNE: balancing.md "a cleared camp respawns 120 s later"
  respawn: { kind: 'group', seconds: 120 },
  canLevel: true, // DEC-260 (owner 2026-11-20): forest-camp mobs level (changes DEC-165)
} as const;

/**
 * The forest camps' groups (architecture 18 §7.1), keyed by camp definition id. Compositions are
 * balancing.md's `Recommendation:` (light 4 light; medium 2 medium + 2 light; heavy 1 heavy + 2
 * medium). The corner camp holds one corner boss (game doc "Outer (Corner) Camps"; interim,
 * DEC-236).
 */
const CAMP_PLANS: Readonly<Record<string, AuthoredGuardPlan>> = {
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
    table: [{ mobId: 'corner-boss', count: 1 }],
    leashRadius: CORNER_CAMP_RING.leashRadius, // the boss guards exactly the ring
    postGap: CORNER_CAMP_RING.postGap,
    // DEC-296 (2): DEC-181's sum for the boss, which DEC-181's 5.5 m does not cover: 16 ticks (a
    // decision plus the wait at the unit cap) × 2.5 m/s / 30 ≈ 1.33 m of walk, plus its stance
    // 1.5 + 1.25 (a Sentinel, the largest unit it can target: it is neutral, so never another
    // neutral mob) + 2 reach = 4.75 m, so about 6.08 m; 7 m leaves about 0.9 m of margin.
    // guardPlans.test.ts checks the sum.
    leashTolerance: 7,
    activation: { at: 'match-start' }, // game doc: corner camps hold their bosses "from the start"
    // TUNE: DEC-12; game doc "spawns new bosses every 5 minutes". `group`, not `each`: with one
    // boss both bring it back 300 s after it dies, and only `group` announces `camp-cleared`.
    respawn: { kind: 'group', seconds: 300 },
    canLevel: false, // DEC-260 names forest-camp mobs only
  },
};

/**
 * Each structure's guards, keyed by structure definition id (architecture 07 §6, 18 §7). Counts are balancing.md's
 * `Recommendation:` (SpawnerTower 4 light, BuffTower 6 medium, Stronghold 6 light ranged + 2 heavy
 * melee, minus 2 light per lost SpawnerTower). Ranged attacks wait for projectiles (sprint 2.3),
 * so the Stronghold's light guards fight in melee for now. The forest camps' groups and the outer
 * capture points' mini-boss follow.
 */
export const GUARD_PLANS: Readonly<Record<string, AuthoredGuardPlan>> = {
  'spawner-tower': {
    table: [{ mobId: 'light-guard', count: 4 }],
    leashRadius: GUARD_LEASH.tower,
    postGap: GUARD_LEASH.postGap,
    leashTolerance: TOLERANCE,
    activation: { at: 'match-start' },
    respawn: { kind: 'each', seconds: RESPAWN },
    canLevel: true, // DEC-165: tower guards level
  },
  'buff-tower': {
    table: [{ mobId: 'medium-guard', count: 6 }],
    leashRadius: GUARD_LEASH.tower,
    postGap: GUARD_LEASH.postGap,
    leashTolerance: TOLERANCE,
    activation: { at: 'match-start' },
    respawn: { kind: 'each', seconds: RESPAWN },
    canLevel: true, // DEC-165: tower guards level
  },
  stronghold: {
    table: [
      { mobId: 'light-guard', count: 6, shrink: { perLost: 'spawner-tower', count: 2 } },
      { mobId: 'heavy-guard', count: 2 },
    ],
    leashRadius: GUARD_LEASH.tower,
    postGap: GUARD_LEASH.postGap,
    leashTolerance: TOLERANCE,
    activation: { at: 'match-start' },
    respawn: { kind: 'each', seconds: RESPAWN },
    canLevel: true, // DEC-165: tower guards level
  },
  ...CAMP_PLANS,
  // The outer capture points' mini-boss and its support mobs (18 §7.1, reference 04 "along with
  // high-power enemy and support mobs"). Posts share the court's
  // ring, spread evenly around it with the boss.
  'capture-point': {
    table: [
      { mobId: 'capture-point-boss', count: 1 },
      // TUNE: no reference count for the support mobs; balancing.md's checkpoint-2 capture point
      // guard set (2 heavy + 4 light), the heavies being the "high-power" mobs.
      { mobId: 'capture-point-heavy-guard', count: 2 },
      { mobId: 'capture-point-light-guard', count: 4 },
    ],
    leashRadius: CAPTURE_POINT_COURT.leashRadius,
    postGap: CAPTURE_POINT_COURT.postGap,
    leashTolerance: TOLERANCE,
    // TUNE: reference 04 "Mini-bosses at the quarter mark": the default timeline's quarter-mark
    // entry (0.25 × plannedMatchSeconds 1800 = 450 s) counted from the countdown's end, as this
    // delay is (DEC-282). guardPlans.test.ts derives it from the config; content may not import
    // config/, so the number is written here.
    activation: { at: 'countdown-end', delaySeconds: 450 },
    // reference 04: one mini-boss per match; its support mobs do not come back either until
    // respawning guards is signed off (INBOX.md)
    respawn: { kind: 'never' },
    canLevel: true, // DEC-350 (4): the capture point boss group levels
  },
  'cathedral-capture-point': {
    isLocalOnly: true,
    table: [{ mobId: CATHEDRAL_BOSS.id, count: 1 }],
    leashRadius: CATHEDRAL_BOSS_ARENA.leash,
    postGap: CATHEDRAL_BOSS_ARENA.postGap,
    leashTolerance: CATHEDRAL_BOSS_ARENA.tolerance,
    activation: { at: 'timeline', entryId: 'mid-game' },
    announcesBoss: true,
    canLevel: false,
    roams: true,
    respawn: { kind: 'never' },
  },
};

/**
 * Each capture-point checkpoint's defenders, keyed by checkpoint (architecture 07 §7, 18 §7.1).
 * Compositions are balancing.md's `Recommendation:` (checkpoint 1: 4 medium; checkpoint 2: 2 heavy
 * + 4 light), on the assist mobs (DEC-260).
 * Checkpoint 3's one massive mob is MVP-if-time (reference 02 "Assist mobs") and has no row yet.
 */
const DEFENDERS = {
  postGap: GUARD_LEASH.checkpointPostRing,
  leashTolerance: TOLERANCE,
  canLevel: true, // DEC-260: owned and neutral defenders level
} as const;

export const CHECKPOINT_DEFENDERS: Readonly<Record<number, CheckpointDefenderPlanDefinition>> = {
  1: {
    ...DEFENDERS,
    table: [{ mobId: 'medium-assist-mob', count: 4 }], // TUNE: balancing.md 4 medium
  },
  2: {
    ...DEFENDERS,
    table: [
      { mobId: 'heavy-assist-mob', count: 2 }, // TUNE: balancing.md 2 heavy
      { mobId: 'light-assist-mob', count: 4 }, // TUNE: balancing.md 4 light
    ],
  },
};

/**
 * The most checkpoint defenders one capture point holds, living (of any side) or waiting for room
 * under the unit cap (DEC-350): one full defence, checkpoint 2's 2 heavy + 4 light plus checkpoint
 * 1's 4 medium, so the first push always gets its full set and a contested point never builds a
 * crowd. Review it if checkpoint 3's massive mob is added.
 */
export const CHECKPOINT_DEFENDER_LIMIT = 10; // TUNE: DEC-350
