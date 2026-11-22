import type { TurretAmmoDefinition } from '../content/structures/turrets.types';
import type { Entity } from '../entities/Entity';

/** The unique id of an entity instance (`entity-1`, `entity-2`, ... from `EntityFactory`). */
export type EntityId = Entity['id'];

/** Why an entity left the world. Every removal names one (architecture 01 rule B). */
export type RemovalCause = 'died' | 'despawned' | 'consumed' | 'dev-removed' | 'match-ended';

/** An entity class, concrete or abstract, used to ask "how many of these?" (`Unit`, `Legend`). */
export type EntityClass = abstract new (id: string, definitionId: string) => Entity;

/** One removal the store made this tick. */
export type RemovalRecord = { readonly entityId: EntityId; readonly cause: RemovalCause };

/**
 * A turret's ammo as `ai/` reads it (`EntityStore.turretAmmoOf`): what it carries, best first, and
 * the id of the one it has loaded (architecture 07 §5 `TurretState`).
 */
export type TurretAmmoView = {
  readonly ammo: readonly TurretAmmoDefinition[];
  readonly loadedId: string;
};
