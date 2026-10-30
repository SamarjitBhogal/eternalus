import type { LaneObjective } from '../state/LaneStructures.types';
import type { Command } from '../commands/Command.types';
import type { AggroRuleDefinition } from '../content/ai/ai.types';
import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { UnitClassifier } from './aggroRank.types';
import type { Perception } from './perception/Perception';

/** A minion's state (architecture 18 §6.1). */
export type MinionState = 'marching' | 'engaging' | 'returning';

/** A minion's memory between decisions (18 §6.1), as it sits in its brain. */
export type MinionMemory = {
  readonly fsm: MinionState;
  readonly targetId: string | null;
  /** The chase ends at this tick. */
  readonly aggroUntilTick: number;
  /** The mob may acquire again from this tick. */
  readonly cooldownUntilTick: number;
  /** Where the mob left its formation: the leash is measured from here. */
  readonly leashX: number;
  readonly leashY: number;
};

/** What `MinionController` reads besides the state, injected so it holds no content. */
export type MinionControllerContent = {
  /** Aggro profiles by id; a minion's brain names one. */
  readonly aggro: Readonly<Record<string, AggroRuleDefinition>>;
  /** Formations by id, to find a returning mob's slot. */
  readonly formations: Readonly<Record<string, FormationDefinition>>;
  /** Which priority class each entity kind belongs to. */
  readonly classOf: UnitClassifier;
};

/** One step of the state machine: the memory after it and the commands it emits. */
export type MinionStep = { readonly memory: MinionMemory; readonly commands: readonly Command[] };

/** Everything one decision reads, gathered once. */
export type MinionSituation = {
  readonly state: GameState;
  readonly id: EntityId;
  readonly team: Team;
  readonly position: Vec2;
  readonly rule: AggroRuleDefinition;
  readonly perception: Perception;
  /** The horde's next objective while it is breakable (18 §6.2); `null` otherwise. */
  readonly objective: LaneObjective | null;
};
