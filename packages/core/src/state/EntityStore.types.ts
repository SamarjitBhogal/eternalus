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
 * What `EntityStore.aimPointOf` aimed at: the nearest point of the target's `'outline'`, the
 * attacker's own position because it stands `'inside'` the outline (in reach, DEC-234), the
 * target's `'centre'` (it has no outline), or `null` when there is nothing to aim at.
 */
export type AimedAt = 'outline' | 'inside' | 'centre' | null;
