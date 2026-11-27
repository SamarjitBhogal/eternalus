import type { DuelArenaRules, DuelProgressionRules } from './duelRules.types';

/**
 * The Duel arena: only the two Legends in a closed Cathedral whose walls cannot break, its gem
 * kept. The owner's demo feedback of 2026-11-20 (SCRUM-445, SCRUM-446, SCRUM-450) and DEC-348,
 * within DEC-36.
 */
const DUEL_ARENA: DuelArenaRules = {
  spawnsMobs: false,
  hasCaptureObjectives: false,
  // DEC-348: "no towers, gates, camps or Strongholds"; wall turrets go with their tower (DEC-348
  // (1)). Not `cathedral`: the gem stays.
  omittedStructureIds: [
    'stronghold',
    'spawner-tower',
    'buff-tower',
    'gate',
    'turret',
    'forest-camp-light',
    'forest-camp-medium',
    'forest-camp-heavy',
    'corner-camp',
  ],
  omittedObjectKinds: [
    'fort',
    'camp',
    'stronghold',
    'spawner-tower',
    'buff-tower',
    'gate',
    'turret',
  ],
  omitsSideObjects: true,
  isCathedralClosed: true,
  unbreakableCathedralKinds: ['wall'], // DEC-348 (2)
};

/** How a Duel changes levels and the ultimate meter. */
const DUEL_PROGRESSION: DuelProgressionRules = {
  legendsStartAtMaxLevel: true, // SCRUM-444
  ultimateStartCharge: 0.5, // TUNE: DEC-380 (1): "starts half-charged"
};

/** The online Duel's rules (ADR 0016, DEC-36, FR-115). */
export const DUEL_RULES = {
  /** Kills that win a Duel. TUNE: the owner's "always the minimum" of 10 or 20. */
  killTarget: 10, // TUNE: provisional until the owner fixes the Duel length
  /** The pre-match countdown, in seconds: the 3, 2, 1 the players see. */
  countdownSeconds: 3, // TUNE: the owner's 3, 2, 1, START
  /** How far each Legend starts from the Cathedral's centre, light west, dark east, in world units. */
  startOffset: 50, // TUNE: inside the transept, outside the capture floor (radius 31)
  /** What of the normal match's world a Duel keeps. */
  arena: DUEL_ARENA,
  /** How a Duel changes levels and the ultimate meter (`ProgressionSystem`). */
  progression: DUEL_PROGRESSION,
} as const;
