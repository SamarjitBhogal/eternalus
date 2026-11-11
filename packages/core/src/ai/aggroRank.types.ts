import type { EntityId } from '../state/EntityStore.types';
import type { AggroPriority, UnitClass } from '../content/ai/ai.types';
import type { EntityStore } from '../state/EntityStore';
import type { Team } from '../teams/teams.types';

/** The class of an entity kind, or `null` for a kind the priority list never names. */
export type UnitClassifier = (kind: string) => UnitClass | null;

/** Who ranks, by which list, over which entities (architecture 11 §4.3). */
export type AggroRankOptions = {
  /** The ranking unit's team: allies are on it, enemies are not. */
  readonly team: Team;
  readonly priority: readonly AggroPriority[];
  readonly entities: EntityStore;
  readonly classOf: UnitClassifier;
  /** The horde's next objective (18 §6.2); it matches `lane-objective`. */
  readonly objectiveId?: EntityId | null;
};
