import type { Command } from '../commands/Command.types';
import type { AggroRuleDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { LaneObjective } from '../state/LaneStructures.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
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
  /** Where the mob was when it took its target. */
  readonly leashX: number;
  readonly leashY: number;
};

/** Everything one decision reads, gathered once. */
export type LeashSituation = {
  readonly state: GameState;
  readonly id: EntityId;
  readonly team: Team;
  readonly position: Vec2;
  readonly rule: AggroRuleDefinition;
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
export type LeashRules<Idle extends string> = {
  /** The resting state's name: `marching` for minions, `holding` for guards. */
  readonly idle: Idle;
  /** Whether `point` (a target or a candidate) lies outside the mob's leash. */
  readonly isOutsideLeash: (
    situation: LeashSituation,
    memory: LeashMemory<Idle>,
    point: Vec2,
  ) => boolean;
  /** A candidate the perception query cannot see (the lane objective), ranked first in. */
  readonly extra: (situation: LeashSituation) => LeashCandidate | null;
  /** Whether an attack on `victimId` calls the mob for help: a horde-mate, or a fellow guard. */
  readonly isMate: (situation: LeashSituation, victimId: EntityId) => boolean;
  /** How far from the mob an enemy attacking a mate may stand to be taken (DEC-144 D). */
  readonly helpRadius: (situation: LeashSituation) => number;
};
