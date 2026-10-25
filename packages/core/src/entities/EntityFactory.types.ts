import type { AiMemory, ControllerId } from '../content/ai/ai.types';
import type { EntityDefinitionBase } from '../content/EntityDefinition.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Where the factory finds the definition named by a `definitionId`. A `ContentCatalogue`
 * satisfies it; the factory depends on this port, not on a catalogue (dependency inversion).
 */
export interface DefinitionSource {
  /** Whether a definition has the id `id`. */
  has(id: string): boolean;
  /** The definition with the id `id`; called only after `has(id)` returned true. */
  get(id: string): EntityDefinitionBase;
}

/**
 * A controller given to one entity at spawn, in place of its definition's (architecture 11 §2,
 * 18 §8): a bot Legend's `bot-legend` controller, its difficulty and its lane in `memory`.
 */
export type ControllerSpawn = {
  readonly controllerId: ControllerId;
  readonly profileId: string;
  /** The brain's memory before its first decision. */
  readonly memory: AiMemory;
};

/** Where a new entity appears and, for entities that fight, on which team. */
export type Placement = {
  readonly position: Vec2;
  readonly team?: Team;
  /** A controller for this entity alone, in place of its definition's (a bot Legend). */
  readonly controller?: ControllerSpawn;
};
