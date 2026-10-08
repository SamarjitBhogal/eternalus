import type { EntityRegistry } from './EntityRegistry';
import type { Entity } from './Entity';

/** A concrete (non-abstract) entity class the registry can construct. */
export type EntityConstructor = new (id: string, definitionId: string) => Entity;

/**
 * A group of entity kinds that registers itself. Each family owns one module, so adding a kind to
 * one family never edits another family's files.
 */
export interface EntityModule {
  /** Registers this module's kinds in `registry`. */
  register(registry: EntityRegistry): void;
}
