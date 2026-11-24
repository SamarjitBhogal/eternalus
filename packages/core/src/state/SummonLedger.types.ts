import type { EntityId } from './EntityStore.types';

/** One body a caster placed: what it was built from and its id. */
export type Placed = { readonly definitionId: string; readonly entityId: EntityId };
