import type { WeaponDefinition } from '../content/weapons/weapons.types';
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

/** Where a new entity appears and, for entities that fight, on which team. */
export type Placement = {
  readonly position: Vec2;
  readonly team?: Team;
  /** The lane a lane structure stands on (`MapLane.id`). */
  readonly laneId?: string;
};

/**
 * Where a Legend finds the weapon its definition names (architecture 05 §10). A
 * `ContentCatalogue<WeaponDefinition>` satisfies it.
 */
export interface WeaponSource {
  /** Whether a weapon has the id `id`. */
  has(id: string): boolean;
  /** The weapon with the id `id`. */
  get(id: string): WeaponDefinition;
}
