import type { Entity } from '../entities/Entity';

/** The unique id of an entity instance (`entity-1`, `entity-2`, ... from `EntityFactory`). */
export type EntityId = Entity['id'];

/** Why an entity left the world. Every removal names one (architecture 01 rule B). */
export type RemovalCause = 'died' | 'despawned' | 'consumed' | 'dev-removed' | 'match-ended';

/** An entity class, concrete or abstract, used to ask "how many of these?" (`Unit`, `Legend`). */
export type EntityFamily = abstract new (id: string, definitionId: string) => Entity;
