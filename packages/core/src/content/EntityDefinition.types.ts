/**
 * What every entity definition has (architecture 04 §5). Shared, immutable and keyed by `id`;
 * each family's definition adds its own fields to it.
 */
export type EntityDefinitionBase = {
  /** Kebab-case content id; never renamed once used. */
  readonly id: string;
  /** Which concrete entity class builds it (the `EntityRegistry` key). */
  readonly kind: string;
  /** The name players see. Renaming an entity changes only this. */
  readonly displayName: string;
};
