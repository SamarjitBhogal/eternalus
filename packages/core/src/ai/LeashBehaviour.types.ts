import type { Command } from '../commands/Command.types';
import type {
  AggroProfileDefinition,
  AggroRuleDefinition,
  ControllerId,
} from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { LaneObjective } from '../state/LaneStructures.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { UnitClassifier } from './aggroRank.types';
import type { Perception } from './perception/Perception';

/** A leashed mob's memory between decisions (18 §6.1, §7); `Idle` names its resting state. */
export type LeashMemory<Idle extends string> = {
  readonly fsm: Idle | 'engaging';
  readonly targetId: string | null;
  /** 0 while the target is inside the leash; else the tick at which the leash breaks (MS-36). */
  readonly breakAtTick: number;
  /** Until this tick the mob leaves `escapedId` alone, unless it attacks the mob or a horde-mate. */
  readonly cooldownUntilTick: number;
  /** The target that escaped at the last leash break (DEC-144 F); `null` for none. */
  readonly escapedId: string | null;
  /** Where the mob was when it took its target; only a switch to another target moves it (DEC-160). */
  readonly leashX: number;
  readonly leashY: number;
};

/** Everything one decision reads, gathered once; `Rule` is the controller's aggro profile type. */
export type LeashSituation<Rule extends AggroRuleDefinition = AggroRuleDefinition> = {
  readonly state: GameState;
  readonly id: EntityId;
  readonly team: Team;
  readonly position: Vec2;
  readonly rule: Rule;
  readonly perception: Perception;
  /** A structure the mob may attack as `lane-objective` (18 §6.2); `null` for none. */
  readonly objective: LaneObjective | null;
};

/** One step of the state machine: the memory after it and the commands it emits. */
export type LeashStep<Idle extends string> = {
  readonly memory: LeashMemory<Idle>;
  readonly commands: readonly Command[];
};

/** A best candidate so far. */
export type LeashCandidate = { readonly id: EntityId; readonly rank: number; readonly gap: number };

/** What differs between the controllers that share `LeashBehaviour`. */
export type LeashRules<
  Idle extends string,
  Rule extends AggroRuleDefinition = AggroRuleDefinition,
> = {
  /** The resting state's name: `marching` for minions, `holding` for guards. */
  readonly idle: Idle;
  /** Whether `point` (a target or a candidate) lies outside the mob's leash. */
  readonly isOutsideLeash: (
    situation: LeashSituation<Rule>,
    memory: LeashMemory<Idle>,
    point: Vec2,
  ) => boolean;
  /** A candidate the perception query cannot see (the lane objective), ranked first in. */
  readonly extra: (situation: LeashSituation<Rule>) => LeashCandidate | null;
  /** Whether an attack on `victimId` calls the mob for help: a horde-mate, or a fellow guard. */
  readonly isMate: (situation: LeashSituation<Rule>, victimId: EntityId) => boolean;
  /** How far from the mob an enemy attacking a mate may stand to be taken (DEC-144 D). */
  readonly helpRadius: (situation: LeashSituation<Rule>) => number;
};

/** What a leashed controller reads besides the state, injected so it holds no content. */
export type LeashControllerContent = {
  /** Aggro profiles by id; a mob's brain names one, and only its own controller accepts it. */
  readonly aggro: Readonly<Record<string, AggroProfileDefinition>>;
  /** Which priority class each entity kind belongs to. */
  readonly classOf: UnitClassifier;
};

/** What a leashed controller adds to the decision it shares (`decideLeashed`, DEC-168 B1). */
export type LeashDecisionParts<Idle extends string, Rule extends AggroRuleDefinition> = {
  /** The controller's id, for the error message. */
  readonly controllerId: ControllerId;
  /** The brain's aggro profile if it is one of this controller's own (AI56-F9), else `undefined`. */
  readonly profileOf: (profileId: string) => Rule | undefined;
  /** Every state of the controller, to read a brain's `fsm` back without a cast. */
  readonly states: readonly (Idle | 'engaging')[];
  /** The resting state. */
  readonly idle: Idle;
  /** The mob's rules and objective this decision, or `null` when it cannot decide (no post). */
  readonly situate: (
    state: GameState,
    entityId: EntityId,
  ) => { readonly rules: LeashRules<Idle, Rule>; readonly objective: LaneObjective | null } | null;
};
