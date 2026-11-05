import type { CONTROLLER_IDS } from './controllerIds';

/** Which controller drives an entity (architecture 11 §2); kebab-case, never renamed once used. */
export type ControllerId = (typeof CONTROLLER_IDS)[number];

/** How often each controller decides, and how many decisions a tick may hold (11 §6). */
export type AiCadence = {
  /** Ticks between two decisions of one entity, per controller. */
  readonly everyTicks: Readonly<Record<ControllerId, number>>;
  /** At most this many decisions per tick; the rest wait for the next tick, first in line. */
  readonly maxDecisionsPerTick: number;
};

/**
 * How a horde moves together (architecture 18 §4, §5). Distances are world units (metres); none
 * changes with the tick rate.
 */
export type HordeSteeringProfile = {
  /** A mob this close to its formation slot stops steering toward it. */
  readonly slotArrivalRadius: number;
  /** Neighbours closer than this push a mob away (architecture 10 §9). */
  readonly separationRadius: number;
  /**
   * How far toward its slot a mob checks the ground; when that stretch crosses an unwalkable
   * cell it follows the lane's flow field instead (architecture 18 §5.2).
   */
  readonly blockedLookAhead: number;
  /** Push at half `separationRadius`; it scales as 1/distance, shifted to 0 at the radius (10 §9). */
  readonly separationWeight: number;
  /**
   * A combined steer shorter than this counts as none, so a settled horde stands still. A mob whose
   * pull toward its target separation cancels this way steps aside instead (`addSeparation`).
   */
  readonly minSteer: number;
  /** The formation anchor advances at this fraction of the slowest member's top speed. */
  readonly marchSpeedFactor: number;
  /**
   * The anchor stops this far in front of the edge of the horde's next standing objective
   * (architecture 18 §4, §6.2), so the front rank gathers within reach of it.
   */
  readonly objectiveHoldGap: number;
  /** Gap between members in the spawn grid; at least the largest minion's diameter. */
  readonly spawnSpacing: number;
  /** Members per row of the spawn grid. */
  readonly spawnColumns: number;
  /**
   * How far past the first walkable ground along its way out a deploying horde's rearmost
   * member's exit lies (DEC-133). A mob stops deploying there, or sooner, once its body stands
   * on walkable ground.
   */
  readonly deployClearance: number;
};

/** The weights of the lane assessment (architecture 18 §3.3, DEC-89); each term runs from 0 to 1. */
export type LaneAssessmentWeights = {
  readonly structureDamageTaken: number;
  readonly pushedBack: number;
  readonly alliesHurt: number;
};

/** The classes the aggro priority list names (architecture 11 §4.3). */
export type UnitClass = 'legend' | 'minion' | 'turret';

/**
 * One entry of a minion's target priority list (architecture 11 §4.3), best first. `x-attacking-
 * ally-y` is an enemy of class `x` whose attack target is an ally of class `y`; `closest-x` is any
 * enemy of class `x`; `lane-objective` is the horde's next standing enemy structure (18 §6.2).
 */
export type AggroPriority =
  | 'legend-attacking-ally-legend'
  | 'minion-attacking-ally-legend'
  | 'minion-attacking-ally-minion'
  | 'turret-attacking-ally-minion'
  | 'closest-minion'
  | 'closest-legend'
  | 'lane-objective';

/**
 * How a leashed mob picks and keeps targets (architecture 11 §4.3, 18 §6.1, §7): the fields
 * `LeashBehaviour` reads for minions and guards alike. Distances are metres; durations are seconds,
 * converted with the match's tick rate where they are read, except `ghostFirstWaveTicks`.
 */
export type AggroRuleDefinition = {
  readonly id: string;
  /** Enemies this close may be acquired. */
  readonly acquisitionRadius: number;
  /** Best first; an enemy that matches no entry is never acquired. */
  readonly priority: readonly AggroPriority[];
  /**
   * A target outside the leash is chased this long, then dropped; back inside sooner, it is
   * fought on. 0 drops it at once (DEC-144 E).
   */
  readonly leashGraceSeconds: number;
  /** For this long after a leash breaks, the mob leaves alone the enemy that escaped. */
  readonly aggroCooldownSeconds: number;
  /**
   * The ghosted first wave (11 §4.3, MVP-if-time): for this many ticks after the countdown, and
   * during it, Legends match no priority entry, so the opening hordes meet before a Legend can bait
   * them. 0 turns it off.
   */
  readonly ghostFirstWaveTicks: number;
};

/**
 * A horde minion's aggro profile (18 §6.1): its leash is a circle around where it took its target,
 * and it answers its horde-mates' calls for help. Only `MinionController` reads it.
 */
export type HordeAggroRuleDefinition = AggroRuleDefinition & {
  readonly controller: 'minion';
  /** A mob fights only a target this close to where it took it (MS-36, DEC-144). */
  readonly leashRadius: number;
  /**
   * An enemy this close that attacks a horde-mate may be acquired too ("call for help"). The
   * leash still applies, so a value above `leashRadius` acts as `leashRadius`.
   */
  readonly callForHelpRadius: number;
};

/**
 * A guard's aggro profile (18 §7): its leash and its mates come from its post's guard plan, so it
 * adds nothing to the shared fields. Only `GuardController` reads it.
 */
export type GuardAggroRuleDefinition = AggroRuleDefinition & { readonly controller: 'guard' };

/** Any aggro profile; `controller` names the one controller that may read it (AI56-F9). */
export type AggroProfileDefinition = HordeAggroRuleDefinition | GuardAggroRuleDefinition;

/**
 * When a unit chasing its attack target counts as stuck, and how it then goes round (owner
 * 2026-11-05, DEC-193): a mob or bot Legend that has not come `minProgress` closer to its target
 * (or to its detour waypoint) for `windowSeconds`, and is not in reach, follows the nav grid's A\*
 * path to it instead of pressing on in a straight line. Metres and seconds.
 */
export type StuckDetectionRule = {
  readonly windowSeconds: number;
  readonly minProgress: number;
  /** A detouring unit this close to its waypoint asks A\* for the next one. */
  readonly waypointRadius: number;
};

/** A controller's plain-data memory between decisions: FSM state, target, timers (11 §2). */
export type AiMemory = Readonly<Record<string, string | number | boolean | null>>;

/**
 * How hard a bot Legend plays (architecture 11 §4.2): a `BotDifficultyDefinition` in
 * `content/ai/difficulties/`, named by the bot's AI profile. Distances are metres.
 */
export type BotDifficultyDefinition = {
  readonly id: string;
  /** Below this fraction of its health the bot retreats (`Survive`). */
  readonly retreatHealthFraction: number;
  /** A retreating bot rejoins its lane at or above this fraction of its health. */
  readonly rejoinHealthFraction: number;
  /** Enemies this close make the bot fight (`Fight`). */
  readonly engageRadius: number;
  /** A bot this close to where it is going stops there. */
  readonly arrivalDistance: number;
  /** The `UtilityScorer`'s weight for each target consideration. */
  readonly utilityWeights: Readonly<Record<'closeness' | 'weakness', number>>;
  /** The chance, each time a cast is allowed, that a fighting bot casts an ability (0 to 1). */
  readonly abilityUseChance: number;
  /** At least this many ticks between two casts. */
  readonly castIntervalTicks: number;
};

/** How the Rover hunts and mirrors the human (architecture 11 §4.7). Distances are metres. */
export type RoverTactics = {
  /** How far the Rover senses Legends for `HumanProximity` and mirroring. */
  readonly senseRadius: number;
  /** The human this close may be hunted. */
  readonly huntRadius: number;
  /** It hunts when its health fraction leads the human's by at least this much. */
  readonly huntAdvantage: number;
  /**
   * How it weighs a lane (11 §4.7): `pressure` (`StructurePressure`: how badly its team is doing
   * there, 0 to 1) against `human` (`HumanProximity`: 1 on the human's lane).
   */
  readonly laneWeights: Readonly<Record<'pressure' | 'human', number>>;
};
