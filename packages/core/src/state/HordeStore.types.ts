import type { EntityId } from './EntityStore.types';
import type { Horde } from './Horde.types';

/** A horde as `HordeStore` keeps it: writable, so membership and progress change in place. */
export type StoredHorde = {
  -readonly [K in keyof Horde]: Horde[K] extends readonly EntityId[] ? EntityId[] : Horde[K];
};
