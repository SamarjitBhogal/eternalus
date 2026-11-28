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

/** The fields of an aggro rule that are the same as authored and as loaded. */
type AggroRuleBase = {
  readonly id: string;
  /** Enemies this close may be acquired. */
  readonly acquisitionRadius: number;
  /** Best first; an enemy that matches no entry is never acquired. */
  readonly priority: readonly AggroPriority[];
  /**
   * The ghosted first wave (11 §4.3, MVP-if-time): for this many ticks after the countdown, and
   * during it, Legends match no priority entry, so the opening hordes meet before a Legend can bait
   * them. 0 turns it off.
   */
  readonly ghostFirstWaveTicks: number;
};

/**
 * How a leashed mob picks and keeps targets, as authored (architecture 11 §4.3, 18 §6.1, §7).
 * Distances are metres; durations are seconds, except `ghostFirstWaveTicks`.
 */
type AuthoredAggroRule = AggroRuleBase & {
  /**
   * A target outside the leash is chased this long, then dropped; back inside sooner, it is
   * fought on. 0 drops it at once (DEC-144 E).
   */
  readonly leashGraceSeconds: number;
  /** For this long after a leash breaks, the mob leaves alone the enemy that escaped. */
  readonly aggroCooldownSeconds: number;
};

/**
 * An aggro rule as loaded (`loadAggroRules`): the fields `LeashBehaviour` reads for minions and
 * guards alike, with the durations converted to ticks once, at load (architecture 03 §8).
 */
export type AggroRuleDefinition = AggroRuleBase & {
  /** `leashGraceSeconds` in ticks; 0 drops the target at once. */
  readonly leashGraceTicks: number;
  /** `aggroCooldownSeconds` in ticks. */
  readonly aggroCooldownTicks: number;
};

/**
 * What a horde minion's aggro profile adds (18 §6.1): its leash is a circle around where it took
 * its target, and it answers its horde-mates' calls for help. Only `MinionController` reads it.
 */
type HordeAggroFields = {
  readonly controller: 'minion';
  /** A mob fights only a target this close to where it took it (MS-36, DEC-144). */
  readonly leashRadius: number;
  /**
   * An enemy this close that attacks a horde-mate may be acquired too ("call for help"). The
   * leash still applies, so a value above `leashRadius` acts as `leashRadius`.
   */
  readonly callForHelpRadius: number;
};

/** A horde minion's aggro profile as authored, in seconds. */
export type AuthoredHordeAggroRule = AuthoredAggroRule & HordeAggroFields;

/** A horde minion's aggro profile as loaded, in ticks. */
export type HordeAggroRuleDefinition = AggroRuleDefinition & HordeAggroFields;

/**
 * What a guard's aggro profile adds (18 §7): its leash and its mates come from its post's guard
 * plan. Only `GuardController` reads it.
 */
type GuardAggroFields = {
  readonly controller: 'guard';
  /**
   * Takes any enemy inside the post's leash, not only within `acquisitionRadius` of the guard: a
   * capture point's defenders, whose leash is the zone's reach (DEC-257, DEC-260).
   */
  readonly shouldAcquireAcrossLeash?: boolean;
};

/** A guard's aggro profile as authored, in seconds. */
export type AuthoredGuardAggroRule = AuthoredAggroRule & GuardAggroFields;

/** A guard's aggro profile as loaded, in ticks. */
export type GuardAggroRuleDefinition = AggroRuleDefinition & GuardAggroFields;

/** Any aggro profile as authored; `controller` names the one controller that may read it. */
export type AuthoredAggroProfile = AuthoredHordeAggroRule | AuthoredGuardAggroRule;

/** Any aggro profile as loaded; `controller` names the one controller that may read it (AI56-F9). */
export type AggroProfileDefinition = HordeAggroRuleDefinition | GuardAggroRuleDefinition;

/** The fields of a stuck-detection rule that are the same as authored and as loaded. */
type StuckDetectionBase = {
  readonly minProgress: number;
  /** A detouring unit this close to its waypoint asks A\* for the next one. */
  readonly waypointRadius: number;
  /**
   * At most this many A\* plans a tick (architecture 11 §6, cost control); a unit due one past it
   * keeps it due and plans on a later tick.
   */
  readonly maxPlansPerTick: number;
};

/**
 * When a unit chasing its attack target counts as stuck, and how it then goes round (owner
 * 2026-11-05, DEC-193), as authored: a mob or bot Legend that has not come `minProgress` closer to
 * its target (or to its detour waypoint) for `windowSeconds`, and is not in reach, follows the nav
 * grid's A\* path to it instead of pressing on in a straight line. Metres and seconds.
 */
export type AuthoredStuckDetectionRule = StuckDetectionBase & { readonly windowSeconds: number };

/** A stuck-detection rule as loaded (`loadStuckDetection`): the window in ticks, converted once. */
export type StuckDetectionRule = StuckDetectionBase & { readonly windowTicks: number };

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

/**
 * What each boss move effect reads (architecture 11 §4.6's `effectId`), by effect id; the
 * strategy that lands it is registered under the same id (`systems/defaultBossMoveEffects.ts`).
 * Hits go to every living non-neutral unit whose centre is inside the shape (body edges ignored).
 */
type BossMoveEffectFields = {
  /** A circle around the boss (the slam). */
  readonly area: { readonly radius: number; readonly damage: number };
  /**
   * A cone from the boss along its facing (the sweeps): `radius` long, `halfAngleDegrees` either
   * side of the facing. Each unit hit is pushed `knockback` metres straight away from the boss.
   */
  readonly cone: {
    readonly radius: number;
    readonly halfAngleDegrees: number;
    readonly damage: number;
    readonly knockback: number;
  };
  /**
   * A dash along the boss's facing (the charge): the boss is pushed `length` metres (less where
   * its zone's edge comes first), and every unit whose centre lies on that path, within
   * `width / 2` of its line, takes `damage`.
   */
  readonly charge: { readonly length: number; readonly width: number; readonly damage: number };
  /**
   * A straight line from the boss along its facing (the beam): every unit whose centre lies within
   * `length` ahead and `width / 2` of the line takes `damage`. The boss does not move.
   */
  readonly line: { readonly length: number; readonly width: number; readonly damage: number };
  /** The roar: `boss-move-executed` and nothing else (balancing.md gives the GreaterBoss's none). */
  readonly roar: object;
};

/** A boss move effect's id: the key of its fields and of its strategy. */
export type BossMoveEffectId = keyof BossMoveEffectFields;

/** The parts every boss move has, whatever its effect. Metres and seconds. */
type BossMoveTiming = {
  readonly id: string;
  /** A target this close (centre to centre) lets the boss start the move. */
  readonly range: number;
  /** From the telegraph to the landing. */
  readonly telegraphSeconds: number;
  /** After the landing the boss stands this long before it roams again. */
  readonly recoverSeconds: number;
  /** At least this long between two landings of this move. */
  readonly cooldownSeconds: number;
};

/** A boss move whose effect is `K`, with that effect's fields. */
export type BossMoveOf<K extends BossMoveEffectId> = BossMoveTiming & {
  readonly effect: K;
} & BossMoveEffectFields[K];

/**
 * One boss move (architecture 11 §4.6): telegraphed, landed, recovered from. `effect` is 11
 * §4.6's `effectId`: it names the strategy that lands the move and the fields it reads. Moves are
 * authored in seconds, converted with the match's tick rate where they are read (11's
 * Implementation status).
 */
export type BossMoveDefinition = {
  readonly [K in BossMoveEffectId]: BossMoveOf<K>;
}[BossMoveEffectId];

/**
 * A boss's AI profile (architecture 11 §2, §4.6): every number `BossController` reads. Its zone
 * is the boss's guard post's circle (home edge plus leash), not a field here.
 */
export type BossProfileDefinition = {
  readonly id: string;
  readonly controller: 'boss';
  /** The entrance (the GreaterBoss's roar): the boss stands this long after it spawns. */
  readonly entranceSeconds: number;
  /** "Never stands still": a new roam point at least this often, so it idles no longer. */
  readonly roamSeconds: number;
  /** A roam point this close counts as reached; the boss picks the next one. */
  readonly roamArrivalRadius: number;
  /** Roam points and chase points stay this far inside the zone's edge. */
  readonly zoneMargin: number;
  /** Its moves, in rotation order: the boss uses them one after another, then starts again. */
  readonly moves: readonly BossMoveDefinition[];
};
