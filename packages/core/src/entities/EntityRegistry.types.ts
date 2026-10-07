import type { Entity } from './Entity';

/** A concrete (non-abstract) entity class the registry can construct. */
export type EntityConstructor = new (id: string, definitionId: string) => Entity;
