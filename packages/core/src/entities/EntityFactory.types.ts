import type { AiMemory, ControllerId } from '../content/ai/ai.types';
import type { WeaponDefinition } from '../content/weapons/weapons.types';
import type { EntityDefinitionBase } from '../content/EntityDefinition.types';
import type { Loadout } from '../loadout/Loadout.types';
import type { LoadoutProblem } from '../loadout/LoadoutValidator.types';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';

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
  /** The lane a lane structure stands on (`MapLane.id`). */
  readonly laneId?: string;
  /** The map feature a structure is built from (`MapFeature.id`). */
  readonly mapFeatureId?: string;
  /** A controller for this entity alone, in place of its definition's (a bot Legend). */
  readonly controller?: ControllerSpawn;
  /**
   * The direction a unit faces until it first moves or attacks, of any length (DEC-216 (6)). A
   * unit given none, or a zero one, starts at `INITIAL_FACING`.
   */
  readonly facing?: Vec2;
  /** The ground a zone covers, as polygons in world units (zones only, `ZoneArea`). */
  readonly area?: readonly Polygon[];
  /**
   * The loadout a Legend spawns with (Legends only; reference 08, 05 §12): the human's saved
   * loadout. A Legend given none spawns with its class's default loadout.
   */
  readonly loadout?: Loadout;
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

/** A spawn loadout that failed validation, and the auto-build the factory used instead (05 §12). */
export type LoadoutRejection = {
  readonly definitionId: string;
  readonly given: Loadout;
  readonly problems: readonly LoadoutProblem[];
  readonly used: Loadout;
};

/**
 * What the factory equips Legends from (architecture 05 §10, §12): the weapons, put in every spawn
 * context, and who hears of a spawn loadout it rejected (a diagnostic; `Simulation` logs it).
 */
export type LegendEquipment = {
  readonly weapons: WeaponSource;
  readonly onLoadoutRejected?: (rejection: LoadoutRejection) => void;
};
